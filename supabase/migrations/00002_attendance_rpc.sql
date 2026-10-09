-- =====================================================================
-- CrewLink Migration 00002: Secure Attendance RPC v2
-- =====================================================================

-- 1. Drop deprecated/insecure legacy function if it exists
DROP FUNCTION IF EXISTS public.verify_crew_checkin(UUID, TEXT);

-- 2. Create secure checkin_with_qr_v2 function
CREATE OR REPLACE FUNCTION public.checkin_with_qr_v2(
    p_assignment_id UUID,
    p_token_hash CHAR(64),
    p_latitude NUMERIC DEFAULT NULL,
    p_longitude NUMERIC DEFAULT NULL,
    p_raw_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_assignment RECORD;
    v_shift RECORD;
    v_challenge RECORD;
    v_now TIMESTAMPTZ := now();
    v_result JSONB;
BEGIN
    -- Guard: Only service_role can directly call this RPC
    IF auth.role() <> 'service_role' THEN
        RAISE EXCEPTION 'PERMISSION_DENIED: checkin_with_qr_v2 requires service_role execution';
    END IF;

    -- Concurrency Control: Row-level lock on assignments
    SELECT id, shift_id, crew_person_id, status, checked_in_at, version
    INTO v_assignment
    FROM public.assignments
    WHERE id = p_assignment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ASSIGNMENT_NOT_FOUND: assignment % does not exist', p_assignment_id;
    END IF;

    -- Idempotency Check: Already recorded check-in returns success with already_recorded: true
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

    IF v_now < v_shift.checkin_opens_at THEN
        RAISE EXCEPTION 'CHECKIN_WINDOW_NOT_OPEN: checkin opens at %', v_shift.checkin_opens_at;
    END IF;

    IF v_now > v_shift.checkin_closes_at THEN
        RAISE EXCEPTION 'CHECKIN_WINDOW_CLOSED: checkin closed at %', v_shift.checkin_closes_at;
    END IF;

    -- Verify 60s TTL QR Challenge Token Hash
    SELECT id, shift_id, expires_at, is_used
    INTO v_challenge
    FROM public.checkin_challenges
    WHERE token_hash = p_token_hash
      AND shift_id = v_assignment.shift_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'INVALID_QR_TOKEN: token hash not recognized for shift';
    END IF;

    IF v_challenge.is_used THEN
        RAISE EXCEPTION 'QR_TOKEN_ALREADY_USED: token has already been consumed';
    END IF;

    IF v_now > v_challenge.expires_at THEN
        RAISE EXCEPTION 'QR_TOKEN_EXPIRED: token expired at %', v_challenge.expires_at;
    END IF;

    -- Mark challenge token as used
    UPDATE public.checkin_challenges
    SET is_used = TRUE
    WHERE id = v_challenge.id;

    -- Update assignment status
    UPDATE public.assignments
    SET status = 'checked_in',
        checked_in_at = v_now,
        version = v_assignment.version + 1
    WHERE id = v_assignment.id;

    -- Log attendance
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
    );

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

    -- Outbox Event for background notifications & downstream processing
    INSERT INTO public.outbox_events (
        event_type,
        payload,
        status
    ) VALUES (
        'CREW_CHECKED_IN',
        jsonb_build_object(
            'assignment_id', v_assignment.id,
            'shift_id', v_assignment.shift_id,
            'crew_person_id', v_assignment.crew_person_id,
            'checked_in_at', v_now
        ),
        'pending'
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
