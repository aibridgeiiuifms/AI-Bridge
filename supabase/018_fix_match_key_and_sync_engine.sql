-- ==============================================================================
-- THE AI BRIDGE | IIUI FMS
-- Migration 018: Fix Match Key Column & Sync Engine Integration
-- ==============================================================================
-- WHAT WAS THE PROBLEM:
--   When syncing from Google Sheets, the Vercel webhook tried to insert data
--   using a column named 'match_key'. Because 'match_key' did not exist in the
--   database, Supabase threw error PGRST204:
--   "Could not find the 'match_key' column of 'student_surveys' in the schema cache"
--   As a result, no rows were saved, and Step 2 remained locked.
--
-- HOW THIS SCRIPT SOLVES IT:
--   1. Adds 'match_key' and 'login_email' columns to student_surveys and teacher_surveys.
--   2. Fills match_key for existing rows using Google Form timestamps or emails.
--   3. Sets the unique constraint to (match_key, survey_type) so edits update instead of duplicate.
--   4. Decouples issue_certificate_for_user from legacy public.surveys and adds JSONB email check.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Add missing columns to student_surveys and teacher_surveys
-- ------------------------------------------------------------------------------
ALTER TABLE public.student_surveys
    ADD COLUMN IF NOT EXISTS login_email TEXT,
    ADD COLUMN IF NOT EXISTS match_key TEXT;

ALTER TABLE public.teacher_surveys
    ADD COLUMN IF NOT EXISTS login_email TEXT,
    ADD COLUMN IF NOT EXISTS match_key TEXT;

-- ------------------------------------------------------------------------------
-- 2. Populate match_key for all existing rows
-- ------------------------------------------------------------------------------
UPDATE public.student_surveys
SET match_key = COALESCE(
    'ts:' || LOWER(REGEXP_REPLACE(answers ->> 'Timestamp', '\s+', '', 'g')),
    'em:' || LOWER(REGEXP_REPLACE(student_email, '\s+', '', 'g')),
    'row:' || id::text
)
WHERE match_key IS NULL;

UPDATE public.teacher_surveys
SET match_key = COALESCE(
    'ts:' || LOWER(REGEXP_REPLACE(answers ->> 'Timestamp', '\s+', '', 'g')),
    'em:' || LOWER(REGEXP_REPLACE(teacher_email, '\s+', '', 'g')),
    'row:' || id::text
)
WHERE match_key IS NULL;

-- ------------------------------------------------------------------------------
-- 3. Disambiguate duplicate match_keys before applying unique constraint
-- ------------------------------------------------------------------------------
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

-- Set NOT NULL now that all rows have keys
ALTER TABLE public.student_surveys ALTER COLUMN match_key SET NOT NULL;
ALTER TABLE public.teacher_surveys ALTER COLUMN match_key SET NOT NULL;

-- ------------------------------------------------------------------------------
-- 4. Swap unique constraints: (email, survey_type) -> (match_key, survey_type)
-- ------------------------------------------------------------------------------
ALTER TABLE public.student_surveys DROP CONSTRAINT IF EXISTS unique_student_survey;
ALTER TABLE public.student_surveys DROP CONSTRAINT IF EXISTS unique_student_survey_match;
ALTER TABLE public.student_surveys ADD CONSTRAINT unique_student_survey_match UNIQUE (match_key, survey_type);

ALTER TABLE public.teacher_surveys DROP CONSTRAINT IF EXISTS unique_teacher_survey;
ALTER TABLE public.teacher_surveys DROP CONSTRAINT IF EXISTS unique_teacher_survey_match;
ALTER TABLE public.teacher_surveys ADD CONSTRAINT unique_teacher_survey_match UNIQUE (match_key, survey_type);

-- ------------------------------------------------------------------------------
-- 5. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_student_surveys_match_key ON public.student_surveys(match_key);
CREATE INDEX IF NOT EXISTS idx_teacher_surveys_match_key ON public.teacher_surveys(match_key);
CREATE INDEX IF NOT EXISTS idx_student_surveys_user_id ON public.student_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_student_surveys_email ON public.student_surveys(student_email);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON public.certificates(certificate_id);

-- ------------------------------------------------------------------------------
-- 6. Update Certificate Issuance Engine (Cleaned of legacy surveys table)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.issue_certificate_for_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile RECORD;
    v_has_pre BOOLEAN := false;
    v_has_quiz BOOLEAN := false;
    v_has_post BOOLEAN := false;
    v_existing RECORD;
    v_cert_id TEXT;
    v_clean_name TEXT;
    v_student_id TEXT;
    v_dept TEXT;
