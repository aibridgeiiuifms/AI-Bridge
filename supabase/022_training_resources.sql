-- ============================================================================
-- THE AI BRIDGE WEB APPLICATION | IIUI FMS
-- Migration 022: Training Material & Learning Resources Architecture
-- ----------------------------------------------------------------------------
-- 1. Adds `can_manage_resources` permission to `public.members`
-- 2. Creates `public.can_manage_training_resources()` security helper
-- 3. Creates `public.training_resources` table
-- 4. Creates `public.student_resource_progress` table (watched tracking)
-- 5. Configures Supabase Storage bucket `training-resources` & RLS policies
-- 6. Seeds initial foundational NotebookLM & AI Bridge learning materials
-- ============================================================================

SET search_path TO public;

-- 1. Extend members table with resource management permission
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS can_manage_resources BOOLEAN NOT NULL DEFAULT false;

-- 2. Security helper function for resource management
CREATE OR REPLACE FUNCTION public.can_manage_training_resources()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.profile_id = auth.uid()
      AND (m.can_manage_resources = true OR m.can_manage_team = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create training_resources table
CREATE TABLE IF NOT EXISTS public.training_resources (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            TEXT NOT NULL,
    description      TEXT,
    module           TEXT NOT NULL,
    type             TEXT NOT NULL CHECK (type IN ('pdf', 'video', 'link', 'audio')),
    url              TEXT NOT NULL,
    storage_path     TEXT,
    file_size_bytes  BIGINT,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tr_module ON public.training_resources(module);
CREATE INDEX IF NOT EXISTS idx_tr_sort ON public.training_resources(sort_order);
CREATE INDEX IF NOT EXISTS idx_tr_active ON public.training_resources(is_active);

-- Enable RLS on training_resources
ALTER TABLE public.training_resources ENABLE ROW LEVEL SECURITY;

-- Read policy: Anyone (students, guests, public) can read active resources; managers can read all
DROP POLICY IF EXISTS "Public can view active resources" ON public.training_resources;
CREATE POLICY "Public can view active resources"
ON public.training_resources FOR SELECT
USING (
  is_active = true 
  OR public.can_manage_training_resources()
);

-- Mutation policies: Only admins and delegated resource managers
DROP POLICY IF EXISTS "Managers can insert resources" ON public.training_resources;
CREATE POLICY "Managers can insert resources"
ON public.training_resources FOR INSERT
WITH CHECK (public.can_manage_training_resources());

DROP POLICY IF EXISTS "Managers can update resources" ON public.training_resources;
CREATE POLICY "Managers can update resources"
ON public.training_resources FOR UPDATE
USING (public.can_manage_training_resources())
WITH CHECK (public.can_manage_training_resources());

DROP POLICY IF EXISTS "Managers can delete resources" ON public.training_resources;
CREATE POLICY "Managers can delete resources"
ON public.training_resources FOR DELETE
USING (public.can_manage_training_resources());

-- 4. Create student_resource_progress table
CREATE TABLE IF NOT EXISTS public.student_resource_progress (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.training_resources(id) ON DELETE CASCADE,
    watched_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_student_resource_progress UNIQUE (student_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_srp_student ON public.student_resource_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_srp_resource ON public.student_resource_progress(resource_id);

-- Enable RLS on student_resource_progress
ALTER TABLE public.student_resource_progress ENABLE ROW LEVEL SECURITY;

-- Students can read their own watched records; managers can see all
DROP POLICY IF EXISTS "Students can view own progress" ON public.student_resource_progress;
CREATE POLICY "Students can view own progress"
ON public.student_resource_progress FOR SELECT
USING (
  auth.uid() = student_id 
  OR public.can_manage_training_resources()
);

-- Students can insert their own watched records
DROP POLICY IF EXISTS "Students can insert own progress" ON public.student_resource_progress;
CREATE POLICY "Students can insert own progress"
ON public.student_resource_progress FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Students can delete their own watched records (toggle unwatch)
DROP POLICY IF EXISTS "Students can delete own progress" ON public.student_resource_progress;
CREATE POLICY "Students can delete own progress"
ON public.student_resource_progress FOR DELETE
USING (auth.uid() = student_id);

-- 5. Supabase Storage Bucket Setup for 'training-resources'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-resources',
  'training-resources',
  true,
  52428800, -- 50MB max file size
  ARRAY[
    'application/pdf',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/m4a',
    'audio/x-m4a',
    'audio/ogg',
    'video/mp4',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Storage bucket access policies
DROP POLICY IF EXISTS "Public read training-resources" ON storage.objects;
CREATE POLICY "Public read training-resources"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-resources');

DROP POLICY IF EXISTS "Managers insert training-resources" ON storage.objects;
CREATE POLICY "Managers insert training-resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'training-resources'
  AND public.can_manage_training_resources()
);

DROP POLICY IF EXISTS "Managers update training-resources" ON storage.objects;
CREATE POLICY "Managers update training-resources"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'training-resources'
  AND public.can_manage_training_resources()
)
WITH CHECK (
  bucket_id = 'training-resources'
  AND public.can_manage_training_resources()
);

DROP POLICY IF EXISTS "Managers delete training-resources" ON storage.objects;
CREATE POLICY "Managers delete training-resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'training-resources'
  AND public.can_manage_training_resources()
);

-- 6. Seed initial foundational materials for NotebookLM
INSERT INTO public.training_resources (title, description, module, type, url, sort_order, is_active)
VALUES
  (
    'Google NotebookLM Official Studio',
    'Direct access to Google NotebookLM web app to ground your sources, create notes, and generate audio summaries.',
    'NotebookLM Foundations',
    'link',
    'https://notebooklm.google.com',
    1,
    true
  ),
  (
    'Mastering Google NotebookLM: Complete Beginner to Pro Tutorial',
    'Comprehensive video masterclass covering source uploading, grounded chatting, citation checks, and study notes.',
    'NotebookLM Foundations',
    'video',
    'https://www.youtube.com/watch?v=kYJqD96Y9bA',
    2,
    true
  ),
  (
    'Source-Grounded AI & Verification Handbook',
    'Step-by-step documentation detailing citation transparency, zero hallucination workflows, and academic rigor.',
    'Source Grounding & Citations',
    'link',
    'https://support.google.com/notebooklm',
    3,
    true
  ),
  (
    'Deep Dive: Generating Podcasts & Audio Overviews',
    'Learn how to guide the AI hosts, customize audio focus, and extract study summaries on demand.',
    'Audio Overviews & Deep Dives',
    'video',
    'https://www.youtube.com/watch?v=5kZqM4F2qYw',
    4,
    true
  )
ON CONFLICT DO NOTHING;
