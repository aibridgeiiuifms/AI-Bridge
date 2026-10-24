-- ==============================================================================
-- THE AI BRIDGE | IIUI FMS
-- Migration 019: Fix Multi-Submission & Dual Email Linking Engine
-- ==============================================================================
-- 1. Updates issue_certificate_for_user to support login_email matching
-- 2. Bulk links any legacy unlinked student/teacher surveys to profiles
-- 3. Syncs user roles from guest -> student for all matched submissions
-- ==============================================================================

-- 1. Opportunistically link all existing surveys by student_email OR login_email OR answers JSONB
UPDATE public.student_surveys s
SET user_id = p.id
FROM public.profiles p
WHERE s.user_id IS NULL
  AND (
      LOWER(s.student_email) = LOWER(p.email)
      OR LOWER(s.login_email) = LOWER(p.email)
      OR LOWER(s.answers ->> 'Student Email Address') = LOWER(p.email)
  );

UPDATE public.teacher_surveys t
SET user_id = p.id
FROM public.profiles p
WHERE t.user_id IS NULL
  AND (
      LOWER(t.teacher_email) = LOWER(p.email)
      OR LOWER(t.login_email) = LOWER(p.email)
      OR LOWER(t.answers ->> 'Institutional Email Address') = LOWER(p.email)
  );

-- 2. Upgrade sync_user_role to recognize login_email as well
CREATE OR REPLACE FUNCTION public.sync_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_email TEXT;
    v_current_role TEXT;
    v_has_survey BOOLEAN := false;
    v_has_teacher_survey BOOLEAN := false;
BEGIN
    SELECT email, role INTO v_email, v_current_role
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN 'user_not_found';
    END IF;

    -- Preserve admin and team-member roles
    IF v_current_role IN ('admin', 'team-member') THEN
        RETURN v_current_role;
    END IF;

    -- Check if user has completed a student survey (by user_id, student_email, login_email, or answers)
    SELECT EXISTS (
        SELECT 1 FROM public.student_surveys
        WHERE user_id = p_user_id
           OR LOWER(student_email) = LOWER(v_email)
           OR LOWER(login_email) = LOWER(v_email)
           OR LOWER(answers ->> 'Student Email Address') = LOWER(v_email)
    ) INTO v_has_survey;

    IF v_has_survey THEN
        UPDATE public.profiles
        SET role = 'student'
        WHERE id = p_user_id AND role NOT IN ('admin', 'team-member');
        RETURN 'student';
    END IF;

    -- Check teacher survey
    SELECT EXISTS (
        SELECT 1 FROM public.teacher_surveys
        WHERE user_id = p_user_id
           OR LOWER(teacher_email) = LOWER(v_email)
           OR LOWER(login_email) = LOWER(v_email)
    ) INTO v_has_teacher_survey;

    IF v_has_teacher_survey THEN
        UPDATE public.profiles
        SET role = 'teacher'
        WHERE id = p_user_id AND role NOT IN ('admin', 'team-member');
        RETURN 'teacher';
    END IF;

    RETURN v_current_role;
END;
$$;

-- 3. Update issue_certificate_for_user with login_email support
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

    -- Opportunistically link unlinked surveys by student_email or login_email
    UPDATE public.student_surveys 
    SET user_id = p_user_id 
    WHERE user_id IS NULL AND (LOWER(student_email) = LOWER(v_profile.email) OR LOWER(login_email) = LOWER(v_profile.email));

    UPDATE public.teacher_surveys 
    SET user_id = p_user_id 
    WHERE user_id IS NULL AND (LOWER(teacher_email) = LOWER(v_profile.email) OR LOWER(login_email) = LOWER(v_profile.email));

    -- Gate 1: Pre-Survey
    SELECT EXISTS (
        SELECT 1 FROM public.student_surveys 
        WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email) OR LOWER(login_email) = LOWER(v_profile.email) OR (answers->>'Student Email Address') ILIKE v_profile.email) 
          AND survey_type = 'pre'
        UNION ALL
        SELECT 1 FROM public.teacher_surveys 
        WHERE (user_id = p_user_id OR LOWER(teacher_email) = LOWER(v_profile.email) OR LOWER(login_email) = LOWER(v_profile.email)) 
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
        WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email) OR LOWER(login_email) = LOWER(v_profile.email) OR (answers->>'Student Email Address') ILIKE v_profile.email) 
          AND survey_type = 'post'
        UNION ALL
        SELECT 1 FROM public.teacher_surveys 
        WHERE (user_id = p_user_id OR LOWER(teacher_email) = LOWER(v_profile.email) OR LOWER(login_email) = LOWER(v_profile.email)) 
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
        (SELECT reg_no FROM public.student_surveys WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email) OR LOWER(login_email) = LOWER(v_profile.email)) AND reg_no IS NOT NULL LIMIT 1),
        substring(v_profile.full_name from '\d+.*$')
    );

    -- Resolve Department Code
    v_dept := COALESCE(
        NULLIF(TRIM(v_profile.department), ''),
        (SELECT dept_code FROM public.student_surveys WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email) OR LOWER(login_email) = LOWER(v_profile.email)) AND dept_code IS NOT NULL LIMIT 1),
        (SELECT dept_code FROM public.teacher_surveys WHERE (user_id = p_user_id OR LOWER(teacher_email) = LOWER(v_profile.email) OR LOWER(login_email) = LOWER(v_profile.email)) AND dept_code IS NOT NULL LIMIT 1)
    );

    -- Insert newly minted certificate
    INSERT INTO public.certificates (
        user_id,
        certificate_id,
        student_name,
        student_id,
        department,
        issued_at
    ) VALUES (
        p_user_id,
        v_cert_id,
        v_clean_name,
        v_student_id,
        v_dept,
        timezone('utc'::text, now())
    )
    RETURNING * INTO v_existing;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'newly_issued',
        'certificate', row_to_json(v_existing)
    );
END;
$$;
