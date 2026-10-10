-- ==============================================================================
-- THE AI BRIDGE WEB APPLICATION | IIUI FMS
-- Database Schema Definition (PostgreSQL / Supabase)
-- Version: 2.0 (Updated 3-Step Lifecycle: Pre-Survey -> 30-MCQ Engine -> Post-Survey)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Roles Enum (or text check)
-- Roles: admin (Lead / Tech Lead), member (10 SDG Ambassadors), student (Participants / Educators)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'member', 'student')),
    student_id TEXT, -- e.g. 003822bsbaf24 or Faculty ID
    department TEXT DEFAULT 'Faculty of Management Sciences (FMS)',
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Member Permissions Table (Granular controls toggled by Admin)
CREATE TABLE IF NOT EXISTS public.member_permissions (
    member_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    can_manage_events BOOLEAN NOT NULL DEFAULT false,
    can_view_surveys BOOLEAN NOT NULL DEFAULT true,
    can_verify_attendance BOOLEAN NOT NULL DEFAULT false,
    can_manage_mcqs BOOLEAN NOT NULL DEFAULT false,
    can_export_reports BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Events & Gallery Table (SDG Walk, Workshops, Awareness Campaigns)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location TEXT DEFAULT 'International Islamic University Islamabad (IIUI)',
    description TEXT NOT NULL,
    cover_image_url TEXT,
    gallery_urls TEXT[] DEFAULT '{}',
    sdg_tags TEXT[] DEFAULT ARRAY['SDG 4: Quality Education', 'SDG 8: Decent Work', 'SDG 10: Reduced Inequalities', 'SDG 17: Partnerships'],
    team_tag TEXT NOT NULL DEFAULT 'workshops' CHECK (team_tag IN ('awareness', 'workshops', 'analyzing', 'general')),
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'internal')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. MCQ Question Pool (50 questions pool, dynamically sampled for 30 questions)
CREATE TABLE IF NOT EXISTS public.mcq_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- e.g. ["Option A", "Option B", "Option C", "Option D"]
    correct_option_index INT NOT NULL CHECK (correct_option_index BETWEEN 0 AND 3),
    explanation TEXT,
    category TEXT NOT NULL DEFAULT 'NotebookLM & AI Foundations',
    difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('easy', 'intermediate', 'advanced')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Survey Responses (Pre-Survey & Post-Survey)
CREATE TABLE IF NOT EXISTS public.surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    respondent_email TEXT NOT NULL,
    survey_type TEXT NOT NULL CHECK (survey_type IN ('pre', 'post')),
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    hours_saved_estimate NUMERIC DEFAULT 0, -- Tracked for QIP Metric: 3-5 hrs/week
    comprehension_self_rating INT CHECK (comprehension_self_rating BETWEEN 1 AND 5),
    feedback_notes TEXT,
    sheet_row_number INT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_respondent_survey UNIQUE (respondent_email, survey_type)
);

-- 7. Course Assessment Attempts (30 randomized MCQs drawn from pool)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    drawn_question_ids UUID[] NOT NULL,
    user_answers JSONB NOT NULL, -- { question_id: selected_index }
    score INT NOT NULL, -- e.g. 25
    total_questions INT NOT NULL DEFAULT 30,
    passing_score INT NOT NULL DEFAULT 21, -- 70% passing threshold (21/30)
    passed BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Certificates Table (Unlocked after: Pre-Survey + Passed 30-MCQ Quiz + Post-Survey)
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id TEXT NOT NULL UNIQUE, -- e.g. AIB-2025-0001
    verification_code TEXT NOT NULL UNIQUE, -- Unique cryptographic or URL-safe slug
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    recipient_role TEXT NOT NULL DEFAULT 'Trained Educator / Participant',
    student_id TEXT,
    department TEXT,
    course_name TEXT NOT NULL DEFAULT 'The AI Bridge: Source-Grounded AI & NotebookLM Mastery',
    completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pdf_url TEXT,
    qr_code_url TEXT,
    is_valid BOOLEAN NOT NULL DEFAULT true,
    issued_by TEXT NOT NULL DEFAULT 'Dr. Abdul Zahid Khan (Chairperson, TPM Department, FMS IIUI)',
    issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_certificate UNIQUE (user_id)
);

