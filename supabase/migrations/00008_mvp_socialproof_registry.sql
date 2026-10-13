-- =====================================================================
-- CrewLink Migration 00008: MVP Seed Registry & Social Proof Aggregation
-- Target: PostgreSQL 16+ on Supabase
-- =====================================================================

-- 1. Create MVP seed registry table for tracking test data ownership
CREATE TABLE IF NOT EXISTS crewlink.mvp_seed_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    namespace TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'auth_user', 'person', 'organization', 'project', 'shift', 'shift_slot', 'application'
    entity_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_mvp_seed_registry UNIQUE (namespace, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_seed_registry_ns_type ON crewlink.mvp_seed_registry (namespace, entity_type);
CREATE INDEX IF NOT EXISTS idx_seed_registry_entity_id ON crewlink.mvp_seed_registry (entity_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON crewlink.mvp_seed_registry TO authenticated, service_role;

-- 2. Add is_demo column to projects for transparent MVP filtering
ALTER TABLE crewlink.projects
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- 3. High-performance composite indexes for social proof and application queries
CREATE INDEX IF NOT EXISTS idx_applications_project_status_crew 
    ON crewlink.applications (project_id, status, crew_person_id, applied_at);

CREATE INDEX IF NOT EXISTS idx_applications_crew_status 
    ON crewlink.applications (crew_person_id, status);

CREATE INDEX IF NOT EXISTS idx_projects_status_created_at 
    ON crewlink.projects (status, created_at DESC);

-- 4. High-performance RPC for deduplicated social proof aggregation
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
STABLE
SECURITY DEFINER
SET search_path = crewlink, public
AS $$
BEGIN
    RETURN QUERY
    WITH valid_apps AS (
        -- Unique crew per project with minimum applied_at
        SELECT
            a.project_id,
            a.crew_person_id,
            min(a.applied_at) as first_applied_at,
            max(a.applied_at) as max_applied_at
        FROM crewlink.applications a
        JOIN crewlink.people p ON p.id = a.crew_person_id
        WHERE a.project_id = ANY(p_project_ids)
          AND a.status IN ('applied', 'approved')
          AND p.is_active = true
        GROUP BY a.project_id, a.crew_person_id
    ),
    recent_crews AS (
        -- Up to 3 unique crew avatars per project, ordered by first_applied_at DESC
        SELECT
            va.project_id,
            va.crew_person_id,
            va.first_applied_at,
            cp.profile_image_url,
            cp.profile_photo_url,
            EXISTS (
                SELECT 1 FROM crewlink.mvp_seed_registry sr 
                WHERE sr.entity_id = va.crew_person_id::text 
                  AND sr.entity_type = 'person'
            ) as is_demo_crew,
            ROW_NUMBER() OVER (PARTITION BY va.project_id ORDER BY va.first_applied_at DESC) as rn
        FROM valid_apps va
        LEFT JOIN crewlink.crew_profiles cp ON cp.person_id = va.crew_person_id
    ),
    project_avatars AS (
        SELECT
            rc.project_id,
            jsonb_agg(
                jsonb_build_object(
                    'avatarUrl', CASE 
                        WHEN p_is_mvp AND rc.is_demo_crew THEN coalesce(rc.profile_image_url, rc.profile_photo_url)
                        WHEN p_is_mvp AND rc.profile_image_url IS NOT NULL THEN rc.profile_image_url
                        ELSE NULL 
                    END,
                    'isDemo', rc.is_demo_crew
                )
                ORDER BY rc.rn
            ) as avatar_list
        FROM recent_crews rc
        WHERE rc.rn <= 3
          AND (
              (p_is_mvp AND rc.is_demo_crew AND coalesce(rc.profile_image_url, rc.profile_photo_url) IS NOT NULL)
              OR (rc.profile_image_url IS NOT NULL)
          )
        GROUP BY rc.project_id
    ),
    project_summary AS (
        SELECT
            va.project_id,
            count(DISTINCT va.crew_person_id) as applicant_count,
            count(DISTINCT va.crew_person_id) FILTER (
                WHERE va.first_applied_at >= (p_reference_time - INTERVAL '24 hours')
                  AND va.first_applied_at <= p_reference_time
            ) as new_applicant_count_24h,
            max(va.max_applied_at) as latest_applied_at
        FROM valid_apps va
        GROUP BY va.project_id
    )
    SELECT
        pid AS project_id,
        coalesce(ps.applicant_count, 0)::BIGINT AS applicant_count,
        coalesce(ps.new_applicant_count_24h, 0)::BIGINT AS new_applicant_count_24h,
        ps.latest_applied_at,
        coalesce(pa.avatar_list, '[]'::jsonb) AS avatars
    FROM unnest(p_project_ids) pid
    LEFT JOIN project_summary ps ON ps.project_id = pid
    LEFT JOIN project_avatars pa ON pa.project_id = pid;
END;
$$;

GRANT EXECUTE ON FUNCTION crewlink.get_events_social_proof(UUID[], TIMESTAMPTZ, BOOLEAN) TO anon, authenticated, service_role;
