-- ============================================================
-- AI BRIDGE: Analytics & Page Tracking System
-- Migration: 020_analytics_tracking.sql
-- ============================================================

-- 1. Main events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who (user_id is NULL for anonymous guests)
    user_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id   TEXT        NOT NULL,
    user_role    TEXT        NOT NULL DEFAULT 'guest'
                             CHECK (user_role = ANY (ARRAY[
                               'admin'::text,
                               'team-member'::text,
                               'student'::text,
                               'teacher'::text,
                               'guest'::text
                             ])),

    -- What
    event_name   TEXT        NOT NULL,
    page_path    TEXT        NOT NULL,
    properties   JSONB       NOT NULL DEFAULT '{}'::jsonb,

    -- Context
    referrer     TEXT,
    device_type  TEXT        CHECK (device_type = ANY (ARRAY['mobile'::text, 'tablet'::text, 'desktop'::text])),
    browser      TEXT,
    country      TEXT,
    user_agent   TEXT,

    -- When
    created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Fast query indexes
CREATE INDEX IF NOT EXISTS idx_ae_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_ae_page_path  ON public.analytics_events(page_path);
CREATE INDEX IF NOT EXISTS idx_ae_user_id    ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ae_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ae_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_country    ON public.analytics_events(country);

-- 2. Access control table: admin grants team members read access
CREATE TABLE IF NOT EXISTS public.analytics_access_control (
    member_id          UUID        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    can_view_analytics BOOLEAN     NOT NULL DEFAULT false,
    granted_by         UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
    granted_at         TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_access_control ENABLE ROW LEVEL SECURITY;

-- Admins can read all events
DROP POLICY IF EXISTS "admins_read_analytics" ON public.analytics_events;
CREATE POLICY "admins_read_analytics"
    ON public.analytics_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Granted team members can read events
DROP POLICY IF EXISTS "granted_members_read_analytics" ON public.analytics_events;
CREATE POLICY "granted_members_read_analytics"
    ON public.analytics_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.analytics_access_control
            WHERE member_id = auth.uid() AND can_view_analytics = true
        )
    );

-- Only admins manage access control table
DROP POLICY IF EXISTS "admins_manage_access" ON public.analytics_access_control;
CREATE POLICY "admins_manage_access"
    ON public.analytics_access_control FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Members can view their own access status
DROP POLICY IF EXISTS "members_view_own_access" ON public.analytics_access_control;
CREATE POLICY "members_view_own_access"
    ON public.analytics_access_control FOR SELECT
    USING (member_id = auth.uid());

-- NOTE: All event INSERTs go through /api/track using SERVICE_ROLE_KEY
-- which bypasses RLS safely and securely.
