-- ==============================================================================
-- 013_certificate_issuance_toggle.sql
-- The AI Bridge — Certificate Issuance Window Toggle (Admin Master Switch)
-- ==============================================================================
-- BEHAVIOUR:
--   • When issuance_enabled = false:
--       - NEW certificates CANNOT be issued (3-step process is locked).
--       - EXISTING issued certificates can still be downloaded, QR-scanned, and verified.
--   • When issuance_enabled = true (default):
--       - Everything works normally.
-- SECURITY:
--   • Only admin (get_user_role() = 'admin') can UPDATE this row.
--   • Everyone can SELECT (read) the toggle state (needed by portal UI).
--   • The stored procedure issue_certificate_for_user() also checks this flag —
--     meaning even a direct API call bypassing the frontend will be blocked.
-- ==============================================================================

-- 1. Insert the master toggle into system_settings (safe upsert)
INSERT INTO public.system_settings (key, value, updated_at)
VALUES (
    'certificate_issuance',
    jsonb_build_object(
        'issuance_enabled',  true,
        'closed_message',    'The evaluation and certification window for this phase has now closed. Thank you for your participation. If you already have a certificate, you can still download it and share it on LinkedIn.',
        'updated_by',        'system',
        'updated_at',        now()::text
    ),
    now()
)
ON CONFLICT (key) DO NOTHING;

-- 2. Patch issue_certificate_for_user() to check the toggle at the very top
CREATE OR REPLACE FUNCTION public.issue_certificate_for_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile         RECORD;
    v_has_pre         BOOLEAN := false;
    v_has_quiz        BOOLEAN := false;
    v_has_post        BOOLEAN := false;
    v_existing        RECORD;
    v_cert_id         TEXT;
    v_clean_name      TEXT;
    v_student_id      TEXT;
    v_dept            TEXT;
    v_toggle          RECORD;
    v_issuance_enabled BOOLEAN := true;
    v_closed_message  TEXT := 'Certificate issuance is currently closed by the administration.';
BEGIN
    -- ──────────────────────────────────────────────────────────────────────────
    -- MASTER SWITCH: Check if new certificate issuance is allowed
    -- ──────────────────────────────────────────────────────────────────────────
    SELECT
        COALESCE((value->>'issuance_enabled')::boolean, true),
        COALESCE(value->>'closed_message', 'Certificate issuance is currently closed.')
    INTO v_issuance_enabled, v_closed_message
    FROM public.system_settings
    WHERE key = 'certificate_issuance';

    -- ──────────────────────────────────────────────────────────────────────────
    -- Check if user already has a certificate (issued BEFORE the toggle was set).
    -- Already-issued certificates are ALWAYS returned regardless of the toggle.
    -- ──────────────────────────────────────────────────────────────────────────
    SELECT * INTO v_existing FROM public.certificates WHERE user_id = p_user_id;
    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'already_issued',
            'certificate', row_to_json(v_existing)
        );
    END IF;

    -- ──────────────────────────────────────────────────────────────────────────
    -- If no existing cert and issuance is CLOSED → block immediately
    -- ──────────────────────────────────────────────────────────────────────────
    IF v_issuance_enabled = false THEN
        RETURN jsonb_build_object(
            'success', false,
            'status',  'issuance_closed',
            'error',   v_closed_message
        );
    END IF;

    -- ──────────────────────────────────────────────────────────────────────────
    -- Issuance is OPEN — proceed with normal gate checks
    -- ──────────────────────────────────────────────────────────────────────────

    -- Fetch user profile
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;

    -- Opportunistically link any unlinked surveys by email
    UPDATE public.student_surveys
    SET user_id = p_user_id
    WHERE user_id IS NULL AND LOWER(student_email) = LOWER(v_profile.email);

    UPDATE public.teacher_surveys
    SET user_id = p_user_id
    WHERE user_id IS NULL AND LOWER(teacher_email) = LOWER(v_profile.email);

    -- Gate 1: Pre-Survey
    SELECT EXISTS (
        SELECT 1 FROM public.student_surveys
        WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email))
          AND survey_type = 'pre'
        UNION ALL
        SELECT 1 FROM public.teacher_surveys
        WHERE (user_id = p_user_id OR LOWER(teacher_email) = LOWER(v_profile.email))
          AND survey_type = 'pre'
        UNION ALL
        SELECT 1 FROM public.surveys
        WHERE (user_id = p_user_id OR LOWER(respondent_email) = LOWER(v_profile.email))
          AND survey_type = 'pre'
    ) INTO v_has_pre;

    -- Gate 2: Passed Quiz
    SELECT EXISTS (
        SELECT 1 FROM public.quiz_attempts
        WHERE user_id = p_user_id AND passed = true
    ) INTO v_has_quiz;

    -- Gate 3: Post-Survey
    SELECT EXISTS (
        SELECT 1 FROM public.student_surveys
        WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email))
          AND survey_type = 'post'
        UNION ALL
        SELECT 1 FROM public.teacher_surveys
        WHERE (user_id = p_user_id OR LOWER(teacher_email) = LOWER(v_profile.email))
          AND survey_type = 'post'
        UNION ALL
        SELECT 1 FROM public.surveys
        WHERE (user_id = p_user_id OR LOWER(respondent_email) = LOWER(v_profile.email))
          AND survey_type = 'post'
    ) INTO v_has_post;

    -- Guard: All 3 gates must be complete
    IF NOT (v_has_pre AND v_has_quiz AND v_has_post) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error',   'Prerequisites incomplete',
            'gates',   jsonb_build_object('pre', v_has_pre, 'quiz', v_has_quiz, 'post', v_has_post)
        );
    END IF;

    -- Generate Short Non-Guessable ID: AIB-XXXXXXXX
    v_cert_id    := public.generate_short_certificate_id();
    v_clean_name := public.sanitize_iiui_name(v_profile.full_name, v_profile.email);

    -- Resolve Student ID (Roll No) with fallbacks
    v_student_id := COALESCE(
        NULLIF(TRIM(v_profile.student_id), ''),
        (SELECT reg_no FROM public.student_surveys
         WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email))
           AND reg_no IS NOT NULL LIMIT 1),
        substring(v_profile.full_name from '\d+.*$')
    );

    -- Resolve Department with fallbacks
    v_dept := COALESCE(
        NULLIF(TRIM(v_profile.department), ''),
        (SELECT m.standard_dept_name
         FROM public.student_surveys s
         JOIN public.department_mappings m ON m.code = s.dept_code
         WHERE (s.user_id = p_user_id OR LOWER(s.student_email) = LOWER(v_profile.email))
           AND s.dept_code IS NOT NULL LIMIT 1),
        (SELECT s.dept_code
         FROM public.student_surveys s
         WHERE (s.user_id = p_user_id OR LOWER(s.student_email) = LOWER(v_profile.email))
           AND s.dept_code IS NOT NULL LIMIT 1),
        (SELECT department_name FROM public.teacher_surveys
         WHERE (user_id = p_user_id OR LOWER(teacher_email) = LOWER(v_profile.email))
           AND department_name IS NOT NULL LIMIT 1),
        'Faculty of Management Sciences (FMS)'
    );

    -- Insert official certificate record (metadata only — zero file storage)
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

    RETURN jsonb_build_object(
        'success', true,
        'status', 'issued',
        'certificate', row_to_json(v_existing)
    );
END;
$$;

-- Re-grant execute (SECURITY DEFINER already set, but re-confirm after replace)
GRANT EXECUTE ON FUNCTION public.issue_certificate_for_user(UUID) TO authenticated, service_role;
