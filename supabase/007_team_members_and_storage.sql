-- ==============================================================================
-- THE AI BRIDGE WEB APPLICATION | IIUI FMS
-- Migration 007: Dynamic Team & Leadership Profile System with Supabase Storage
-- Admin Lead: ai.bridge.iiui.fms@gmail.com (M. Tayyab, App Development Team Lead)
-- NOTE: ZERO DUMMY DATA. All team profiles and tasks are dynamically managed by Admins and Delegated Managers.
-- ==============================================================================

SET search_path TO public;

-- 1. Create or update team_members table (variable team_tag without rigid check constraints)
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    full_name TEXT NOT NULL,
    designation TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    position_order INT NOT NULL DEFAULT 99,
    team_tag TEXT DEFAULT 'General',
    assigned_tasks TEXT[] DEFAULT '{}',
    linkedin_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Drop any previous rigid team_tag check constraint if it existed
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_team_tag_check;

-- 2. Add dynamic tag/category column to campaign_tasks table and allow Team Managers to edit tasks
ALTER TABLE public.campaign_tasks 
    ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT 'General';

-- Update RLS for campaign_tasks so managers can insert/update/delete tasks
DROP POLICY IF EXISTS "Admins can manage campaign tasks" ON public.campaign_tasks;
DROP POLICY IF EXISTS "Admins and managers can manage campaign tasks" ON public.campaign_tasks;
CREATE POLICY "Admins and managers can manage campaign tasks"
ON public.campaign_tasks FOR ALL
USING (public.can_user_manage_team());

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for team_members
DROP POLICY IF EXISTS "Public can view published team members" ON public.team_members;
CREATE POLICY "Public can view published team members"
ON public.team_members FOR SELECT
USING (is_published = true);

DROP POLICY IF EXISTS "Admins and managers can view all team members" ON public.team_members;
CREATE POLICY "Admins and managers can view all team members"
ON public.team_members FOR SELECT
USING (public.can_user_manage_team());

DROP POLICY IF EXISTS "Admins and managers can insert team members" ON public.team_members;
CREATE POLICY "Admins and managers can insert team members"
ON public.team_members FOR INSERT
WITH CHECK (public.can_user_manage_team());

DROP POLICY IF EXISTS "Admins and managers can update team members" ON public.team_members;
CREATE POLICY "Admins and managers can update team members"
ON public.team_members FOR UPDATE
USING (public.can_user_manage_team())
WITH CHECK (public.can_user_manage_team());

DROP POLICY IF EXISTS "Admins and managers can delete team members" ON public.team_members;
CREATE POLICY "Admins and managers can delete team members"
ON public.team_members FOR DELETE
USING (public.can_user_manage_team());

-- 5. Setup Supabase Storage Bucket for team avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'team-avatars',
    'team-avatars',
    true,
    524288, -- 512 KB max limit (frontend enforces < 350 KB)
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 524288,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public can view team avatars" ON storage.objects;
CREATE POLICY "Public can view team avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-avatars');

DROP POLICY IF EXISTS "Managers can upload team avatars" ON storage.objects;
CREATE POLICY "Managers can upload team avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'team-avatars'
    AND (
        auth.role() = 'authenticated'
        OR auth.role() = 'service_role'
    )
);

DROP POLICY IF EXISTS "Managers can update team avatars" ON storage.objects;
CREATE POLICY "Managers can update team avatars"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'team-avatars'
    AND (
        auth.role() = 'authenticated'
        OR auth.role() = 'service_role'
    )
);

DROP POLICY IF EXISTS "Managers can delete team avatars" ON storage.objects;
CREATE POLICY "Managers can delete team avatars"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'team-avatars'
    AND (
        auth.role() = 'authenticated'
        OR auth.role() = 'service_role'
    )
);

-- (NO DUMMY SEED DATA INSERTED. Table begins empty. Admin or delegated member adds real profiles via dashboard.)
