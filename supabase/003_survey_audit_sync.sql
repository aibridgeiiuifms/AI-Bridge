-- ==============================================================================
-- THE AI BRIDGE WEB APPLICATION | IIUI FMS
-- Migration 003: Survey Audit Logs & Google Sheets Two-Way Sync System
-- Tracks INSERT, UPDATE, and DELETE operations with full change history
-- ==============================================================================

-- 1. Ensure `surveys` table supports email mapping, row numbers, and updated timestamps
ALTER TABLE public.surveys 
    ADD COLUMN IF NOT EXISTS respondent_email TEXT,
    ADD COLUMN IF NOT EXISTS sheet_row_number INT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Backfill respondent_email from profiles if NULL
UPDATE public.surveys s
SET respondent_email = p.email
FROM public.profiles p
WHERE s.user_id = p.id AND s.respondent_email IS NULL;

-- Make user_id nullable so surveys submitted before account registration are safely preserved
ALTER TABLE public.surveys ALTER COLUMN user_id DROP NOT NULL;

-- Ensure unique constraint on (respondent_email, survey_type) for reliable upserts from Google Sheets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_respondent_survey'
    ) THEN
        ALTER TABLE public.surveys ADD CONSTRAINT unique_respondent_survey UNIQUE (respondent_email, survey_type);
    END IF;
END $$;

-- 2. Create Survey Audit & Synchronization Table
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

-- Index for speedy queries on user email and timestamps
CREATE INDEX IF NOT EXISTS idx_survey_audit_email ON public.survey_audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_survey_audit_action ON public.survey_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_survey_audit_created_at ON public.survey_audit_logs(created_at DESC);

-- 3. Row Level Security for Survey Audit Logs
ALTER TABLE public.survey_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and members can view survey audit logs" ON public.survey_audit_logs;
CREATE POLICY "Admins and members can view survey audit logs"
ON public.survey_audit_logs FOR SELECT
USING (
    public.get_user_role() IN ('admin', 'member')
);

DROP POLICY IF EXISTS "Admins can manage survey audit logs" ON public.survey_audit_logs;
CREATE POLICY "Admins can manage survey audit logs"
ON public.survey_audit_logs FOR ALL
USING (
    public.get_user_role() = 'admin'
);

-- Allow server webhook insertions using service key or authenticated roles
DROP POLICY IF EXISTS "Service roles can insert audit logs" ON public.survey_audit_logs;
CREATE POLICY "Service roles can insert audit logs"
ON public.survey_audit_logs FOR INSERT
WITH CHECK (true);

-- 4. Automated Database Trigger to log INSERT, UPDATE, and DELETE operations
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

-- 5. Updated Automatic Profile Creation & Survey Auto-Link Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    CASE 
      WHEN new.email IN ('003822bsbaf24@student.iiu.edu.pk', 'aibridge.iiui@gmail.com') THEN 'admin'
      ELSE 'student'
    END,
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Automatically link any previously submitted surveys by this email to the new user ID
  UPDATE public.surveys
  SET user_id = new.id
  WHERE respondent_email = LOWER(TRIM(new.email)) AND user_id IS NULL;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
