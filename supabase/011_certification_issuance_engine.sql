-- ==============================================================================
-- 011_certification_issuance_engine.sql
-- The AI Bridge — Complete Automated Certification Engine (On-The-Spot Stamping)
-- ==============================================================================

-- 1. Create a dedicated sequence for sequential certificate IDs (Format: AIB-2026-XXXX)
CREATE SEQUENCE IF NOT EXISTS public.certificate_id_seq START 1;

-- 2. Ensure certificates table structure supports on-the-spot generation
-- (Make obsolete storage/static columns nullable so older databases don't throw NOT NULL errors)
DO $$
BEGIN
    -- Create table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        certificate_id TEXT NOT NULL UNIQUE,
        verification_code TEXT NOT NULL UNIQUE,
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        recipient_name TEXT NOT NULL,
        student_id TEXT,
        department TEXT,
        completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
        is_valid BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
        CONSTRAINT unique_user_certificate UNIQUE (user_id)
    );

    -- Ensure columns exist
    ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS student_id TEXT;
    ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS department TEXT;
    ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS completion_date DATE DEFAULT CURRENT_DATE;
    ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT true;
    ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

    -- Make legacy fields nullable if they exist from 001_schema.sql
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'recipient_role') THEN
        ALTER TABLE public.certificates ALTER COLUMN recipient_role DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'course_name') THEN
        ALTER TABLE public.certificates ALTER COLUMN course_name DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'issued_by') THEN
        ALTER TABLE public.certificates ALTER COLUMN issued_by DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'pdf_url') THEN
        ALTER TABLE public.certificates ALTER COLUMN pdf_url DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'qr_code_url') THEN
        ALTER TABLE public.certificates ALTER COLUMN qr_code_url DROP NOT NULL;
    END IF;
END $$;