-- 9. System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Insert Default Settings
INSERT INTO public.system_settings (key, value) VALUES
('general', '{"campaign_name": "The AI Bridge", "institution": "International Islamic University Islamabad", "faculty": "Faculty of Management Sciences (FMS)", "mentor": "Dr. Abdul Zahid Khan"}'::jsonb),
('certification', '{"passing_percentage": 70, "questions_per_quiz": 30, "total_pool_size": 50, "signatory_name": "Dr. Abdul Zahid Khan", "signatory_title": "Chairperson, Dept. of Technology & Project Management"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 10. Survey Audit & Synchronization Logs (Tracks INSERT, UPDATE, and DELETE operations)
CREATE TABLE IF NOT EXISTS public.survey_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    survey_type TEXT CHECK (survey_type IN ('pre', 'post')),
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    source TEXT NOT NULL DEFAULT 'google_sheets' CHECK (source IN ('google_sheets', 'web_portal', 'api', 'database', 'admin_override')),
    sheet_row_number INT,
    performed_by TEXT, -- Email or username of the person editing the sheet/system
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_survey_audit_email ON public.survey_audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_survey_audit_action ON public.survey_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_survey_audit_created_at ON public.survey_audit_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check User Role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile or admin/members can view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admin/members can view all"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id 
  OR public.get_user_role() IN ('admin', 'member')
);

DROP POLICY IF EXISTS "Users can update own basic profile" ON public.profiles;
CREATE POLICY "Users can update own basic profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (public.get_user_role() = 'admin');

-- EVENTS POLICIES
DROP POLICY IF EXISTS "Public events visible to all" ON public.events;
CREATE POLICY "Public events visible to all"
ON public.events FOR SELECT
USING (visibility = 'public' OR public.get_user_role() IN ('admin', 'member'));

DROP POLICY IF EXISTS "Admins and authorized members can manage events" ON public.events;
CREATE POLICY "Admins and authorized members can manage events"
ON public.events FOR ALL
USING (public.get_user_role() IN ('admin', 'member'));

-- MCQ POOL POLICIES
DROP POLICY IF EXISTS "Anyone authenticated can view active questions (excluding answer checking)" ON public.mcq_pool;
CREATE POLICY "Anyone authenticated can view active questions (excluding answer checking)"
ON public.mcq_pool FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage mcq pool" ON public.mcq_pool;
CREATE POLICY "Admins can manage mcq pool"
ON public.mcq_pool FOR ALL
USING (public.get_user_role() = 'admin');

-- SURVEYS POLICIES
DROP POLICY IF EXISTS "Users can manage own surveys" ON public.surveys;
CREATE POLICY "Users can manage own surveys"
ON public.surveys FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins and members can view all surveys" ON public.surveys;
CREATE POLICY "Admins and members can view all surveys"
ON public.surveys FOR SELECT
USING (public.get_user_role() IN ('admin', 'member'));

-- QUIZ ATTEMPTS POLICIES
DROP POLICY IF EXISTS "Users can view and insert own attempts" ON public.quiz_attempts;
CREATE POLICY "Users can view and insert own attempts"
ON public.quiz_attempts FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins and members can view all quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Admins and members can view all quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (public.get_user_role() IN ('admin', 'member'));

-- CERTIFICATES POLICIES
DROP POLICY IF EXISTS "Public verification can read certificate by verification_code or id" ON public.certificates;
CREATE POLICY "Public verification can read certificate by verification_code or id"
ON public.certificates FOR SELECT
USING (true); -- Public verification needs read access

DROP POLICY IF EXISTS "Users can view own certificate" ON public.certificates;
CREATE POLICY "Users can view own certificate"
ON public.certificates FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
CREATE POLICY "Admins can manage certificates"
ON public.certificates FOR ALL
USING (public.get_user_role() = 'admin');

-- SYSTEM SETTINGS POLICIES
DROP POLICY IF EXISTS "Public read general settings" ON public.system_settings;
CREATE POLICY "Public read general settings"
ON public.system_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins manage settings" ON public.system_settings;
CREATE POLICY "Admins manage settings"
ON public.system_settings FOR ALL
USING (public.get_user_role() = 'admin');

-- SURVEY AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Admins and members can view survey audit logs" ON public.survey_audit_logs;
CREATE POLICY "Admins and members can view survey audit logs"
ON public.survey_audit_logs FOR SELECT
USING (public.get_user_role() IN ('admin', 'member'));

DROP POLICY IF EXISTS "Admins can manage survey audit logs" ON public.survey_audit_logs;
CREATE POLICY "Admins can manage survey audit logs"
ON public.survey_audit_logs FOR ALL
USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Allow server inserts on audit logs" ON public.survey_audit_logs;
CREATE POLICY "Allow server inserts on audit logs"
ON public.survey_audit_logs FOR INSERT
WITH CHECK (true);

-- ==============================================================================
-- AUTOMATIC SURVEY AUDIT TRIGGER (INSERT, UPDATE, DELETE)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.log_survey_audit()
RETURNS trigger AS $$
DECLARE
    v_user_email TEXT;
    v_changed TEXT[] := '{}';
    v_source TEXT;
    v_performer TEXT;
