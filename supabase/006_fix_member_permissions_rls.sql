-- ==============================================================================
-- THE AI BRIDGE WEB APPLICATION | IIUI FMS
-- Migration 006: Fix Member Permissions RLS & Delegated Team Management Access
-- Admin Lead: ai.bridge.iiui.fms@gmail.com (M. Tayyab, App Development Team Lead)
-- ==============================================================================

SET search_path TO public;

-- 1. Ensure can_manage_team column exists in role_whitelist and member_permissions
ALTER TABLE public.role_whitelist 
    ADD COLUMN IF NOT EXISTS can_manage_team BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.member_permissions 
    ADD COLUMN IF NOT EXISTS can_manage_team BOOLEAN NOT NULL DEFAULT false;

-- 2. Enable Row Level Security on member_permissions
ALTER TABLE public.member_permissions ENABLE ROW LEVEL SECURITY;

-- 3. RLS: Allow members to view their OWN permissions row, and Admins to view all
DROP POLICY IF EXISTS "Users can view own permissions or admin view all" ON public.member_permissions;
CREATE POLICY "Users can view own permissions or admin view all"
ON public.member_permissions FOR SELECT
USING (
    member_id = auth.uid() 
    OR public.get_user_role() = 'admin'
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. RLS: Admins can insert, update, or delete member permissions
DROP POLICY IF EXISTS "Admins can manage member permissions" ON public.member_permissions;
CREATE POLICY "Admins can manage member permissions"
ON public.member_permissions FOR ALL
USING (
    public.get_user_role() = 'admin'
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. Helper Function: Check if user is Admin or Delegated Team Manager
CREATE OR REPLACE FUNCTION public.can_user_manage_team()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        public.get_user_role() = 'admin'
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.member_permissions
            WHERE member_id = auth.uid() AND can_manage_team = true
        )
        OR EXISTS (
            SELECT 1 FROM public.role_whitelist w
            JOIN public.profiles p ON LOWER(TRIM(p.email)) = LOWER(TRIM(w.email))
            WHERE p.id = auth.uid() AND w.can_manage_team = true
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS on role_whitelist: Allow delegated members to view and add members
DROP POLICY IF EXISTS "Anyone authorized can view role whitelist" ON public.role_whitelist;
CREATE POLICY "Anyone authorized can view role whitelist"
ON public.role_whitelist FOR SELECT
USING (
    auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Delegated members can add members in whitelist" ON public.role_whitelist;
CREATE POLICY "Delegated members can add members in whitelist"
ON public.role_whitelist FOR INSERT
WITH CHECK (
    public.can_user_manage_team() 
    AND (
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

-- 7. Trigger: Real-time sync from whitelist to profiles and member_permissions
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
            COALESCE(NEW.can_manage_team, false)
        )
        ON CONFLICT (member_id) DO UPDATE SET
            can_manage_team = COALESCE(NEW.can_manage_team, member_permissions.can_manage_team);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger: Handle new user Google login with delegated permissions
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

    -- 3. If member, initialize member permissions including can_manage_team
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
            COALESCE(v_whitelist.can_manage_team, false)
        )
        ON CONFLICT (member_id) DO UPDATE SET
            can_manage_team = COALESCE(v_whitelist.can_manage_team, member_permissions.can_manage_team);
    END IF;

    -- 4. Automatically link any pre-submitted Google Form surveys matching this email
    UPDATE public.surveys
    SET user_id = new.id
    WHERE respondent_email = LOWER(TRIM(new.email)) AND user_id IS NULL;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
