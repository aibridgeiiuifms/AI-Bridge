-- ==============================================================================
-- THE AI BRIDGE WEB APPLICATION | IIUI FMS
-- Migration 014: Members Consolidation + Automatic Role Assignment System
-- ------------------------------------------------------------------------------
-- Merges role_whitelist + member_permissions + team_members  ->  public.members
-- Drops   survey_audit_logs (no edit system) and campaign_tasks.tag
-- Renames role value  'member'  ->  'team-member'
-- Adds    resolve_user_role() / sync_user_role() (auto role on every login)
-- ==============================================================================

SET search_path TO public;

-- ==============================================================================
-- 1. `profiles` — widen role CHECK, migrate the old 'member' value, drop assigned_tasks
-- ==============================================================================
-- Order matters: drop the OLD constraint first, otherwise updating 'member' ->
-- 'team-member' fails against the old CHECK (which only allowed 'member').
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

UPDATE public.profiles SET role = 'team-member' WHERE role = 'member';

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'team-member', 'student', 'teacher', 'guest'));

ALTER TABLE public.profiles DROP COLUMN IF EXISTS assigned_tasks;

-- ==============================================================================
-- 2. Create the consolidated `members` table
--    (team/invite role + public profile + permissions in one row)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.members (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id        UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    email             TEXT UNIQUE,
    full_name         TEXT NOT NULL DEFAULT '',
    team_role         TEXT NOT NULL DEFAULT 'team-member' CHECK (team_role IN ('admin', 'team-member')),
    designation       TEXT,
    bio               TEXT,
    avatar_url        TEXT,
    team_tag          TEXT DEFAULT 'General',
    assigned_tasks    TEXT[] DEFAULT '{}',
    linkedin_url      TEXT,
    position_order    INT NOT NULL DEFAULT 99,
    is_published      BOOLEAN NOT NULL DEFAULT true,
    can_manage_team   BOOLEAN NOT NULL DEFAULT false,
    mcq_access_level  TEXT NOT NULL DEFAULT 'none' CHECK (mcq_access_level IN ('none', 'viewer', 'moderator', 'manager')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_members_lower_email ON public.members(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_members_profile_id ON public.members(profile_id);

-- ==============================================================================
-- 3. Data migration (old tables -> members)
-- ==============================================================================

-- 3a. First take the richer public rows from `team_members`
INSERT INTO public.members (
    email, full_name, designation, bio, avatar_url, team_tag, assigned_tasks,
    linkedin_url, position_order, is_published, team_role
)
SELECT
    LOWER(TRIM(tm.email)),
    COALESCE(tm.full_name, ''),
    tm.designation,
    tm.bio,
    tm.avatar_url,
    COALESCE(tm.team_tag, 'General'),
    COALESCE(tm.assigned_tasks, '{}'),
    tm.linkedin_url,
    COALESCE(tm.position_order, 99),
    COALESCE(tm.is_published, true),
    'team-member'
FROM public.team_members tm
WHERE tm.email IS NOT NULL
ON CONFLICT (email) DO UPDATE SET
    full_name      = COALESCE(EXCLUDED.full_name, public.members.full_name),
    designation    = COALESCE(EXCLUDED.designation, public.members.designation),
    bio            = COALESCE(EXCLUDED.bio, public.members.bio),
    avatar_url     = COALESCE(EXCLUDED.avatar_url, public.members.avatar_url),
    team_tag       = COALESCE(EXCLUDED.team_tag, public.members.team_tag),
    assigned_tasks = COALESCE(EXCLUDED.assigned_tasks, public.members.assigned_tasks),
    linkedin_url   = COALESCE(EXCLUDED.linkedin_url, public.members.linkedin_url),
    position_order = EXCLUDED.position_order,
    is_published   = EXCLUDED.is_published,
    updated_at     = timezone('utc'::text, now());

-- 3b. Overlay the invite/team role + permissions from `role_whitelist`
UPDATE public.members m
SET team_role        = CASE WHEN w.target_role = 'admin' THEN 'admin' ELSE 'team-member' END,
    full_name        = COALESCE(NULLIF(m.full_name, ''), w.full_name, split_part(w.email, '@', 1)),
    designation      = COALESCE(m.designation, w.notes),
    bio              = COALESCE(m.bio, w.notes),
    team_tag         = COALESCE(m.team_tag, w.team_tag, 'General'),
    assigned_tasks   = CASE WHEN COALESCE(array_length(m.assigned_tasks, 1), 0) = 0
                            THEN COALESCE(w.assigned_tasks, '{}') ELSE m.assigned_tasks END,
    can_manage_team  = COALESCE(w.can_manage_team, m.can_manage_team),
    mcq_access_level = COALESCE(NULLIF(w.mcq_access_level, 'none'), m.mcq_access_level),
    updated_at       = timezone('utc'::text, now())
FROM public.role_whitelist w
WHERE LOWER(TRIM(m.email)) = LOWER(TRIM(w.email));

-- 3c. Insert whitelist entries that have no member row yet (pre-added people)
INSERT INTO public.members (
    email, full_name, team_role, designation, bio, team_tag, assigned_tasks,
    can_manage_team, mcq_access_level, is_published, position_order
)
SELECT
    LOWER(TRIM(w.email)),
    COALESCE(w.full_name, split_part(w.email, '@', 1)),
    CASE WHEN w.target_role = 'admin' THEN 'admin' ELSE 'team-member' END,
    w.notes,
    w.notes,
    COALESCE(w.team_tag, 'General'),
    COALESCE(w.assigned_tasks, '{}'),
    COALESCE(w.can_manage_team, false),
    COALESCE(w.mcq_access_level, 'none'),
    true,
    99
FROM public.role_whitelist w
WHERE w.email IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM public.members m WHERE LOWER(TRIM(m.email)) = LOWER(TRIM(w.email))
  )
ON CONFLICT (email) DO NOTHING;

-- 3d. Fold the granular permissions from `member_permissions`
UPDATE public.members m
SET can_manage_team  = COALESCE(mp.can_manage_team, m.can_manage_team),
    mcq_access_level = CASE
        WHEN mp.mcq_access_level IN ('none', 'viewer', 'moderator', 'manager')
        THEN COALESCE(NULLIF(mp.mcq_access_level, 'none'), m.mcq_access_level)
        WHEN mp.can_manage_mcqs = true THEN 'manager'
        ELSE m.mcq_access_level END,
    updated_at       = timezone('utc'::text, now())
FROM public.member_permissions mp
JOIN public.profiles p ON p.id = mp.member_id
WHERE LOWER(TRIM(m.email)) = LOWER(TRIM(p.email));

-- 3e. Backfill `profile_id` for people who already registered
UPDATE public.members m
SET profile_id = p.id,
    updated_at = timezone('utc'::text, now())
FROM public.profiles p
WHERE m.profile_id IS NULL
  AND LOWER(REGEXP_REPLACE(m.email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(p.email, '\s+', '', 'g'));

-- ==============================================================================
-- 4. Role Assignment System (auto-detect profiles.role)
--    members row -> team_role ; student form -> student ; teacher form -> teacher ; else guest
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.resolve_user_role(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
    v_email TEXT := LOWER(REGEXP_REPLACE(COALESCE(p_email, ''), '\s+', '', 'g'));
    v_role  TEXT;
BEGIN
    IF v_email = '' THEN
        RETURN 'guest';
    END IF;

    -- 1. Team member (a members row exists) -> use the invite/team role
    SELECT team_role INTO v_role
    FROM public.members
    WHERE LOWER(REGEXP_REPLACE(email, '\s+', '', 'g')) = v_email
    LIMIT 1;
    IF v_role IS NOT NULL THEN
        RETURN v_role;
    END IF;

    -- 2. Student form: official student email first, personal email (stored in answers) as fallback
    IF EXISTS (
        SELECT 1 FROM public.student_surveys s
        WHERE LOWER(REGEXP_REPLACE(s.student_email, '\s+', '', 'g')) = v_email
    ) OR EXISTS (
        SELECT 1 FROM public.student_surveys s,
             LATERAL jsonb_each_text(COALESCE(s.answers, '{}'::jsonb)) kv
        WHERE LOWER(REGEXP_REPLACE(kv.value, '\s+', '', 'g')) = v_email
          AND LOWER(kv.key) NOT LIKE '%survey%'   -- never match the "Email address (survey)" column
    ) THEN
        RETURN 'student';
    END IF;

    -- 3. Teacher form: institutional email (teacher_email) or form answers
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

    -- 4. Legacy single-table surveys -> treat as student
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

-- Reusable idempotent resolver, called on every login (and on signup via the trigger)
CREATE OR REPLACE FUNCTION public.sync_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_email TEXT;
    v_role  TEXT;
BEGIN
    SELECT email INTO v_email FROM public.profiles WHERE id = p_user_id;
    IF v_email IS NULL THEN
        RETURN NULL;
    END IF;

    v_role := public.resolve_user_role(v_email);

    UPDATE public.profiles
    SET role = v_role, updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id AND role IS DISTINCT FROM v_role;

    -- Attach the member row (late joiner) to the freshly logged-in profile
    UPDATE public.members
    SET profile_id = p_user_id, updated_at = timezone('utc'::text, now())
    WHERE profile_id IS NULL
      AND LOWER(REGEXP_REPLACE(email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(v_email, '\s+', '', 'g'));

    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 5. Helper: Can the current user manage the team?
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.can_user_manage_team()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        public.get_user_role() = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.members
            WHERE profile_id = auth.uid() AND can_manage_team = true
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. RLS for `members`
-- ==============================================================================
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published members" ON public.members;
CREATE POLICY "Public can view published members"
ON public.members FOR SELECT
USING (is_published = true);

DROP POLICY IF EXISTS "Managers and owners can view all members" ON public.members;
CREATE POLICY "Managers and owners can view all members"
ON public.members FOR SELECT
USING (public.can_user_manage_team() OR profile_id = auth.uid());

DROP POLICY IF EXISTS "Managers can insert members" ON public.members;
CREATE POLICY "Managers can insert members"
ON public.members FOR INSERT
WITH CHECK (public.can_user_manage_team());

DROP POLICY IF EXISTS "Managers can update members" ON public.members;
CREATE POLICY "Managers can update members"
ON public.members FOR UPDATE
USING (public.can_user_manage_team())
WITH CHECK (public.can_user_manage_team());

DROP POLICY IF EXISTS "Managers can delete members" ON public.members;
CREATE POLICY "Managers can delete members"
ON public.members FOR DELETE
USING (public.can_user_manage_team());

-- ==============================================================================
-- 7. Update policies that referenced the old 'member' role value
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own profile or admin/members can view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admin/members can view all"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.get_user_role() IN ('admin', 'team-member'));

DROP POLICY IF EXISTS "Public events visible to all" ON public.events;
CREATE POLICY "Public events visible to all"
ON public.events FOR SELECT
USING (visibility = 'public' OR public.get_user_role() IN ('admin', 'team-member'));

DROP POLICY IF EXISTS "Admins and authorized members can manage events" ON public.events;
CREATE POLICY "Admins and authorized members can manage events"
ON public.events FOR ALL
USING (public.get_user_role() IN ('admin', 'team-member'));

DROP POLICY IF EXISTS "Admins and members can view all surveys" ON public.surveys;
CREATE POLICY "Admins and members can view all surveys"
ON public.surveys FOR SELECT
USING (public.get_user_role() IN ('admin', 'team-member'));

DROP POLICY IF EXISTS "Admins and members can view all quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Admins and members can view all quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (public.get_user_role() IN ('admin', 'team-member'));

DROP POLICY IF EXISTS "Admins can manage department mappings" ON public.department_mappings;
CREATE POLICY "Admins can manage department mappings"
ON public.department_mappings FOR ALL
USING (public.get_user_role() IN ('admin', 'team-member'));

DROP POLICY IF EXISTS "Admins manage student surveys" ON public.student_surveys;
CREATE POLICY "Admins manage student surveys"
ON public.student_surveys FOR ALL
USING (public.get_user_role() IN ('admin', 'team-member'));

DROP POLICY IF EXISTS "Admins manage teacher surveys" ON public.teacher_surveys;
CREATE POLICY "Admins manage teacher surveys"
ON public.teacher_surveys FOR ALL
USING (public.get_user_role() IN ('admin', 'team-member'));

-- ==============================================================================
-- 8. Rewrite the auth + profile-link hooks on top of `members`
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_role       TEXT;
    v_raw_name   TEXT;
    v_clean_name TEXT;
    v_student_id TEXT := NULL;
BEGIN
    v_role := public.resolve_user_role(new.email);

    -- Preserve the name sanitizer from migration 011 (strips roll numbers for students)
    v_raw_name   := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
    v_clean_name := public.sanitize_iiui_name(v_raw_name, new.email);

    IF new.email LIKE '%@student.iiu.edu.pk' AND v_raw_name ~ '\d' THEN
        v_student_id := substring(v_raw_name from '\d+.*$');
    END IF;

    INSERT INTO public.profiles (id, email, full_name, student_id, role, avatar_url)
    VALUES (
        new.id,
        new.email,
        v_clean_name,
        v_student_id,
        v_role,
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        student_id = COALESCE(public.profiles.student_id, EXCLUDED.student_id),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = timezone('utc'::text, now());

    -- Link any pre-registered member row to this new profile
    UPDATE public.members
    SET profile_id = new.id, updated_at = timezone('utc'::text, now())
    WHERE profile_id IS NULL
      AND LOWER(REGEXP_REPLACE(email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(new.email, '\s+', '', 'g'));

    -- Link any pre-submitted surveys (legacy single-table)
    UPDATE public.surveys
    SET user_id = new.id
    WHERE LOWER(REGEXP_REPLACE(respondent_email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(new.email, '\s+', '', 'g'))
      AND user_id IS NULL;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_link_surveys_to_profile()
RETURNS trigger AS $$
BEGIN
    IF NEW.email IS NOT NULL THEN
        UPDATE public.student_surveys
        SET user_id = NEW.id
        WHERE user_id IS NULL
          AND LOWER(REGEXP_REPLACE(student_email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(NEW.email, '\s+', '', 'g'));

        UPDATE public.teacher_surveys
        SET user_id = NEW.id
        WHERE user_id IS NULL
          AND LOWER(REGEXP_REPLACE(teacher_email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(NEW.email, '\s+', '', 'g'));

        UPDATE public.surveys
        SET user_id = NEW.id
        WHERE user_id IS NULL
          AND LOWER(REGEXP_REPLACE(respondent_email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(NEW.email, '\s+', '', 'g'));

        UPDATE public.members
        SET profile_id = NEW.id, updated_at = timezone('utc'::text, now())
        WHERE profile_id IS NULL
          AND LOWER(REGEXP_REPLACE(email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(NEW.email, '\s+', '', 'g'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_link_surveys_on_profile ON public.profiles;
CREATE TRIGGER trg_link_surveys_on_profile
    AFTER INSERT OR UPDATE OF email ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_link_surveys_to_profile();

-- ==============================================================================
-- 9. Drop the obsolete tables / triggers / functions / columns
-- ==============================================================================
DROP TRIGGER IF EXISTS trg_sync_whitelist_to_profile ON public.role_whitelist;
DROP TRIGGER IF EXISTS trg_handle_whitelist_delete ON public.role_whitelist;
DROP FUNCTION IF EXISTS public.sync_whitelist_to_profile();
DROP FUNCTION IF EXISTS public.handle_whitelist_delete();

DROP TRIGGER IF EXISTS trg_survey_audit ON public.surveys;
DROP FUNCTION IF EXISTS public.log_survey_audit();

DROP TABLE IF EXISTS public.survey_audit_logs CASCADE;
DROP TABLE IF EXISTS public.role_whitelist CASCADE;
DROP TABLE IF EXISTS public.member_permissions CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;

ALTER TABLE public.campaign_tasks DROP COLUMN IF EXISTS tag;
