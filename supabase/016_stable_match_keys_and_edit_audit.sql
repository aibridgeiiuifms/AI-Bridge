-- ==============================================================================
-- THE AI BRIDGE | IIUI FMS
-- Migration 016: Stable Match Keys + Row-Level Edit Audit Log
-- ==============================================================================
-- WHY THIS MIGRATION EXISTS
--   Today Supabase matches survey rows by (email, survey_type). If a respondent
--   edits their email address in the Google Sheet, the email changes and a
--   SECOND row is created while the OLD row is orphaned  ->  duplicates.
--
-- FIX
--   Every Google Form response carries a `Timestamp` that NEVER changes, even
--   when the respondent edits their response later. We use that Timestamp as a
--   stable `match_key` so an edited email UPDATES the same row instead of
--   creating a duplicate.
--
--   match_key = 'ts:' + <Timestamp from the sheet>     (preferred)
--   match_key = 'em:' + <resolved email>               (only when no Timestamp)
--
-- ALSO ADDED
--   1. `login_email`  -> the auto-collected Google-login email (`Email address`
--      column) so the original identity is always preserved for reference.
--   2. An edit audit log that records ONLY the fields that actually changed.
--
-- EMAIL PRIORITY (enforced in the Apps Script + webhook, documented here):
--   Student : Student Email Address -> Email Address (non-iiui) -> Email address
--   Teacher : Institutional Email Address -> Email Address (non-iiui) -> Email Address
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Stable identity columns
-- ------------------------------------------------------------------------------
ALTER TABLE public.student_surveys
    ADD COLUMN IF NOT EXISTS login_email TEXT,
    ADD COLUMN IF NOT EXISTS match_key   TEXT;

ALTER TABLE public.teacher_surveys
    ADD COLUMN IF NOT EXISTS login_email TEXT,
    ADD COLUMN IF NOT EXISTS match_key   TEXT;

-- Legacy mirror table gets a match_key too, so it is not duplicated on email change
ALTER TABLE public.surveys
    ADD COLUMN IF NOT EXISTS match_key TEXT;

-- ------------------------------------------------------------------------------
-- 2. Backfill `login_email` from the stored answers JSON
--    (student sheets only — the Google-login column is literally "Email address")
-- ------------------------------------------------------------------------------
UPDATE public.student_surveys s
SET login_email = x.val
FROM (
    SELECT s2.id AS sid,
           NULLIF(
               LOWER(REGEXP_REPLACE(COALESCE(kv.value #>> '{}', ''), '\s+', '', 'g')),
               ''
           ) AS val
    FROM public.student_surveys s2
    CROSS JOIN LATERAL jsonb_each(s2.answers) AS kv(key, value)
    WHERE LOWER(TRIM(kv.key)) = 'email address'
) x
WHERE s.id = x.sid
  AND s.login_email IS NULL
  AND x.val IS NOT NULL
  AND x.val LIKE '%@%';

-- ------------------------------------------------------------------------------
-- 3. Backfill `match_key` for existing rows
--    Step A: derive from the Google Form Timestamp stored inside answers JSONB
-- ------------------------------------------------------------------------------
UPDATE public.student_surveys
SET match_key = 'ts:' || LOWER(REGEXP_REPLACE(COALESCE(answers ->> 'Timestamp', ''), '\s+', '', 'g'))
WHERE match_key IS NULL
  AND COALESCE(answers ->> 'Timestamp', '') <> '';

UPDATE public.teacher_surveys
SET match_key = 'ts:' || LOWER(REGEXP_REPLACE(COALESCE(answers ->> 'Timestamp', ''), '\s+', '', 'g'))
WHERE match_key IS NULL
  AND COALESCE(answers ->> 'Timestamp', '') <> '';

UPDATE public.surveys
SET match_key = 'ts:' || LOWER(REGEXP_REPLACE(COALESCE(answers ->> 'Timestamp', ''), '\s+', '', 'g'))
WHERE match_key IS NULL
  AND COALESCE(answers ->> 'Timestamp', '') <> '';

-- Step B: fall back to the email (mirrors the webhook's own fallback)
UPDATE public.student_surveys
SET match_key = 'em:' || LOWER(REGEXP_REPLACE(COALESCE(student_email, ''), '\s+', '', 'g'))
WHERE match_key IS NULL;

UPDATE public.teacher_surveys
SET match_key = 'em:' || LOWER(REGEXP_REPLACE(COALESCE(teacher_email, ''), '\s+', '', 'g'))
WHERE match_key IS NULL;

UPDATE public.surveys
SET match_key = 'em:' || LOWER(REGEXP_REPLACE(COALESCE(respondent_email, ''), '\s+', '', 'g'))
WHERE match_key IS NULL AND COALESCE(respondent_email, '') <> '';

-- Step C: last-resort, guarantees non-null and unique
UPDATE public.student_surveys SET match_key = 'row:' || id::text WHERE match_key IS NULL;
UPDATE public.teacher_surveys SET match_key = 'row:' || id::text WHERE match_key IS NULL;
UPDATE public.surveys         SET match_key = 'row:' || id::text WHERE match_key IS NULL;

-- Step D: if two rows of the same survey_type somehow share a key, disambiguate
--         so the new UNIQUE constraint can be created safely.
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY match_key, survey_type ORDER BY submitted_at, id) AS rn
    FROM public.student_surveys
)
UPDATE public.student_surveys s
SET match_key = s.match_key || '#dup' || r.rn
FROM ranked r
WHERE s.id = r.id AND r.rn > 1;

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY match_key, survey_type ORDER BY submitted_at, id) AS rn
    FROM public.teacher_surveys
)
UPDATE public.teacher_surveys t
SET match_key = t.match_key || '#dup' || r.rn
FROM ranked r
WHERE t.id = r.id AND r.rn > 1;

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY match_key, survey_type ORDER BY submitted_at, id) AS rn
    FROM public.surveys
)
UPDATE public.surveys v
SET match_key = v.match_key || '#dup' || r.rn
FROM ranked r
WHERE v.id = r.id AND r.rn > 1;