-- 3. Name Sanitizer: Strips digits onward strictly for student emails
CREATE OR REPLACE FUNCTION public.sanitize_iiui_name(raw_name TEXT, user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    cleaned TEXT;
BEGIN
    IF raw_name IS NULL OR TRIM(raw_name) = '' THEN
        RETURN 'Participant';
    END IF;

    -- Only apply digit-stripping rule if the email belongs to @student.iiu.edu.pk
    IF user_email IS NOT NULL AND LOWER(user_email) LIKE '%@student.iiu.edu.pk' THEN
        cleaned := TRIM(regexp_replace(raw_name, '\s*\d+.*$', '', 'g'));
        IF cleaned = '' THEN cleaned := TRIM(raw_name); END IF;
        RETURN initcap(cleaned);
    ELSE
        RETURN TRIM(raw_name);
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. One-Time Cleanup for Existing Accounts in Profiles Table
UPDATE public.profiles
SET 
    student_id = COALESCE(student_id, substring(full_name from '\d+.*$')),
    full_name = public.sanitize_iiui_name(full_name, email)
WHERE email LIKE '%@student.iiu.edu.pk' AND full_name ~ '\d';

-- 5. Updated handle_new_user Trigger to automatically sanitize Google account names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_role TEXT := 'student';
    v_whitelist RECORD;
    v_clean_name TEXT;
    v_extracted_id TEXT := NULL;
    v_raw_name TEXT;
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

    -- 2. Resolve clean name and extract roll number if student format
    v_raw_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
    v_clean_name := public.sanitize_iiui_name(v_raw_name, new.email);
    
    IF new.email LIKE '%@student.iiu.edu.pk' AND v_raw_name ~ '\d' THEN
        v_extracted_id := substring(v_raw_name from '\d+.*$');
    END IF;

    -- 3. Insert into profiles with sanitized name and extracted student_id
    INSERT INTO public.profiles (id, email, full_name, student_id, role, avatar_url, assigned_tasks)
    VALUES (
        new.id,
        new.email,
        v_clean_name,
        v_extracted_id,
        v_role,
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
        COALESCE(v_whitelist.assigned_tasks, '{}')
    )
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        full_name = CASE 
            WHEN profiles.full_name ~ '\d' AND new.email LIKE '%@student.iiu.edu.pk' THEN EXCLUDED.full_name 
            ELSE profiles.full_name 
        END,
        student_id = COALESCE(profiles.student_id, EXCLUDED.student_id),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        assigned_tasks = COALESCE(EXCLUDED.assigned_tasks, profiles.assigned_tasks),
        updated_at = timezone('utc'::text, now());

    -- 4. If member, initialize member permissions
    IF v_role = 'member' THEN
        INSERT INTO public.member_permissions (
            member_id,
            can_manage_events,
            can_view_surveys,
            can_verify_attendance,
            can_manage_mcqs,
            can_export_reports,
            can_manage_team
        ) VALUES (
            new.id,
            false,
            true,
            false,
            false,
            true,
            COALESCE(v_whitelist.can_manage_team, false)
        )
        ON CONFLICT (member_id) DO UPDATE SET
            can_manage_team = COALESCE(v_whitelist.can_manage_team, member_permissions.can_manage_team);
    END IF;

    -- 5. Link any pre-submitted surveys
    UPDATE public.student_surveys 
    SET user_id = new.id 
    WHERE user_id IS NULL AND LOWER(student_email) = LOWER(new.email);

    UPDATE public.teacher_surveys 
    SET user_id = new.id 
    WHERE user_id IS NULL AND LOWER(teacher_email) = LOWER(new.email);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Stored Procedure: Validate 3 Gates and Issue Certificate Metadata
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
    v_pre_id UUID;
    v_post_id UUID;
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

    -- Opportunistically link any unlinked surveys by email for resilience
    UPDATE public.student_surveys 
    SET user_id = p_user_id 
    WHERE user_id IS NULL AND LOWER(student_email) = LOWER(v_profile.email);

    UPDATE public.teacher_surveys 
    SET user_id = p_user_id 
    WHERE user_id IS NULL AND LOWER(teacher_email) = LOWER(v_profile.email);

    -- Validate Gate 1: Pre-Survey
    SELECT EXISTS (
        SELECT 1 FROM public.student_surveys 
        WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email)) 
          AND survey_type = 'pre'
        UNION ALL
        SELECT 1 FROM public.teacher_surveys 
        WHERE (user_id = p_user_id OR LOWER(teacher_email) = LOWER(v_profile.email)) 
          AND survey_type = 'pre'
    ) INTO v_has_pre;

    -- Validate Gate 2: Passed Quiz (at least one passing attempt)
    SELECT EXISTS (
        SELECT 1 FROM public.quiz_attempts 
        WHERE user_id = p_user_id AND passed = true
    ) INTO v_has_quiz;

    -- Validate Gate 3: Post-Survey
    SELECT EXISTS (
        SELECT 1 FROM public.student_surveys 
        WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email)) 
          AND survey_type = 'post'
        UNION ALL
        SELECT 1 FROM public.teacher_surveys 
        WHERE (user_id = p_user_id OR LOWER(teacher_email) = LOWER(v_profile.email)) 
          AND survey_type = 'post'
    ) INTO v_has_post;

    -- Gate check guard
    IF NOT (v_has_pre AND v_has_quiz AND v_has_post) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Prerequisites incomplete',
            'gates', jsonb_build_object('pre', v_has_pre, 'quiz', v_has_quiz, 'post', v_has_post)
        );
    END IF;

    -- Generate Next Serial ID: AIB-2026-XXXX
    v_cert_id := 'AIB-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('public.certificate_id_seq')::text, 4, '0');
    v_clean_name := public.sanitize_iiui_name(v_profile.full_name, v_profile.email);

    -- Resolve Student ID (Roll No) with fallbacks
    v_student_id := COALESCE(
        v_profile.student_id,
        (SELECT registration_no FROM public.student_surveys WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email)) AND registration_no IS NOT NULL LIMIT 1),
        (SELECT substring(v_profile.full_name from '\d+.*$'))
    );

    -- Resolve Department with fallbacks
    v_dept := COALESCE(
        v_profile.department,
        (SELECT department_name FROM public.student_surveys WHERE (user_id = p_user_id OR LOWER(student_email) = LOWER(v_profile.email)) AND department_name IS NOT NULL LIMIT 1),
        (SELECT faculty_department FROM public.teacher_surveys WHERE (user_id = p_user_id OR LOWER(teacher_email) = LOWER(v_profile.email)) AND faculty_department IS NOT NULL LIMIT 1),
        'Faculty of Management Sciences (FMS)'
    );

    -- Insert official certificate record (Metadata only - zero file storage)
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

-- 7. Ensure RLS Policies on public.certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public verification can read certificate" ON public.certificates;
CREATE POLICY "Public verification can read certificate"
ON public.certificates FOR SELECT
USING (true); -- Public verification requires read access

DROP POLICY IF EXISTS "Users can view own certificate" ON public.certificates;
CREATE POLICY "Users can view own certificate"
ON public.certificates FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
CREATE POLICY "Admins can manage certificates"
ON public.certificates FOR ALL
USING (public.get_user_role() = 'admin');

-- Grant execute on issuance procedure
GRANT EXECUTE ON FUNCTION public.issue_certificate_for_user(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sanitize_iiui_name(TEXT, TEXT) TO authenticated, anon, service_role;
