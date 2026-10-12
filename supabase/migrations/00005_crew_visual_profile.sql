-- =====================================================================
-- CrewLink Migration 00005: Crew Visual Profile & Media Storage
-- =====================================================================

-- 1. Ensure crew_profiles table exists with all visual profile & body spec attributes
CREATE TABLE IF NOT EXISTS public.crew_profiles (
    person_id UUID PRIMARY KEY REFERENCES public.people(id) ON DELETE CASCADE,
    profile_image_url TEXT,
    full_body_image_url TEXT,
    height_cm INTEGER,
    top_size TEXT,          -- 'S', 'M', 'L', 'XL', '2XL'
    bottom_size TEXT,       -- '28', '30', '32', '34' etc.
    shoe_size_mm INTEGER,   -- 230, 240, 250, 260, 270, 280, etc.
    experience_years NUMERIC(3,1) DEFAULT 0,
    bio TEXT,
    languages TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure additional columns exist if crew_profiles was previously created with earlier schema
ALTER TABLE public.crew_profiles ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE public.crew_profiles ADD COLUMN IF NOT EXISTS full_body_image_url TEXT;
ALTER TABLE public.crew_profiles ADD COLUMN IF NOT EXISTS height_cm INTEGER;
ALTER TABLE public.crew_profiles ADD COLUMN IF NOT EXISTS top_size TEXT;
ALTER TABLE public.crew_profiles ADD COLUMN IF NOT EXISTS bottom_size TEXT;
ALTER TABLE public.crew_profiles ADD COLUMN IF NOT EXISTS shoe_size_mm INTEGER;
ALTER TABLE public.crew_profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
ALTER TABLE public.crew_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Also ensure experience_years column supports numeric decimals
DO $$
BEGIN
    ALTER TABLE public.crew_profiles ALTER COLUMN experience_years TYPE NUMERIC(3,1);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Row Level Security on crew_profiles
ALTER TABLE public.crew_profiles ENABLE ROW LEVEL SECURITY;

-- Drop previous overlapping policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "crew_profiles_self_all" ON public.crew_profiles;
DROP POLICY IF EXISTS "crew_profiles_client_ops_select" ON public.crew_profiles;
DROP POLICY IF EXISTS "Crew read own profile" ON public.crew_profiles;
DROP POLICY IF EXISTS "Crew update own profile" ON public.crew_profiles;

-- Crew self-access: CRUD their own profile
CREATE POLICY "crew_profiles_self_all" ON public.crew_profiles
    FOR ALL
    TO authenticated
    USING (
        person_id IN (
            SELECT id FROM public.people WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        person_id IN (
            SELECT id FROM public.people WHERE auth_user_id = auth.uid()
        )
    );

-- Organizers (client) and operations/admin (ops, admin) can SELECT crew profiles
CREATE POLICY "crew_profiles_client_ops_select" ON public.crew_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.platform_roles pr
            JOIN public.people p ON p.id = pr.person_id
            WHERE p.auth_user_id = auth.uid()
              AND pr.role IN ('client', 'ops', 'admin')
              AND pr.is_active = true
        )
        OR
        person_id IN (
            SELECT id FROM public.people WHERE auth_user_id = auth.uid()
        )
    );

-- 3. Supabase Storage Bucket setup for crew-media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'crew-media',
    'crew-media',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage RLS Policies for crew-media
DROP POLICY IF EXISTS "crew_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "crew_media_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "crew_media_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "crew_media_auth_delete" ON storage.objects;

CREATE POLICY "crew_media_public_read" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'crew-media');

CREATE POLICY "crew_media_auth_insert" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'crew-media');

CREATE POLICY "crew_media_auth_update" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'crew-media');

CREATE POLICY "crew_media_auth_delete" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'crew-media');