BEGIN
    v_source := COALESCE(current_setting('app.audit_source', true), 'google_sheets');
    v_performer := current_setting('app.audit_performer', true);

    IF (TG_OP = 'INSERT') THEN
        v_user_email := LOWER(TRIM(COALESCE(NEW.respondent_email, (SELECT email FROM public.profiles WHERE id = NEW.user_id), 'unknown')));
        IF v_performer IS NULL THEN
            v_performer := v_user_email;
        END IF;

        INSERT INTO public.survey_audit_logs (
            survey_id, user_id, user_email, survey_type, action, source, 
            sheet_row_number, performed_by, new_data
        ) VALUES (
            NEW.id, NEW.user_id, v_user_email, NEW.survey_type, 'INSERT', 
            v_source, NEW.sheet_row_number, v_performer, to_jsonb(NEW)
        );
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        v_user_email := LOWER(TRIM(COALESCE(NEW.respondent_email, (SELECT email FROM public.profiles WHERE id = NEW.user_id), 'unknown')));
        IF v_performer IS NULL THEN
            v_performer := v_user_email;
        END IF;

        -- Automatically detect altered columns
        IF (OLD.answers IS DISTINCT FROM NEW.answers) THEN v_changed := array_append(v_changed, 'answers'); END IF;
        IF (OLD.hours_saved_estimate IS DISTINCT FROM NEW.hours_saved_estimate) THEN v_changed := array_append(v_changed, 'hours_saved_estimate'); END IF;
        IF (OLD.comprehension_self_rating IS DISTINCT FROM NEW.comprehension_self_rating) THEN v_changed := array_append(v_changed, 'comprehension_self_rating'); END IF;
        IF (OLD.feedback_notes IS DISTINCT FROM NEW.feedback_notes) THEN v_changed := array_append(v_changed, 'feedback_notes'); END IF;
        IF (OLD.sheet_row_number IS DISTINCT FROM NEW.sheet_row_number) THEN v_changed := array_append(v_changed, 'sheet_row_number'); END IF;

        -- Update the updated_at timestamp
        NEW.updated_at := timezone('utc'::text, now());

        INSERT INTO public.survey_audit_logs (
            survey_id, user_id, user_email, survey_type, action, source, 
            sheet_row_number, performed_by, old_data, new_data, changed_fields
        ) VALUES (
            NEW.id, NEW.user_id, v_user_email, NEW.survey_type, 'UPDATE', 
            v_source, NEW.sheet_row_number, v_performer, to_jsonb(OLD), to_jsonb(NEW), v_changed
        );
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        v_user_email := LOWER(TRIM(COALESCE(OLD.respondent_email, (SELECT email FROM public.profiles WHERE id = OLD.user_id), 'unknown')));
        IF v_performer IS NULL THEN
            v_performer := v_user_email;
        END IF;

        INSERT INTO public.survey_audit_logs (
            survey_id, user_id, user_email, survey_type, action, source, 
            sheet_row_number, performed_by, old_data
        ) VALUES (
            OLD.id, OLD.user_id, v_user_email, OLD.survey_type, 'DELETE', 
            v_source, OLD.sheet_row_number, v_performer, to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_survey_audit ON public.surveys;
CREATE TRIGGER trg_survey_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.surveys
  FOR EACH ROW EXECUTE PROCEDURE public.log_survey_audit();

-- ==============================================================================
-- ROLE WHITELIST TABLE & POLICIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.role_whitelist (
    email TEXT PRIMARY KEY,
    target_role TEXT NOT NULL DEFAULT 'member' CHECK (target_role IN ('admin', 'member', 'student')),
    team_tag TEXT NOT NULL DEFAULT 'general' CHECK (team_tag IN ('awareness', 'workshops', 'analyzing', 'general')),
    full_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_role_whitelist_lower_email ON public.role_whitelist(LOWER(email));

ALTER TABLE public.role_whitelist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage role whitelist" ON public.role_whitelist;
CREATE POLICY "Admins can manage role whitelist"
ON public.role_whitelist FOR ALL
USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Members can view role whitelist" ON public.role_whitelist;
CREATE POLICY "Members can view role whitelist"
ON public.role_whitelist FOR SELECT
USING (public.get_user_role() IN ('admin', 'member'));

-- Trigger: Sync Whitelist changes to registered profiles in real time
CREATE OR REPLACE FUNCTION public.sync_whitelist_to_profile()
RETURNS trigger AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    UPDATE public.profiles
    SET role = NEW.target_role,
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

-- Trigger: When an email is removed from whitelist, reset to student
CREATE OR REPLACE FUNCTION public.handle_whitelist_delete()
RETURNS trigger AS $$
BEGIN
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

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER & SURVEY AUTO-LINK
-- ==============================================================================
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

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