BEGIN
    -- Check if already issued
    SELECT * INTO v_existing FROM public.certificates WHERE user_id = p_user_id;
    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'status', 'already_issued', 'certificate', row_to_json(v_existing));
    END IF;

    -- Fetch user profile
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;

    -- Opportunistically link unlinked surveys by email
    UPDATE public.student_surveys 
    SET user_id = p_user_id 
    WHERE user_id IS NULL AND LOWER(student_email) = LOWER(v_profile.email);

    UPDATE public.teacher_surveys 
    SET user_id = p_user_id 
    WHERE user_id IS NULL AND LOWER(teacher_email) = LOWER(v_profile.email);

    -- Gate 1: Pre-Survey (Checks student_surveys, teacher_surveys, and answers JSONB)
    SELECT EXISTS (
        SELECT 1 FROM public.student_surveys 
        WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email) OR (answers->>'Student Email Address') ILIKE v_profile.email) 
          AND survey_type = 'pre'
        UNION ALL
        SELECT 1 FROM public.teacher_surveys 
        WHERE (user_id = p_user_id OR LOWER(teacher_email) = LOWER(v_profile.email)) 
          AND survey_type = 'pre'
    ) INTO v_has_pre;

    -- Gate 2: Passed Quiz
    SELECT EXISTS (
        SELECT 1 FROM public.quiz_attempts 
        WHERE user_id = p_user_id AND passed = true
    ) INTO v_has_quiz;

    -- Gate 3: Post-Survey (Checks student_surveys, teacher_surveys, and answers JSONB)
    SELECT EXISTS (
        SELECT 1 FROM public.student_surveys 
        WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email) OR (answers->>'Student Email Address') ILIKE v_profile.email) 
          AND survey_type = 'post'
        UNION ALL
        SELECT 1 FROM public.teacher_surveys 
        WHERE (user_id = p_user_id OR LOWER(teacher_email) = LOWER(v_profile.email)) 
          AND survey_type = 'post'
    ) INTO v_has_post;

    -- Prerequisites guard
    IF NOT (v_has_pre AND v_has_quiz AND v_has_post) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Prerequisites incomplete',
            'gates', jsonb_build_object('pre', v_has_pre, 'quiz', v_has_quiz, 'post', v_has_post)
        );
    END IF;

    -- Generate Unique Short Certificate ID: AIB-XXXXXXXX
    v_cert_id := public.generate_short_certificate_id();
    v_clean_name := public.sanitize_iiui_name(v_profile.full_name, v_profile.email);

    -- Resolve Roll Number
    v_student_id := COALESCE(
        NULLIF(TRIM(v_profile.student_id), ''),
        (SELECT reg_no FROM public.student_surveys WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email)) AND reg_no IS NOT NULL LIMIT 1),
        substring(v_profile.full_name from '\d+.*$')
    );

    -- Resolve Department
    v_dept := COALESCE(
        NULLIF(TRIM(v_profile.department), ''),
        (SELECT m.standard_dept_name 
         FROM public.student_surveys s 
         JOIN public.department_mappings m ON m.code = s.dept_code 
         WHERE (s.user_id = p_user_id OR LOWER(s.student_email) = LOWER(v_profile.email)) AND s.dept_code IS NOT NULL LIMIT 1),
        (SELECT s.dept_code 
         FROM public.student_surveys s 
         WHERE (s.user_id = p_user_id OR LOWER(s.student_email) = LOWER(v_profile.email)) AND s.dept_code IS NOT NULL LIMIT 1),
        (SELECT department_name FROM public.teacher_surveys WHERE (user_id = p_user_id OR LOWER(teacher_email) = LOWER(v_profile.email)) AND department_name IS NOT NULL LIMIT 1),
        'Faculty of Management Sciences (FMS)'
    );

    -- Insert official certificate record
    INSERT INTO public.certificates (
        certificate_id,
        verification_code,
        user_id,
        recipient_name,
        student_id,
        department,
        completion_date,
        is_valid
    ) VALUES (
        v_cert_id,
        gen_random_uuid()::text,
        p_user_id,
        v_clean_name,
        v_student_id,
        v_dept,
        CURRENT_DATE,
        true
    ) RETURNING * INTO v_existing;

    RETURN jsonb_build_object('success', true, 'status', 'issued', 'certificate', row_to_json(v_existing));
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.issue_certificate_for_user(UUID) TO authenticated, anon, service_role;
