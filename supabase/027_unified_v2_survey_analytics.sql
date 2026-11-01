-- ==============================================================================
-- THE AI BRIDGE | IIUI FMS
-- Migration 027: Unified V2 Survey Analytics & Granular Access Pipeline
-- Includes:
--   1. public.survey_responses_v2 (Safe, isolated analytics table)
--   2. public.member_chart_permissions (Granular per-member per-chart toggles)
--   3. public.guest_access_settings (Simple QR + shared passcode config)
--   4. public.guest_access_logs (Guest login history with block/revoke status)
--   5. public.admin_notifications (Live alerts for guest access and system events)
--   6. Automatic safe backfill from student_surveys & teacher_surveys
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Survey Responses V2 Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.survey_responses_v2 (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- SOURCE IDENTITY
    form_source      TEXT NOT NULL, -- 'student_pre' | 'student_post' | 'teacher_pre' | 'teacher_post'
    participant_type TEXT NOT NULL CHECK (participant_type IN ('student', 'teacher')),
    survey_phase     TEXT NOT NULL CHECK (survey_phase IN ('pre', 'post')),
    match_key        TEXT NOT NULL,  -- ts:<timestamp> stable row identity

    -- CONTACT / IDENTITY
    email            TEXT NOT NULL,
    login_email      TEXT,           -- Google-login email (reference only)
    full_name        TEXT,

    -- EMAIL-DERIVED FIELDS (students)
    reg_no           TEXT,
    dept_code        TEXT REFERENCES public.department_mappings(code) ON UPDATE CASCADE ON DELETE SET NULL,
    semester         TEXT,           -- e.g. F26, S25

    -- TEACHER-SPECIFIC FIELDS
    designation      TEXT,           -- Lecturer, Asst. Prof, etc.
    department_name  TEXT,           -- Free-text from form
    teaching_experience TEXT,        -- '1-3 years', '3-5 years', '5+ years'

    -- CROSS-CONTAMINATION FLAG
    is_misrouted     BOOLEAN NOT NULL DEFAULT false, -- TRUE if student email found in teacher form

    -- ANALYSIS FIELDS
    hours_saved_category   TEXT,
    ai_familiarity_rating  INT CHECK (ai_familiarity_rating BETWEEN 1 AND 5),
    feedback_notes         TEXT,

    -- RAW DATA
    answers          JSONB NOT NULL DEFAULT '{}'::jsonb,
    sheet_row_number INT,

    -- TIMESTAMPS
    submitted_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    synced_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT uq_survey_v2_match UNIQUE (match_key, form_source)
);

CREATE INDEX IF NOT EXISTS idx_sv2_email        ON public.survey_responses_v2(email);
CREATE INDEX IF NOT EXISTS idx_sv2_form_source  ON public.survey_responses_v2(form_source);
CREATE INDEX IF NOT EXISTS idx_sv2_dept         ON public.survey_responses_v2(dept_code);
CREATE INDEX IF NOT EXISTS idx_sv2_semester     ON public.survey_responses_v2(semester);
CREATE INDEX IF NOT EXISTS idx_sv2_phase        ON public.survey_responses_v2(survey_phase);
CREATE INDEX IF NOT EXISTS idx_sv2_misrouted    ON public.survey_responses_v2(is_misrouted);
CREATE INDEX IF NOT EXISTS idx_sv2_match        ON public.survey_responses_v2(match_key);
CREATE INDEX IF NOT EXISTS idx_sv2_participant  ON public.survey_responses_v2(participant_type);

-- ------------------------------------------------------------------------------
-- 2. Granular Member Chart Permissions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.member_chart_permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    chart_id    TEXT NOT NULL,
    is_allowed  BOOLEAN NOT NULL DEFAULT true,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_member_chart UNIQUE (member_id, chart_id)
);

CREATE INDEX IF NOT EXISTS idx_mcp_member_id ON public.member_chart_permissions(member_id);

