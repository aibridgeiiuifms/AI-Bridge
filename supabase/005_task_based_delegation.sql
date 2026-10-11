-- ==============================================================================
-- THE AI BRIDGE WEB APPLICATION | IIUI FMS
-- Migration 005: Task-Based Assignment & Delegated Team Management
-- Admin Lead: ai.bridge.iiui.fms@gmail.com (M. Tayyab, App Development Team Lead)
-- ==============================================================================

SET search_path TO public;

-- 1. Create Dynamic Campaign Tasks Table
CREATE TABLE IF NOT EXISTS public.campaign_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed Initial Core Tasks
INSERT INTO public.campaign_tasks (title, description) VALUES
('NotebookLM Workshop Coordination', 'Coordinating hands-on lab sessions, projector setups, and student onboarding for NotebookLM.'),
('Survey Analytics & Impact Reporting', 'Monitoring pre/post survey submissions, analyzing time-saved metrics, and generating QIP Section H reports.'),
('SDG Walk & Institutional Awareness', 'Organizing campus campaign stalls, distributing awareness flyers, and engaging faculty.'),
('Certificate Verification & Student Guidance', 'Assisting students in completing assessments and verifying certificate credentials.'),
('Technical Platform & Portal Maintenance', 'Managing portal stability, database updates, and Google Sheets integration.')
ON CONFLICT (title) DO NOTHING;

-- 2. Add assigned_tasks array to role_whitelist and profiles
ALTER TABLE public.role_whitelist 
    ADD COLUMN IF NOT EXISTS assigned_tasks TEXT[] DEFAULT '{}';

ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS assigned_tasks TEXT[] DEFAULT '{}';

-- 3. Add can_manage_team permission to member_permissions
ALTER TABLE public.member_permissions 
    ADD COLUMN IF NOT EXISTS can_manage_team BOOLEAN NOT NULL DEFAULT false;

-- 4. Row Level Security for campaign_tasks
ALTER TABLE public.campaign_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view campaign tasks" ON public.campaign_tasks;
CREATE POLICY "Anyone authenticated can view campaign tasks"
ON public.campaign_tasks FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage campaign tasks" ON public.campaign_tasks;
CREATE POLICY "Admins can manage campaign tasks"
ON public.campaign_tasks FOR ALL
USING (public.get_user_role() = 'admin');

-- 5. Helper function: Can User Manage Team?
CREATE OR REPLACE FUNCTION public.can_user_manage_team()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        public.get_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.member_permissions
            WHERE member_id = auth.uid() AND can_manage_team = true
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update role_whitelist RLS to allow delegated team managers
DROP POLICY IF EXISTS "Delegated members can add or edit members in whitelist" ON public.role_whitelist;
CREATE POLICY "Delegated members can add or edit members in whitelist"
ON public.role_whitelist FOR INSERT
WITH CHECK (
    public.can_user_manage_team() 
    AND (
        -- If user is NOT admin, they can ONLY add 'member' (never admin)
        public.get_user_role() = 'admin' OR target_role = 'member'
    )
);

DROP POLICY IF EXISTS "Delegated members can update members in whitelist" ON public.role_whitelist;
CREATE POLICY "Delegated members can update members in whitelist"
ON public.role_whitelist FOR UPDATE
USING (public.can_user_manage_team())
WITH CHECK (
    public.get_user_role() = 'admin' OR target_role = 'member'
);

-- 7. Update sync_whitelist_to_profile trigger to sync assigned_tasks
CREATE OR REPLACE FUNCTION public.sync_whitelist_to_profile()
RETURNS trigger AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    UPDATE public.profiles
    SET role = NEW.target_role,
        assigned_tasks = COALESCE(NEW.assigned_tasks, '{}'),
        updated_at = timezone('utc'::text, now())
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
    RETURNING id INTO v_profile_id;

    IF NEW.target_role = 'member' AND v_profile_id IS NOT NULL THEN
        INSERT INTO public.member_permissions (
            member_id,
            can_manage_events,
            can_view_surveys,
            can_verify_attendance,
            can_manage_mcqs,
            can_export_reports,
            can_manage_team
        ) VALUES (
            v_profile_id,
            false,
            true,
            false,
            false,
            true,
            false
        )
        ON CONFLICT (member_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update handle_new_user trigger to assign tasks on first Google login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_role TEXT := 'student';
    v_whitelist RECORD;
BEGIN
    -- 1. Check if user is in role_whitelist
    SELECT * INTO v_whitelist FROM public.role_whitelist WHERE LOWER(TRIM(email)) = LOWER(TRIM(new.email));

    IF FOUND THEN
        v_role := v_whitelist.target_role;
    ELSIF LOWER(TRIM(new.email)) = 'ai.bridge.iiui.fms@gmail.com' THEN
        v_role := 'admin';
    ELSE
        v_role := 'student';
    END IF;

    -- 2. Insert into profiles with assigned tasks
    INSERT INTO public.profiles (id, email, full_name, role, avatar_url, assigned_tasks)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        v_role,
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
        COALESCE(v_whitelist.assigned_tasks, '{}')
    )
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        assigned_tasks = COALESCE(EXCLUDED.assigned_tasks, profiles.assigned_tasks),
        updated_at = timezone('utc'::text, now());

    -- 3. If member, initialize member permissions
    IF v_role = 'member' THEN
        INSERT INTO public.member_permissions (
            member_id,
            can_manage_events,
            can_view_surveys,
            can_verify_attendance,
            can_manage_mcqs,
            can_export_reports,
            can_manage_team
        ) VALUES (
            new.id,
            false,
            true,
            false,
            false,
            true,
            false
        )
        ON CONFLICT (member_id) DO NOTHING;
    END IF;

    -- 4. Automatically link any pre-submitted Google Form surveys matching this email
    UPDATE public.surveys
    SET user_id = new.id
    WHERE respondent_email = LOWER(TRIM(new.email)) AND user_id IS NULL;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
