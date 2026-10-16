-- ==============================================================================
-- THE AI BRIDGE | IIUI FMS
-- Migration 011: Data Pipeline Resilience & Automated Survey Linking
-- Adds:
-- 1. Student & Teacher RLS self-linking update policies.
-- 2. Database trigger on profiles to automatically bond orphan surveys to user_id.
-- ==============================================================================

-- 1. Auto-linking RLS Policies (Allows students & teachers to link pre-registered surveys)
DROP POLICY IF EXISTS "Students can link their own surveys" ON public.student_surveys;
CREATE POLICY "Students can link their own surveys"
ON public.student_surveys FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() 
    OR (user_id IS NULL AND LOWER(REGEXP_REPLACE(student_email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(auth.jwt()->>'email', '\s+', '', 'g')))
)
WITH CHECK (
    user_id = auth.uid()
);

DROP POLICY IF EXISTS "Teachers can link their own surveys" ON public.teacher_surveys;
CREATE POLICY "Teachers can link their own surveys"
ON public.teacher_surveys FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() 
    OR (user_id IS NULL AND LOWER(REGEXP_REPLACE(teacher_email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(auth.jwt()->>'email', '\s+', '', 'g')))
)
WITH CHECK (
    user_id = auth.uid()
);

-- 2. Profile Hook Trigger: Auto-bond surveys to user_id on signup/profile creation
CREATE OR REPLACE FUNCTION public.handle_link_surveys_to_profile()
RETURNS trigger AS $$
BEGIN
    IF NEW.email IS NOT NULL THEN
        -- Link student surveys
        UPDATE public.student_surveys
        SET user_id = NEW.id
        WHERE user_id IS NULL
          AND LOWER(REGEXP_REPLACE(student_email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(NEW.email, '\s+', '', 'g'));

        -- Link teacher surveys
        UPDATE public.teacher_surveys
        SET user_id = NEW.id
        WHERE user_id IS NULL
          AND LOWER(REGEXP_REPLACE(teacher_email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(NEW.email, '\s+', '', 'g'));

        -- Link legacy surveys if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'surveys') THEN
            UPDATE public.surveys
            SET user_id = NEW.id
            WHERE user_id IS NULL
              AND LOWER(REGEXP_REPLACE(respondent_email, '\s+', '', 'g')) = LOWER(REGEXP_REPLACE(NEW.email, '\s+', '', 'g'));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_link_surveys_on_profile ON public.profiles;
CREATE TRIGGER trg_link_surveys_on_profile
    AFTER INSERT OR UPDATE OF email ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_link_surveys_to_profile();
