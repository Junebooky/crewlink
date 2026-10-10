-- =====================================================================
-- CrewLink Migration 00004: Strengthen RPC Security & Applications Constraints
-- =====================================================================

-- 1. checkin_with_qr_v2: Revoke from public/anon/authenticated & Grant to service_role only
REVOKE ALL ON FUNCTION public.checkin_with_qr_v2(UUID, VARCHAR, NUMERIC, NUMERIC, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.checkin_with_qr_v2(UUID, VARCHAR, NUMERIC, NUMERIC, JSONB) TO service_role;

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
    v_role TEXT := auth.role();
BEGIN
    -- Explicit check that caller is service_role (or postgres superuser for migrations/maintenance)
    IF v_role IS NOT NULL AND v_role NOT IN ('service_role', 'postgres') THEN
        RAISE EXCEPTION 'UNAUTHORIZED: checkin_with_qr_v2 can only be executed via service_role';
    END IF;

    -- Concurrency Control: Row-level lock on assignments FOR UPDATE
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

    -- Multi-Scan QR Challenge Verification
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

    -- State transition unification
    UPDATE public.assignments
    SET status = 'checked_in',
        checked_in_at = v_now,
        version = v_assignment.version + 1
    WHERE id = v_assignment.id;

    -- Log attendance with unique constraint guarantee
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

-- 2. get_assigned_crews: Verify organizer membership or ops/admin & exclude phone numbers
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
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
    v_caller_person_id UUID;
    v_is_authorized BOOLEAN := FALSE;
BEGIN
    -- Check caller role and organization membership
    IF public.is_ops_or_admin() THEN
        v_is_authorized := TRUE;
    ELSE
        v_caller_person_id := public.current_person_id();
        IF v_caller_person_id IS NOT NULL THEN
            SELECT EXISTS (
                SELECT 1
                FROM public.projects p
                JOIN public.organization_members om ON om.organization_id = p.organization_id
                WHERE p.id = p_project_id
                  AND om.person_id = v_caller_person_id
            ) INTO v_is_authorized;
        END IF;
    END IF;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'FORBIDDEN: Caller is not authorized to view assigned crews for project %', p_project_id;
    END IF;

    RETURN QUERY
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
END;
$$;

-- 3. Applications table constraints & policies
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check 
    CHECK (lower(status) IN ('applied', 'approved', 'rejected', 'withdrawn'));

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'applications' AND policyname = 'Crew read own applications'
    ) THEN
        CREATE POLICY "Crew read own applications" ON public.applications
            FOR SELECT TO authenticated
            USING (crew_person_id = public.current_person_id() OR public.is_ops_or_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'applications' AND policyname = 'Crew insert own applications'
    ) THEN
        CREATE POLICY "Crew insert own applications" ON public.applications
            FOR INSERT TO authenticated
            WITH CHECK (crew_person_id = public.current_person_id());
    END IF;
END $$;