ALTER TABLE public.student_surveys ALTER COLUMN match_key SET NOT NULL;
ALTER TABLE public.teacher_surveys ALTER COLUMN match_key SET NOT NULL;
ALTER TABLE public.surveys         ALTER COLUMN match_key SET NOT NULL;

-- ------------------------------------------------------------------------------
-- 4. Swap the upsert constraints: (email, survey_type) -> (match_key, survey_type)
-- ------------------------------------------------------------------------------
ALTER TABLE public.student_surveys DROP CONSTRAINT IF EXISTS unique_student_survey;
ALTER TABLE public.teacher_surveys DROP CONSTRAINT IF EXISTS unique_teacher_survey;
ALTER TABLE public.surveys         DROP CONSTRAINT IF EXISTS unique_respondent_survey;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_survey_match') THEN
        ALTER TABLE public.student_surveys
            ADD CONSTRAINT unique_student_survey_match UNIQUE (match_key, survey_type);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_teacher_survey_match') THEN
        ALTER TABLE public.teacher_surveys
            ADD CONSTRAINT unique_teacher_survey_match UNIQUE (match_key, survey_type);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_survey_match') THEN
        ALTER TABLE public.surveys
            ADD CONSTRAINT unique_survey_match UNIQUE (match_key, survey_type);
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5. Indexes for the new lookup path
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_student_surveys_match_key ON public.student_surveys(match_key);
CREATE INDEX IF NOT EXISTS idx_teacher_surveys_match_key ON public.teacher_surveys(match_key);
CREATE INDEX IF NOT EXISTS idx_surveys_match_key         ON public.surveys(match_key);
CREATE INDEX IF NOT EXISTS idx_student_surveys_login     ON public.student_surveys(login_email);
CREATE INDEX IF NOT EXISTS idx_teacher_surveys_login     ON public.teacher_surveys(login_email);

-- ------------------------------------------------------------------------------
-- 6. Survey edit log — stores ONLY the fields that actually changed
--    Adds a compact `changes` map: { "<column>": { "old": ..., "new": ... } }
-- ------------------------------------------------------------------------------
ALTER TABLE public.survey_audit_logs
    ADD COLUMN IF NOT EXISTS changes JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.log_survey_edit()
RETURNS trigger AS $$
DECLARE
    v_email     TEXT;
    v_changed   TEXT[] := '{}';
    v_changes   JSONB  := '{}'::jsonb;
    v_source    TEXT;
    v_performer TEXT;
    v_old       JSONB;
    v_new       JSONB;
