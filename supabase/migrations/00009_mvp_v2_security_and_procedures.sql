-- Migration 00009: MVP v2 Security Hardening, RLS, and Atomic RPCs
-- 1. Secure mvp_seed_registry
ALTER TABLE crewlink.mvp_seed_registry ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON crewlink.mvp_seed_registry FROM PUBLIC, anon, authenticated;
GRANT ALL ON crewlink.mvp_seed_registry TO service_role;

DROP POLICY IF EXISTS "service_role_all" ON crewlink.mvp_seed_registry;
CREATE POLICY "service_role_all" ON crewlink.mvp_seed_registry
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Enhance get_events_social_proof with verified privacy controls
DROP FUNCTION IF EXISTS crewlink.get_events_social_proof(uuid[], timestamp with time zone, boolean);

CREATE OR REPLACE FUNCTION crewlink.get_events_social_proof(
    p_project_ids UUID[],
    p_reference_time TIMESTAMPTZ DEFAULT now(),
    p_is_mvp BOOLEAN DEFAULT true
)
RETURNS TABLE (
    project_id UUID,
    applicant_count BIGINT,
    new_applicant_count_24h BIGINT,
    latest_applied_at TIMESTAMPTZ,
    avatars JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = crewlink, public
AS $$
BEGIN
    RETURN QUERY
    WITH eligible_crews AS (
        -- Valid unique crew applicants per project
        SELECT
            a.project_id,
            a.crew_person_id,
            MIN(a.applied_at) AS first_applied_at,
            cp.profile_image_url,
            -- Determine if this person is a verified demo seed
            EXISTS (
                SELECT 1 FROM crewlink.mvp_seed_registry reg
                WHERE reg.entity_type = 'person'
                  AND reg.entity_id = a.crew_person_id::text
            ) AS is_demo_crew
        FROM crewlink.applications a
        JOIN crewlink.people p ON p.id = a.crew_person_id
        LEFT JOIN crewlink.crew_profiles cp ON cp.person_id = a.crew_person_id
        WHERE a.project_id = ANY(p_project_ids)
          AND a.status IN ('applied', 'approved')
          AND p.is_active = true
        GROUP BY a.project_id, a.crew_person_id, cp.profile_image_url
    ),
    project_metrics AS (
        SELECT
            ec.project_id,
            COUNT(DISTINCT ec.crew_person_id)::BIGINT AS total_count,
            COUNT(DISTINCT CASE 
                WHEN ec.first_applied_at >= (p_reference_time - INTERVAL '24 hours') 
                THEN ec.crew_person_id 
            END)::BIGINT AS new_24h_count,
            MAX(ec.first_applied_at) AS latest_applied_at
        FROM eligible_crews ec
        GROUP BY ec.project_id
    ),
    ranked_crews AS (
        SELECT
            ec.project_id,
            ec.crew_person_id,
            ec.profile_image_url,
            ec.is_demo_crew,
            ROW_NUMBER() OVER (
                PARTITION BY ec.project_id 
                ORDER BY ec.first_applied_at DESC, ec.crew_person_id ASC
            ) AS row_num
        FROM eligible_crews ec
    ),
    sample_avatars AS (
        SELECT
            rc.project_id,
            jsonb_agg(
                jsonb_build_object(
                    'avatarUrl', rc.profile_image_url,
                    'isDemo', rc.is_demo_crew
                )
                ORDER BY rc.row_num ASC
            ) AS avatars_json
        FROM ranked_crews rc
        WHERE rc.row_num <= 3
          -- Privacy Guard: only expose profile image if MVP mode and verified demo crew
          AND (p_is_mvp = true AND rc.is_demo_crew = true AND rc.profile_image_url IS NOT NULL)
        GROUP BY rc.project_id
    )
    SELECT
        pid.id AS project_id,
        COALESCE(pm.total_count, 0::BIGINT) AS applicant_count,
        COALESCE(pm.new_24h_count, 0::BIGINT) AS new_applicant_count_24h,
        pm.latest_applied_at,
        COALESCE(sa.avatars_json, '[]'::jsonb) AS avatars
    FROM unnest(p_project_ids) AS pid(id)
    LEFT JOIN project_metrics pm ON pm.project_id = pid.id
    LEFT JOIN sample_avatars sa ON sa.project_id = pid.id;
END;
$$;

REVOKE ALL ON FUNCTION crewlink.get_events_social_proof(UUID[], TIMESTAMPTZ, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION crewlink.get_events_social_proof(UUID[], TIMESTAMPTZ, BOOLEAN) TO authenticated, service_role;

-- 3. Atomic Applicant Selection / Rejection Procedure
CREATE OR REPLACE FUNCTION crewlink.select_applicant(
    p_application_id UUID,
    p_new_status TEXT,
    p_actor_person_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = crewlink, public
AS $$
DECLARE
    v_app RECORD;
    v_member RECORD;
    v_slot RECORD;
    v_shift RECORD;
    v_assignment_id UUID := NULL;
    v_slot_id UUID := NULL;
    v_existing_assign RECORD;
BEGIN
    -- 1. Validate application
    SELECT a.*, p.organization_id
    INTO v_app
    FROM crewlink.applications a
    JOIN crewlink.projects p ON p.id = a.project_id
    WHERE a.id = p_application_id
    FOR UPDATE OF a;

    IF NOT FOUND THEN
        RAISE EXCEPTION '지원 정보를 찾을 수 없습니다.' USING ERRCODE = 'P0002';
    END IF;

    -- 2. Verify actor organization permissions
    SELECT role, is_active
    INTO v_member
    FROM crewlink.organization_members
    WHERE organization_id = v_app.organization_id
      AND person_id = p_actor_person_id
      AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION '해당 행사의 지원자를 관리할 권한이 없습니다.' USING ERRCODE = '42501';
    END IF;

    IF v_member.role = 'viewer' THEN
        RAISE EXCEPTION '지원자 선발/상태 변경 권한이 없습니다. (조회 전용 권한)' USING ERRCODE = '42501';
    END IF;

    -- 3. Execute State Transition
    IF p_new_status = 'approved' THEN
        -- Find available open slot
        SELECT *
        INTO v_slot
        FROM crewlink.shift_slots
        WHERE shift_id = v_app.shift_id
          AND status = 'open'
        ORDER BY slot_number ASC
        LIMIT 1
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION '해당 일정의 모집 정원이 마감되었습니다.' USING ERRCODE = '23514';
        END IF;

        v_slot_id := v_slot.id;

        -- Get shift timing for work_reservation
        SELECT * INTO v_shift FROM crewlink.shifts WHERE id = v_app.shift_id;

        -- Update slot to filled
        UPDATE crewlink.shift_slots
        SET status = 'filled'
        WHERE id = v_slot.id;

        -- Create or update assignment
        INSERT INTO crewlink.assignments (
            shift_id,
            shift_slot_id,
            crew_person_id,
            status,
            assigned_at
        ) VALUES (
            v_app.shift_id,
            v_slot.id,
            v_app.crew_person_id,
            'assigned',
            now()
        )
        RETURNING id INTO v_assignment_id;

        -- Create work reservation if times are present
        IF v_shift.start_time IS NOT NULL AND v_shift.end_time IS NOT NULL THEN
            INSERT INTO crewlink.work_reservations (
                assignment_id,
                crew_person_id,
                reserved_range,
                is_active
            ) VALUES (
                v_assignment_id,
                v_app.crew_person_id,
                tsrange(v_shift.start_time::timestamp, v_shift.end_time::timestamp, '[)'),
                true
            );
        END IF;

        -- Update application status
        UPDATE crewlink.applications
        SET status = 'approved'
        WHERE id = p_application_id;

    ELSIF p_new_status = 'rejected' THEN
        -- If previously approved, free slot & remove assignment
        IF v_app.status = 'approved' THEN
            SELECT * INTO v_existing_assign 
            FROM crewlink.assignments 
            WHERE shift_id = v_app.shift_id AND crew_person_id = v_app.crew_person_id;

            IF FOUND THEN
                IF v_existing_assign.shift_slot_id IS NOT NULL THEN
                    UPDATE crewlink.shift_slots
                    SET status = 'open'
                    WHERE id = v_existing_assign.shift_slot_id;
                END IF;
                DELETE FROM crewlink.assignments WHERE id = v_existing_assign.id;
            END IF;
        END IF;

        UPDATE crewlink.applications
        SET status = 'rejected'
        WHERE id = p_application_id;

    ELSIF p_new_status = 'applied' THEN
        -- Revert from approved to applied
        IF v_app.status = 'approved' THEN
            SELECT * INTO v_existing_assign 
            FROM crewlink.assignments 
            WHERE shift_id = v_app.shift_id AND crew_person_id = v_app.crew_person_id;

            IF FOUND THEN
                IF v_existing_assign.shift_slot_id IS NOT NULL THEN
                    UPDATE crewlink.shift_slots
                    SET status = 'open'
                    WHERE id = v_existing_assign.shift_slot_id;
                END IF;
                DELETE FROM crewlink.assignments WHERE id = v_existing_assign.id;
            END IF;
        END IF;

        UPDATE crewlink.applications
        SET status = 'applied'
        WHERE id = p_application_id;

    ELSE
        RAISE EXCEPTION '유효하지 않은 지원 상태입니다: %', p_new_status;
    END IF;

    RETURN jsonb_build_object(
        'applicationId', p_application_id,
        'status', p_new_status,
        'shiftId', v_app.shift_id,
        'assignmentId', v_assignment_id,
        'slotId', v_slot_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION crewlink.select_applicant(UUID, TEXT, UUID) TO authenticated, service_role;

-- 4. Atomic Crew Withdrawal Procedure
CREATE OR REPLACE FUNCTION crewlink.withdraw_application(
    p_application_id UUID,
    p_crew_person_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = crewlink, public
AS $$
DECLARE
    v_app RECORD;
BEGIN
    SELECT *
    INTO v_app
    FROM crewlink.applications
    WHERE id = p_application_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION '지원 정보를 찾을 수 없습니다.' USING ERRCODE = 'P0002';
    END IF;

    IF v_app.crew_person_id <> p_crew_person_id THEN
        RAISE EXCEPTION '본인의 지원서만 철회할 수 있습니다.' USING ERRCODE = '42501';
    END IF;

    IF v_app.status <> 'applied' THEN
        RAISE EXCEPTION '이미 선발되었거나 처리된 지원서는 직접 철회할 수 없습니다.' USING ERRCODE = '23514';
    END IF;

    UPDATE crewlink.applications
    SET status = 'withdrawn'
    WHERE id = p_application_id;

    RETURN jsonb_build_object(
        'applicationId', p_application_id,
        'status', 'withdrawn'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION crewlink.withdraw_application(UUID, UUID) TO authenticated, service_role;

-- 5. Atomic Multi-Shift Application Procedure
CREATE OR REPLACE FUNCTION crewlink.apply_shifts_atomic(
    p_project_id UUID,
    p_shift_ids UUID[],
    p_crew_person_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = crewlink, public
AS $$
DECLARE
    v_project RECORD;
    v_all_shift_count INT;
    v_valid_shift_count INT;
    v_existing_count INT;
    v_shift_id UUID;
    v_inserted_ids UUID[] := ARRAY[]::UUID[];
    v_new_id UUID;
    v_is_all_days BOOLEAN := false;
BEGIN
    -- 1. Check Project
    SELECT *
    INTO v_project
    FROM crewlink.projects
    WHERE id = p_project_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '해당 공고를 찾을 수 없습니다.' USING ERRCODE = 'P0002';
    END IF;

    IF v_project.status NOT IN ('published', 'in_progress') THEN
        RAISE EXCEPTION '현재 모집 중인 공고가 아닙니다.' USING ERRCODE = '23514';
    END IF;

    -- Check participation mode
    IF (v_project.sow_spec->>'participationMode' = 'all_days') OR (v_project.sow_spec->>'isMultiDayRequired' = 'true') THEN
        v_is_all_days := true;
    END IF;

    -- Count total project shifts
    SELECT COUNT(*)::INT INTO v_all_shift_count
    FROM crewlink.shifts
    WHERE project_id = p_project_id;

    IF v_is_all_days AND array_length(p_shift_ids, 1) < v_all_shift_count THEN
        RAISE EXCEPTION '전체 일정 필수 참여 공고입니다. 모든 근무 날짜를 선택해 주세요.' USING ERRCODE = '23514';
    END IF;

    -- Verify all requested shift IDs belong to this project
    SELECT COUNT(*)::INT INTO v_valid_shift_count
    FROM crewlink.shifts
    WHERE project_id = p_project_id
      AND id = ANY(p_shift_ids);

    IF v_valid_shift_count <> array_length(p_shift_ids, 1) THEN
        RAISE EXCEPTION '선택한 일정 중 해당 행사에 속하지 않는 일정이 포함되어 있습니다.' USING ERRCODE = '23514';
    END IF;

    -- Check for duplicate applications
    SELECT COUNT(*)::INT INTO v_existing_count
    FROM crewlink.applications
    WHERE crew_person_id = p_crew_person_id
      AND shift_id = ANY(p_shift_ids)
      AND status IN ('applied', 'approved');

    IF v_existing_count > 0 THEN
        RAISE EXCEPTION '이미 지원한 일정이 포함되어 있습니다.' USING ERRCODE = '23505';
    END IF;

    -- Insert all applications atomically
    FOREACH v_shift_id IN ARRAY p_shift_ids LOOP
        INSERT INTO crewlink.applications (
            project_id,
            shift_id,
            crew_person_id,
            status,
            applied_at
        ) VALUES (
            p_project_id,
            v_shift_id,
            p_crew_person_id,
            'applied',
            now()
        )
        RETURNING id INTO v_new_id;

        v_inserted_ids := array_append(v_inserted_ids, v_new_id);
    END LOOP;

    RETURN jsonb_build_object(
        'projectId', p_project_id,
        'crewPersonId', p_crew_person_id,
        'insertedCount', array_length(v_inserted_ids, 1),
        'applicationIds', to_jsonb(v_inserted_ids)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION crewlink.apply_shifts_atomic(UUID, UUID[], UUID) TO authenticated, service_role;
