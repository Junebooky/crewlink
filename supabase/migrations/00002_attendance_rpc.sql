-- =====================================================================
-- CrewLink Migration 00002: Secure Attendance RPC v2 & Privacy Views
-- =====================================================================

-- 1. Helper to find person_id from auth.uid()
CREATE OR REPLACE FUNCTION public.current_person_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT id FROM public.people WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- 2. Helper to check if caller has ops or admin platform role
CREATE OR REPLACE FUNCTION public.is_ops_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.platform_roles pr
        JOIN public.people p ON p.id = pr.person_id
        WHERE p.auth_user_id = auth.uid()
          AND pr.is_active = TRUE
          AND pr.role IN ('ops', 'admin')
    );
$$;

-- 3. Check-in RPC v2 (Supports Multi-scan dynamic QR and 1-person idempotent recording)
CREATE OR REPLACE FUNCTION public.checkin_with_qr_v2(
    p_assignment_id UUID,
    p_token_hash VARCHAR(64),
    p_latitude NUMERIC DEFAULT NULL,
    p_longitude NUMERIC DEFAULT NULL,
    p_raw_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_assignment RECORD;
    v_shift RECORD;
    v_challenge RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
    -- Concurrency Control: Row-level lock on assignments
    SELECT id, shift_id, crew_person_id, status, checked_in_at, version
    INTO v_assignment
    FROM public.assignments
    WHERE id = p_assignment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ASSIGNMENT_NOT_FOUND: assignment % does not exist', p_assignment_id;
    END IF;

    -- Idempotency Check: Already recorded check-in returns already_recorded: true
    IF v_assignment.status = 'checked_in' AND v_assignment.checked_in_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_recorded', true,
            'assignment_id', v_assignment.id,
            'checked_in_at', v_assignment.checked_in_at,
            'message', 'Check-in has already been completed.'
        );
    END IF;

    -- Check shift details & time window
    SELECT id, checkin_opens_at, checkin_closes_at
    INTO v_shift
    FROM public.shifts
    WHERE id = v_assignment.shift_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SHIFT_NOT_FOUND: associated shift % not found', v_assignment.shift_id;
    END IF;

    IF v_shift.checkin_opens_at IS NOT NULL AND v_now < v_shift.checkin_opens_at THEN
        RAISE EXCEPTION 'CHECKIN_WINDOW_NOT_OPEN: checkin opens at %', v_shift.checkin_opens_at;
    END IF;

    IF v_shift.checkin_closes_at IS NOT NULL AND v_now > v_shift.checkin_closes_at THEN
        RAISE EXCEPTION 'CHECKIN_WINDOW_CLOSED: checkin closed at %', v_shift.checkin_closes_at;
    END IF;

    -- Multi-Scan QR Challenge Verification:
    -- Valid as long as expires_at > clock_timestamp() and not revoked
    SELECT id, shift_id, expires_at, revoked_at
    INTO v_challenge
    FROM public.checkin_challenges
    WHERE token_hash = p_token_hash
      AND shift_id = v_assignment.shift_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'INVALID_QR_TOKEN: token hash not recognized for shift';
    END IF;

    IF v_challenge.revoked_at IS NOT NULL THEN
        RAISE EXCEPTION 'QR_TOKEN_REVOKED: token has been revoked';
    END IF;

    IF v_now > v_challenge.expires_at THEN
        RAISE EXCEPTION 'QR_TOKEN_EXPIRED: token expired at %', v_challenge.expires_at;
    END IF;

    -- Update assignment status
    UPDATE public.assignments
    SET status = 'checked_in',
        checked_in_at = v_now,
        version = v_assignment.version + 1
    WHERE id = v_assignment.id;

    -- Log attendance with unique constraint guarantee (1 log per assignment)
    INSERT INTO public.attendance_logs (
        assignment_id,
        checkin_method,
        recorded_at,
        latitude,
        longitude,
        raw_metadata
    ) VALUES (
        v_assignment.id,
        'qr_v2',
        v_now,
        p_latitude,
        p_longitude,
        p_raw_metadata
    ) ON CONFLICT (assignment_id, checkin_method) DO NOTHING;

    -- Record Audit Event
    INSERT INTO public.audit_events (
        actor_person_id,
        entity_type,
        entity_id,
        action,
        diff
    ) VALUES (
        v_assignment.crew_person_id,
        'assignments',
        v_assignment.id,
        'CREW_CHECKIN_QR_V2',
        jsonb_build_object(
            'previous_status', v_assignment.status,
            'new_status', 'checked_in',
            'checked_in_at', v_now
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'already_recorded', false,
        'assignment_id', v_assignment.id,
        'checked_in_at', v_now,
        'message', 'Check-in successfully recorded.'
    );
END;
$$;

-- 4. Privacy-Preserving Function to query assigned crew for a project (For client live board)
CREATE OR REPLACE FUNCTION public.get_assigned_crews(p_project_id UUID)
RETURNS TABLE (
    assignment_id UUID,
    shift_id UUID,
    shift_slot_id UUID,
    position_code TEXT,
    status TEXT,
    masked_name TEXT,
    uniform_size TEXT,
    rating_avg NUMERIC,
    checked_in_at TIMESTAMPTZ,
    departed_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT 
        a.id AS assignment_id,
        a.shift_id,
        a.shift_slot_id,
        COALESCE(ss.position_code, 'UNASSIGNED') AS position_code,
        a.status,
        CASE 
            WHEN char_length(p.full_name) <= 2 THEN left(p.full_name, 1) || '*'
            ELSE left(p.full_name, 1) || repeat('*', char_length(p.full_name) - 2) || right(p.full_name, 1)
        END AS masked_name,
        cp.uniform_size,
        COALESCE(cp.rating_avg, 5.0) AS rating_avg,
        a.checked_in_at,
        a.departed_at
    FROM public.assignments a
    JOIN public.shifts s ON s.id = a.shift_id
    JOIN public.people p ON p.id = a.crew_person_id
    LEFT JOIN public.crew_profiles cp ON cp.person_id = p.id
    LEFT JOIN public.shift_slots ss ON ss.id = a.shift_slot_id
    WHERE s.project_id = p_project_id;
$$;