-- ------------------------------------------------------------------------------
-- 3. Outsider Guest Access Settings (Simple Option B)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guest_access_settings (
    id          TEXT PRIMARY KEY DEFAULT 'global',
    passcode    TEXT NOT NULL DEFAULT 'AIB-Impact-2026',
    is_enabled  BOOLEAN NOT NULL DEFAULT true,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.guest_access_settings (id, passcode, is_enabled)
VALUES ('global', 'AIB-Impact-2026', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. Guest Access Logs & Admin Revoke/Block
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guest_access_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passcode_used  TEXT,
    ip_address     TEXT,
    user_agent     TEXT,
    device_info    TEXT,
    is_blocked     BOOLEAN NOT NULL DEFAULT false,
    accessed_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_gal_accessed_at ON public.guest_access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_gal_is_blocked  ON public.guest_access_logs(is_blocked);

-- ------------------------------------------------------------------------------
-- 5. Admin Live Notifications Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type        TEXT NOT NULL, -- 'guest_login', 'name_change', 'survey_sync'
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_an_is_read    ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_an_created_at ON public.admin_notifications(created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. Row Level Security Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.survey_responses_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_chart_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_access_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Survey Responses V2 Policies
DROP POLICY IF EXISTS "Public read v2 surveys" ON public.survey_responses_v2;
CREATE POLICY "Public read v2 surveys"
    ON public.survey_responses_v2 FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage v2 surveys" ON public.survey_responses_v2;
CREATE POLICY "Admins manage v2 surveys"
    ON public.survey_responses_v2 FOR ALL
    USING (public.get_user_role() IN ('admin', 'member'));

DROP POLICY IF EXISTS "Service role full access v2 surveys" ON public.survey_responses_v2;
CREATE POLICY "Service role full access v2 surveys"
    ON public.survey_responses_v2 FOR ALL
    WITH CHECK (true);

-- Member Chart Permissions Policies
DROP POLICY IF EXISTS "Members can view own chart permissions" ON public.member_chart_permissions;
CREATE POLICY "Members can view own chart permissions"
    ON public.member_chart_permissions FOR SELECT
    USING (member_id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage chart permissions" ON public.member_chart_permissions;
CREATE POLICY "Admins can manage chart permissions"
    ON public.member_chart_permissions FOR ALL
    USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Service role manage chart permissions" ON public.member_chart_permissions;
CREATE POLICY "Service role manage chart permissions"
    ON public.member_chart_permissions FOR ALL
    WITH CHECK (true);

-- Guest Settings & Logs Policies
DROP POLICY IF EXISTS "Admins manage guest settings" ON public.guest_access_settings;
CREATE POLICY "Admins manage guest settings"
    ON public.guest_access_settings FOR ALL
    USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Public can read guest settings status" ON public.guest_access_settings;
CREATE POLICY "Public can read guest settings status"
    ON public.guest_access_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins manage guest logs" ON public.guest_access_logs;
CREATE POLICY "Admins manage guest logs"
    ON public.guest_access_logs FOR ALL
    USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Service role manage guest logs" ON public.guest_access_logs;
CREATE POLICY "Service role manage guest logs"
    ON public.guest_access_logs FOR ALL
    WITH CHECK (true);

-- Admin Notifications Policies
DROP POLICY IF EXISTS "Admins manage notifications" ON public.admin_notifications;
CREATE POLICY "Admins manage notifications"
    ON public.admin_notifications FOR ALL
    USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "Service role manage notifications" ON public.admin_notifications;
CREATE POLICY "Service role manage notifications"
    ON public.admin_notifications FOR ALL
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. Safe Backfill from student_surveys & teacher_surveys
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    -- Backfill students
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_surveys') THEN
        INSERT INTO public.survey_responses_v2 (
            form_source, participant_type, survey_phase,
            match_key, email, login_email, full_name,
            reg_no, dept_code, semester,
            hours_saved_category, ai_familiarity_rating, feedback_notes,
            answers, sheet_row_number, submitted_at
        )
        SELECT
            'student_' || COALESCE(survey_type, 'pre'),
            'student',
            COALESCE(survey_type, 'pre'),
            COALESCE(match_key, 'em:' || LOWER(TRIM(student_email))),
            LOWER(TRIM(student_email)),
            login_email,
            full_name,
            reg_no, dept_code, semester,
            hours_saved_category, ai_familiarity_rating, feedback_notes,
            answers, sheet_row_number, submitted_at
        FROM public.student_surveys
        ON CONFLICT (match_key, form_source) DO NOTHING;
    END IF;

    -- Backfill teachers (auto-flag misrouted students)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teacher_surveys') THEN
        INSERT INTO public.survey_responses_v2 (
            form_source, participant_type, survey_phase,
            match_key, email, login_email, full_name,
            designation, department_name, teaching_experience,
            is_misrouted,
            hours_saved_category, ai_familiarity_rating, feedback_notes,
            answers, sheet_row_number, submitted_at
        )
        SELECT
            'teacher_' || COALESCE(survey_type, 'pre'),
            CASE WHEN LOWER(TRIM(teacher_email)) LIKE '%@student.iiu.edu.pk' THEN 'student' ELSE 'teacher' END,
            COALESCE(survey_type, 'pre'),
            COALESCE(match_key, 'em:' || LOWER(TRIM(teacher_email))),
            LOWER(TRIM(teacher_email)),
            login_email,
            full_name,
            designation, department_name, teaching_experience,
            (LOWER(TRIM(teacher_email)) LIKE '%@student.iiu.edu.pk'),
            hours_saved_category, ai_familiarity_rating, feedback_notes,
            answers, sheet_row_number, submitted_at
        FROM public.teacher_surveys
        ON CONFLICT (match_key, form_source) DO NOTHING;
    END IF;
END $$;