BEGIN
    v_source    := COALESCE(NULLIF(current_setting('app.audit_source', true), ''), 'google_sheets');
    v_performer := NULLIF(current_setting('app.audit_performer', true), '');

    IF TG_TABLE_NAME = 'student_surveys' THEN
        v_email := LOWER(TRIM(COALESCE(NEW.student_email, OLD.student_email, 'unknown')));
    ELSE
        v_email := LOWER(TRIM(COALESCE(NEW.teacher_email, OLD.teacher_email, 'unknown')));
    END IF;

    IF v_performer IS NULL THEN
        v_performer := v_email;
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.survey_audit_logs (
            survey_id, user_id, user_email, survey_type, action, source,
            sheet_row_number, performed_by, new_data, changed_fields, changes
        ) VALUES (
            NEW.id, NEW.user_id, v_email, NEW.survey_type, 'INSERT', v_source,
            NEW.sheet_row_number, v_performer, to_jsonb(NEW), '{}', '{}'::jsonb
        );
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.survey_audit_logs (
            survey_id, user_id, user_email, survey_type, action, source,
            sheet_row_number, performed_by, old_data, changed_fields, changes
        ) VALUES (
            OLD.id, OLD.user_id, v_email, OLD.survey_type, 'DELETE', v_source,
            OLD.sheet_row_number, v_performer, to_jsonb(OLD), '{}', '{}'::jsonb
        );
        RETURN OLD;
    END IF;

    -- UPDATE: ignore system-managed columns so only real sheet edits are logged
    v_old := to_jsonb(OLD) - 'updated_at';
    v_new := to_jsonb(NEW) - 'updated_at';

    SELECT COALESCE(array_agg(d.key ORDER BY d.key), '{}')
    INTO v_changed
    FROM (
        SELECT n.key
        FROM jsonb_each(v_new) AS n
        WHERE n.value IS DISTINCT FROM (v_old -> n.key)
          AND n.key NOT IN ('id', 'submitted_at')
    ) AS d;

    -- Nothing meaningful changed -> do not write an audit row
    IF array_length(v_changed, 1) IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(jsonb_object_agg(
               d.key,
               jsonb_build_object('old', v_old -> d.key, 'new', v_new -> d.key)
           ), '{}'::jsonb)
    INTO v_changes
    FROM (
        SELECT n.key
        FROM jsonb_each(v_new) AS n
        WHERE n.value IS DISTINCT FROM (v_old -> n.key)
          AND n.key NOT IN ('id', 'submitted_at')
    ) AS d;

    INSERT INTO public.survey_audit_logs (
        survey_id, user_id, user_email, survey_type, action, source,
        sheet_row_number, performed_by, old_data, new_data, changed_fields, changes
    ) VALUES (
        NEW.id, NEW.user_id, v_email, NEW.survey_type, 'UPDATE', v_source,
        NEW.sheet_row_number, v_performer, to_jsonb(OLD), to_jsonb(NEW), v_changed, v_changes
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_student_survey_edit ON public.student_surveys;
CREATE TRIGGER trg_student_survey_edit
    AFTER INSERT OR UPDATE OR DELETE ON public.student_surveys
    FOR EACH ROW EXECUTE FUNCTION public.log_survey_edit();

DROP TRIGGER IF EXISTS trg_teacher_survey_edit ON public.teacher_surveys;
CREATE TRIGGER trg_teacher_survey_edit
    AFTER INSERT OR UPDATE OR DELETE ON public.teacher_surveys
    FOR EACH ROW EXECUTE FUNCTION public.log_survey_edit();

-- ------------------------------------------------------------------------------
-- 7. Quick sanity report (view output of this SELECT after running the migration)
-- ------------------------------------------------------------------------------
SELECT 'student_surveys' AS table_name, COUNT(*) AS rows, COUNT(match_key) AS with_match_key FROM public.student_surveys
UNION ALL
SELECT 'teacher_surveys', COUNT(*), COUNT(match_key) FROM public.teacher_surveys
UNION ALL
SELECT 'surveys (legacy)', COUNT(*), COUNT(match_key) FROM public.surveys;
