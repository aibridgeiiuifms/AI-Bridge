-- ==============================================================================
-- THE AI BRIDGE | IIUI FMS
-- Migration 009: 2-Table Architecture (Student Surveys & Teacher Surveys)
-- Replaces single-table crowding with 2 dedicated, clean audience tables.
-- Stores full_name in a dedicated column and preserves raw hours_saved_category.
-- ==============================================================================

-- 1. Student Surveys Table (Pre & Post)
CREATE TABLE IF NOT EXISTS public.student_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    student_email TEXT NOT NULL,
    full_name TEXT,                             -- Dedicated student name column
    survey_type TEXT NOT NULL CHECK (survey_type IN ('pre', 'post')),
    reg_no TEXT,                                -- Extracted roll number (e.g. 025580, 126)
    dept_code TEXT REFERENCES public.department_mappings(code) ON UPDATE CASCADE ON DELETE SET NULL,
    semester TEXT,                              -- Extracted semester (e.g. F26, S25, F24)
    hours_saved_category TEXT,                  -- Raw clean choice: '3 - 5 hours', '1 - 2 hours', '0 hours', '5+ hours'
    ai_familiarity_rating INT CHECK (ai_familiarity_rating BETWEEN 1 AND 5),
    feedback_notes TEXT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    sheet_row_number INT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_student_survey UNIQUE (student_email, survey_type)
);

-- 2. Teacher Surveys Table (Pre & Post)
CREATE TABLE IF NOT EXISTS public.teacher_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    teacher_email TEXT NOT NULL,
    full_name TEXT,                             -- Dedicated teacher name column
    survey_type TEXT NOT NULL CHECK (survey_type IN ('pre', 'post')),
    designation TEXT,                           -- Lecturer, Assistant Professor, Associate Professor, Professor
    dept_code TEXT REFERENCES public.department_mappings(code) ON UPDATE CASCADE ON DELETE SET NULL,
    department_name TEXT,                       -- Manual department text if any
    teaching_experience TEXT,                   -- '1-3 years', '3-5 years', '5+ years'
    hours_saved_category TEXT,                  -- Raw clean choice: '3 - 5 hours', etc.
    ai_familiarity_rating INT CHECK (ai_familiarity_rating BETWEEN 1 AND 5),
    feedback_notes TEXT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    sheet_row_number INT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_teacher_survey UNIQUE (teacher_email, survey_type)
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_student_surveys_email ON public.student_surveys(student_email);
CREATE INDEX IF NOT EXISTS idx_student_surveys_name ON public.student_surveys(full_name);
CREATE INDEX IF NOT EXISTS idx_student_surveys_dept ON public.student_surveys(dept_code);
CREATE INDEX IF NOT EXISTS idx_student_surveys_reg ON public.student_surveys(reg_no);
CREATE INDEX IF NOT EXISTS idx_student_surveys_type ON public.student_surveys(survey_type);

CREATE INDEX IF NOT EXISTS idx_teacher_surveys_email ON public.teacher_surveys(teacher_email);
CREATE INDEX IF NOT EXISTS idx_teacher_surveys_name ON public.teacher_surveys(full_name);
CREATE INDEX IF NOT EXISTS idx_teacher_surveys_dept ON public.teacher_surveys(dept_code);
CREATE INDEX IF NOT EXISTS idx_teacher_surveys_type ON public.teacher_surveys(survey_type);

-- 4. Row Level Security Policies
ALTER TABLE public.student_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_surveys ENABLE ROW LEVEL SECURITY;

-- Student Surveys RLS
DROP POLICY IF EXISTS "Public read student surveys" ON public.student_surveys;
CREATE POLICY "Public read student surveys"
ON public.student_surveys FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins manage student surveys" ON public.student_surveys;
CREATE POLICY "Admins manage student surveys"
ON public.student_surveys FOR ALL
USING (public.get_user_role() IN ('admin', 'member'));

DROP POLICY IF EXISTS "Service role full access student surveys" ON public.student_surveys;
CREATE POLICY "Service role full access student surveys"
ON public.student_surveys FOR ALL
WITH CHECK (true);

-- Teacher Surveys RLS
DROP POLICY IF EXISTS "Public read teacher surveys" ON public.teacher_surveys;
CREATE POLICY "Public read teacher surveys"
ON public.teacher_surveys FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins manage teacher surveys" ON public.teacher_surveys;
CREATE POLICY "Admins manage teacher surveys"
ON public.teacher_surveys FOR ALL
USING (public.get_user_role() IN ('admin', 'member'));

DROP POLICY IF EXISTS "Service role full access teacher surveys" ON public.teacher_surveys;
CREATE POLICY "Service role full access teacher surveys"
ON public.teacher_surveys FOR ALL
WITH CHECK (true);

-- 5. Auto-migration: Safely copy existing records from public.surveys if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'surveys' AND table_type = 'BASE TABLE') THEN
        INSERT INTO public.student_surveys (
            id, user_id, student_email, full_name, survey_type, reg_no, dept_code, semester,
            hours_saved_category, ai_familiarity_rating, feedback_notes, answers, sheet_row_number, submitted_at, updated_at
        )
        SELECT 
            s.id,
            s.user_id,
            s.respondent_email,
            COALESCE(s.answers->>'Student Name', s.answers->>'Name', s.answers->>'Full Name', split_part(s.respondent_email, '@', 1)),
            s.survey_type,
            s.extracted_reg_no,
            s.extracted_dept_code,
            s.extracted_semester,
            COALESCE(
                s.answers->>'How many hours per week do you estimate AI tools currently save you in your academic research/study?',
                s.answers->>'How many hours per week do you estimate AI tools save you in your teaching/research?',
                s.hours_saved_estimate::text
            ),
            s.comprehension_self_rating,
            s.feedback_notes,
            s.answers,
            s.sheet_row_number,
            s.submitted_at,
            s.updated_at
        FROM public.surveys s
        ON CONFLICT (student_email, survey_type) DO NOTHING;
    END IF;
END $$;
