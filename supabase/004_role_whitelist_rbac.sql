-- ==============================================================================
-- THE AI BRIDGE WEB APPLICATION | IIUI FMS
-- Migration 004: Role Whitelist & Advanced RBAC System
-- Admin Lead: ai.bridge.iiui.fms@gmail.com (M. Tayyab, App Development Team Lead)
-- ==============================================================================

-- 1. Create Role Whitelist Table (Managed by Admins)
CREATE TABLE IF NOT EXISTS public.role_whitelist (
    email TEXT PRIMARY KEY,
    target_role TEXT NOT NULL DEFAULT 'member' CHECK (target_role IN ('admin', 'member', 'student')),
    team_tag TEXT NOT NULL DEFAULT 'general' CHECK (team_tag IN ('awareness', 'workshops', 'analyzing', 'general')),
    full_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for case-insensitive lookup
CREATE INDEX IF NOT EXISTS idx_role_whitelist_lower_email ON public.role_whitelist(LOWER(email));

-- 2. Populate Whitelist with App Development Lead & Core SDG Ambassadors
INSERT INTO public.role_whitelist (email, target_role, team_tag, full_name, notes) VALUES
-- Leadership & Tech Leads
('ai.bridge.iiui.fms@gmail.com', 'admin', 'general', 'M. Tayyab', 'App Development Team Lead & Super Admin'),
('m.tayyab@student.iiu.edu.pk', 'admin', 'analyzing', 'M. Tayyab', 'App Development Team Lead & SDG Ambassador'),
('003822bsbaf24@student.iiu.edu.pk', 'member', 'workshops', 'Asad Naveed Akbar', 'Tech Lead & Workshop Team'),
('zahid.khan@iiu.edu.pk', 'admin', 'general', 'Dr. Abdul Zahid Khan', 'Principal Mentor & Project Lead'),

-- FMS SDG Ambassadors
('sohaib.latif@student.iiu.edu.pk', 'member', 'workshops', 'Muhammad Sohaib Latif', 'SDG Ambassador - Workshops & Trainings'),
('atiq.qureshi@student.iiu.edu.pk', 'member', 'workshops', 'Muhammad Atiq Qureshi', 'SDG Ambassador - Workshops & Trainings'),
('usman.abbasi@student.iiu.edu.pk', 'member', 'workshops', 'Usman Mumtaz Abbasi', 'SDG Ambassador - Workshops & Trainings'),
('sumama.afzal@student.iiu.edu.pk', 'member', 'awareness', 'Sumama Afzal', 'SDG Ambassador - Awareness Campaign'),
('hisham.khalid@student.iiu.edu.pk', 'member', 'awareness', 'Hafiz M. Hisham Khalid', 'SDG Ambassador - Awareness Campaign'),
('zawar.shah@student.iiu.edu.pk', 'member', 'awareness', 'Zawar Hussain Shah', 'SDG Ambassador - Awareness Campaign'),
('ibrahim.faisal@student.iiu.edu.pk', 'member', 'analyzing', 'Ibrahim bin Faisal', 'SDG Ambassador - Analyzing & Reporting'),
('bilawal.ali@student.iiu.edu.pk', 'member', 'analyzing', 'Bilawal Ali', 'SDG Ambassador - Analyzing & Reporting')
ON CONFLICT (email) DO UPDATE SET
    target_role = EXCLUDED.target_role,
    team_tag = EXCLUDED.team_tag,
    notes = EXCLUDED.notes,
    updated_at = timezone('utc'::text, now());

-- 3. Row Level Security for Role Whitelist
ALTER TABLE public.role_whitelist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage role whitelist" ON public.role_whitelist;
CREATE POLICY "Admins can manage role whitelist"
ON public.role_whitelist FOR ALL
USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Members can view role whitelist" ON public.role_whitelist;
CREATE POLICY "Members can view role whitelist"
ON public.role_whitelist FOR SELECT
USING (public.get_user_role() IN ('admin', 'member'));

-- 4. Trigger: Sync Whitelist changes to registered profiles in real time
CREATE OR REPLACE FUNCTION public.sync_whitelist_to_profile()
RETURNS trigger AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    -- Update existing profile role if user has already registered
    UPDATE public.profiles
    SET role = NEW.target_role,
        updated_at = timezone('utc'::text, now())
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
    RETURNING id INTO v_profile_id;

    -- If updated to member, ensure member_permissions row exists with team presets
    IF NEW.target_role = 'member' AND v_profile_id IS NOT NULL THEN
        INSERT INTO public.member_permissions (
            member_id,
            can_manage_events,
            can_view_surveys,
            can_verify_attendance,
            can_manage_mcqs,
            can_export_reports
        ) VALUES (
            v_profile_id,
            (NEW.team_tag = 'awareness'),
            true,
            (NEW.team_tag = 'workshops'),
            false,
            (NEW.team_tag = 'analyzing')
        )
        ON CONFLICT (member_id) DO UPDATE SET
            can_manage_events = CASE WHEN NEW.team_tag = 'awareness' THEN true ELSE member_permissions.can_manage_events END,
            can_verify_attendance = CASE WHEN NEW.team_tag = 'workshops' THEN true ELSE member_permissions.can_verify_attendance END,
            can_export_reports = CASE WHEN NEW.team_tag = 'analyzing' THEN true ELSE member_permissions.can_export_reports END,
            updated_at = timezone('utc'::text, now());
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_whitelist_to_profile ON public.role_whitelist;
CREATE TRIGGER trg_sync_whitelist_to_profile
  AFTER INSERT OR UPDATE ON public.role_whitelist
  FOR EACH ROW EXECUTE PROCEDURE public.sync_whitelist_to_profile();

-- 5. Trigger: When an email is removed from whitelist, demote user back to student
CREATE OR REPLACE FUNCTION public.handle_whitelist_delete()
RETURNS trigger AS $$
BEGIN
    -- Protect Super Admin email from demotion
    IF LOWER(TRIM(OLD.email)) NOT IN ('ai.bridge.iiui.fms@gmail.com') THEN
        UPDATE public.profiles
        SET role = 'student',
            updated_at = timezone('utc'::text, now())
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(OLD.email));
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_whitelist_delete ON public.role_whitelist;
CREATE TRIGGER trg_handle_whitelist_delete
  AFTER DELETE ON public.role_whitelist
  FOR EACH ROW EXECUTE PROCEDURE public.handle_whitelist_delete();

-- 6. Updated handle_new_user Trigger to inspect whitelist on first Google login
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

    -- 2. Insert into profiles
    INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        v_role,
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = timezone('utc'::text, now());

    -- 3. If member, initialize member permissions based on team tag
    IF v_role = 'member' THEN
        INSERT INTO public.member_permissions (
            member_id,
            can_manage_events,
            can_view_surveys,
            can_verify_attendance,
            can_manage_mcqs,
            can_export_reports
        ) VALUES (
            new.id,
            COALESCE(v_whitelist.team_tag = 'awareness', false),
            true,
            COALESCE(v_whitelist.team_tag = 'workshops', false),
            false,
            COALESCE(v_whitelist.team_tag = 'analyzing', true)
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
