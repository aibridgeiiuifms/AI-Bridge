-- ============================================================================
-- Migration 017: Event Gallery Architecture & Team Member Photo Tagging
-- Creates 2-Tier Folder System, Events, Pictures, and Multi-Member Tags
-- ============================================================================

-- 1. Extend members table with gallery management permission
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS can_manage_gallery boolean NOT NULL DEFAULT false;

-- 2. Create gallery_folders table (Top-level albums/categories)
CREATE TABLE IF NOT EXISTS public.gallery_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  thumbnail_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gallery_folders_pkey PRIMARY KEY (id),
  CONSTRAINT gallery_folders_slug_key UNIQUE (slug),
  CONSTRAINT gallery_folders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 3. Create gallery_events table (Individual events inside folders)
CREATE TABLE IF NOT EXISTS public.gallery_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  location text NOT NULL,
  event_date date,
  is_date_visible boolean NOT NULL DEFAULT true,
  description_markdown text NOT NULL DEFAULT ''::text,
  external_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gallery_events_pkey PRIMARY KEY (id),
  CONSTRAINT gallery_events_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.gallery_folders(id) ON DELETE CASCADE,
  CONSTRAINT gallery_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT gallery_events_folder_slug_key UNIQUE (folder_id, slug)
);

-- 4. Create gallery_pictures table (Multiple photos per event)
CREATE TABLE IF NOT EXISTS public.gallery_pictures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  caption text,
  display_order integer NOT NULL DEFAULT 0,
  is_cover boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gallery_pictures_pkey PRIMARY KEY (id),
  CONSTRAINT gallery_pictures_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.gallery_events(id) ON DELETE CASCADE
);

-- 5. Create gallery_picture_tags table (Multi-member tagging per photo)
CREATE TABLE IF NOT EXISTS public.gallery_picture_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  picture_id uuid NOT NULL,
  member_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gallery_picture_tags_pkey PRIMARY KEY (id),
  CONSTRAINT gallery_picture_tags_picture_id_fkey FOREIGN KEY (picture_id) REFERENCES public.gallery_pictures(id) ON DELETE CASCADE,
  CONSTRAINT gallery_picture_tags_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE,
  CONSTRAINT gallery_picture_tags_unique_tag UNIQUE (picture_id, member_id)
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_folders_published ON public.gallery_folders(is_published, is_archived, display_order);
CREATE INDEX IF NOT EXISTS idx_gallery_events_folder ON public.gallery_events(folder_id, is_published, is_archived, display_order);
CREATE INDEX IF NOT EXISTS idx_gallery_pictures_event ON public.gallery_pictures(event_id, display_order);
CREATE INDEX IF NOT EXISTS idx_gallery_picture_tags_picture ON public.gallery_picture_tags(picture_id);
CREATE INDEX IF NOT EXISTS idx_gallery_picture_tags_member ON public.gallery_picture_tags(member_id);

-- 7. Storage Bucket Setup (event-gallery)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-gallery',
  'event-gallery',
  true,
  10485760, -- 10MB limit per image
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 8. Row-Level Security (RLS)
ALTER TABLE public.gallery_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_pictures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_picture_tags ENABLE ROW LEVEL SECURITY;

-- Helper function: verify if session belongs to Admin or authorized Gallery Manager
CREATE OR REPLACE FUNCTION public.can_manage_event_gallery()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.profile_id = auth.uid() AND m.can_manage_gallery = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public Read Policies (Published and unarchived records)
DROP POLICY IF EXISTS "Public read published folders" ON public.gallery_folders;
CREATE POLICY "Public read published folders"
ON public.gallery_folders FOR SELECT
USING (is_published = true AND is_archived = false);

DROP POLICY IF EXISTS "Public read published events" ON public.gallery_events;
CREATE POLICY "Public read published events"
ON public.gallery_events FOR SELECT
USING (
  is_published = true 
  AND is_archived = false
  AND folder_id IN (
    SELECT f.id FROM public.gallery_folders f 
    WHERE f.is_published = true AND f.is_archived = false
  )
);

DROP POLICY IF EXISTS "Public read pictures of published events" ON public.gallery_pictures;
CREATE POLICY "Public read pictures of published events"
ON public.gallery_pictures FOR SELECT
USING (
  event_id IN (
    SELECT e.id FROM public.gallery_events e 
    JOIN public.gallery_folders f ON f.id = e.folder_id
    WHERE e.is_published = true 
      AND e.is_archived = false 
      AND f.is_published = true 
      AND f.is_archived = false
  )
);

DROP POLICY IF EXISTS "Public read picture tags of published events" ON public.gallery_picture_tags;
CREATE POLICY "Public read picture tags of published events"
ON public.gallery_picture_tags FOR SELECT
USING (
  picture_id IN (
    SELECT p.id FROM public.gallery_pictures p
    JOIN public.gallery_events e ON e.id = p.event_id
    JOIN public.gallery_folders f ON f.id = e.folder_id
    WHERE e.is_published = true 
      AND e.is_archived = false 
      AND f.is_published = true 
      AND f.is_archived = false
  )
);

-- Manager Policies (Full CRUD for Superadmin or can_manage_gallery = true)
DROP POLICY IF EXISTS "Managers manage folders" ON public.gallery_folders;
CREATE POLICY "Managers manage folders"
ON public.gallery_folders FOR ALL
USING (public.can_manage_event_gallery())
WITH CHECK (public.can_manage_event_gallery());

DROP POLICY IF EXISTS "Managers manage events" ON public.gallery_events;
CREATE POLICY "Managers manage events"
ON public.gallery_events FOR ALL
USING (public.can_manage_event_gallery())
WITH CHECK (public.can_manage_event_gallery());

DROP POLICY IF EXISTS "Managers manage pictures" ON public.gallery_pictures;
CREATE POLICY "Managers manage pictures"
ON public.gallery_pictures FOR ALL
USING (public.can_manage_event_gallery())
WITH CHECK (public.can_manage_event_gallery());

DROP POLICY IF EXISTS "Managers manage picture tags" ON public.gallery_picture_tags;
CREATE POLICY "Managers manage picture tags"
ON public.gallery_picture_tags FOR ALL
USING (public.can_manage_event_gallery())
WITH CHECK (public.can_manage_event_gallery());

-- Storage Policies for event-gallery bucket
DROP POLICY IF EXISTS "Public read event-gallery images" ON storage.objects;
CREATE POLICY "Public read event-gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-gallery');

DROP POLICY IF EXISTS "Managers insert event-gallery images" ON storage.objects;
CREATE POLICY "Managers insert event-gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-gallery' 
  AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.members WHERE profile_id = auth.uid() AND can_manage_gallery = true)
  )
);

DROP POLICY IF EXISTS "Managers update event-gallery images" ON storage.objects;
CREATE POLICY "Managers update event-gallery images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-gallery' 
  AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.members WHERE profile_id = auth.uid() AND can_manage_gallery = true)
  )
);

DROP POLICY IF EXISTS "Managers delete event-gallery images" ON storage.objects;
CREATE POLICY "Managers delete event-gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-gallery' 
  AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.members WHERE profile_id = auth.uid() AND can_manage_gallery = true)
  )
);
