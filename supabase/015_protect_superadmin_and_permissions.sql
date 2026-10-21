-- ==============================================================================
-- THE AI BRIDGE WEB APPLICATION | IIUI FMS
-- Migration 015: Permanent Super Admin Protection & Team Management Permissions Fix
-- Protects: ai.bridge.iiui.fms@gmail.com (Super Admin) from auto-demotion
-- Prevents: can_manage_team from auto-resetting
-- ==============================================================================

SET search_path TO public;

-- 1. Ensure Super Admin is recorded in public.members with full permissions
INSERT INTO public.members (
    email,
    full_name,
    team_role,
    designation,
    team_tag,
    can_manage_team,
    mcq_access_level,
    is_published,
    position_order
) VALUES (
    'ai.bridge.iiui.fms@gmail.com',
    'Muhammad Tayyab',
    'admin',
    'App Development Team Lead & Super Admin',
    'Executive Governance',
    true,
    'manager',
    false, -- NOT published on the public /team page
    99
)
ON CONFLICT (email) DO UPDATE SET
    team_role = 'admin',
    can_manage_team = true,
    mcq_access_level = 'manager',
    is_published = false,
    position_order = 99,
    updated_at = timezone('utc'::text, now());

-- 2. Link profile_id if profile row already exists in public.profiles
UPDATE public.members m
SET profile_id = p.id,
    updated_at = timezone('utc'::text, now())
FROM public.profiles p
WHERE LOWER(REGEXP_REPLACE(m.email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(p.email, '\s+', '', 'g'))
  AND LOWER(REGEXP_REPLACE(m.email, '\s+', '', 'g')) = 'ai.bridge.iiui.fms@gmail.com';

-- 3. Restore 'admin' role in public.profiles
UPDATE public.profiles
SET role = 'admin',
    updated_at = timezone('utc'::text, now())
WHERE LOWER(REGEXP_REPLACE(email, '\s+', '', 'g')) = 'ai.bridge.iiui.fms@gmail.com';

-- 4. Update resolve_user_role with PERMANENT HARDCODED SUPER ADMIN SAFEGUARD
-- This guarantees that sync_user_role (called on every login) can NEVER demote the Super Admin!
CREATE OR REPLACE FUNCTION public.resolve_user_role(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
    v_email TEXT := LOWER(REGEXP_REPLACE(COALESCE(p_email, ''), '\s+', '', 'g'));
    v_role  TEXT;
BEGIN
    IF v_email = '' THEN
        RETURN 'guest';
    END IF;

    -- [CRITICAL SAFEGUARD] Super Admin email is ALWAYS 'admin'
    IF v_email = 'ai.bridge.iiui.fms@gmail.com' THEN
        RETURN 'admin';
    END IF;

    -- 1. Team member (a members row exists) -> use the invite/team role
    SELECT team_role INTO v_role
    FROM public.members
    WHERE LOWER(REGEXP_REPLACE(email, '\s+', '', 'g')) = v_email
    LIMIT 1;
    IF v_role IS NOT NULL THEN
        RETURN v_role;
    END IF;

    -- 2. Student form: official student email first, personal email in answers as fallback
    IF EXISTS (
        SELECT 1 FROM public.student_surveys s
        WHERE LOWER(REGEXP_REPLACE(s.student_email, '\s+', '', 'g')) = v_email
    ) OR EXISTS (
        SELECT 1 FROM public.student_surveys s,
             LATERAL jsonb_each_text(COALESCE(s.answers, '{}'::jsonb)) kv
        WHERE LOWER(REGEXP_REPLACE(kv.value, '\s+', '', 'g')) = v_email
          AND LOWER(kv.key) NOT LIKE '%survey%'
    ) THEN
        RETURN 'student';
    END IF;

    -- 3. Teacher form
    IF EXISTS (
        SELECT 1 FROM public.teacher_surveys t
        WHERE LOWER(REGEXP_REPLACE(t.teacher_email, '\s+', '', 'g')) = v_email
    ) OR EXISTS (
        SELECT 1 FROM public.teacher_surveys t,
             LATERAL jsonb_each_text(COALESCE(t.answers, '{}'::jsonb)) kv
        WHERE LOWER(REGEXP_REPLACE(kv.value, '\s+', '', 'g')) = v_email
          AND LOWER(kv.key) NOT LIKE '%survey%'
    ) THEN
        RETURN 'teacher';
    END IF;

    -- 4. Legacy surveys
    IF EXISTS (
        SELECT 1 FROM public.surveys
        WHERE LOWER(REGEXP_REPLACE(respondent_email, '\s+', '', 'g')) = v_email
    ) THEN
        RETURN 'student';
    END IF;

    -- 5. In no form at all
    RETURN 'guest';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. Update can_user_manage_team() to ALWAYS grant management rights to Super Admin
CREATE OR REPLACE FUNCTION public.can_user_manage_team()
RETURNS BOOLEAN AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email FROM public.profiles WHERE id = auth.uid();
    
    -- Super Admin always has full team management authority
    IF LOWER(REGEXP_REPLACE(COALESCE(v_email, ''), '\s+', '', 'g')) = 'ai.bridge.iiui.fms@gmail.com' THEN
        RETURN true;
    END IF;

    RETURN (
        public.get_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.members
            WHERE profile_id = auth.uid() AND can_manage_team = true
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
