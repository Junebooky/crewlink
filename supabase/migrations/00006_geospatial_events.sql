-- =====================================================================
-- CrewLink Migration 00006: Geospatial Events & Location Bounds RPC
-- Target: PostgreSQL 16+ on Supabase with PostGIS
-- =====================================================================

-- 1. Ensure PostGIS extension is available
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 2. Add latitude, longitude, and generated PostGIS location column
ALTER TABLE crewlink.projects
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'crewlink' AND table_name = 'projects' AND column_name = 'location'
  ) THEN
    ALTER TABLE crewlink.projects
      ADD COLUMN location extensions.geometry(Point, 4326)
      GENERATED ALWAYS AS (
        CASE
          WHEN latitude IS NOT NULL AND longitude IS NOT NULL
          THEN extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326)
          ELSE NULL
        END
      ) STORED;
  END IF;
END $$;

-- 3. Indexes for high-speed spatial & bounding box queries
CREATE INDEX IF NOT EXISTS idx_projects_location_gist ON crewlink.projects USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_projects_lat_lng ON crewlink.projects (latitude, longitude);

-- 4. Bounding Box Query RPC Function
CREATE OR REPLACE FUNCTION crewlink.get_events_in_bounds(
  min_lat DOUBLE PRECISION,
  min_lng DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_lng DOUBLE PRECISION
)
RETURNS SETOF crewlink.projects
LANGUAGE sql
STABLE
SET search_path = crewlink, extensions, public
AS $$
  SELECT *
  FROM crewlink.projects
  WHERE location && extensions.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    AND (status IN ('OPEN', 'published', 'in_progress'));
$$;

-- 5. Grant RPC Permissions
GRANT EXECUTE ON FUNCTION crewlink.get_events_in_bounds(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO anon, authenticated, service_role;
