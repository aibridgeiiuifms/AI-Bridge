-- ==============================================================================
-- THE AI BRIDGE WEB APPLICATION | IIUI FMS
-- Migration 008: Department Mappings & Survey Email Normalization
-- Enables admin to map extracted email codes to standard department & faculty names
-- ==============================================================================

-- 1. Create Department & Faculty Mapping Table
CREATE TABLE IF NOT EXISTS public.department_mappings (
    code TEXT PRIMARY KEY,
    standard_dept_name TEXT NOT NULL,
    faculty_name TEXT NOT NULL,
    faculty_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Add extracted columns to surveys table
ALTER TABLE public.surveys 
    ADD COLUMN IF NOT EXISTS extracted_reg_no TEXT,
    ADD COLUMN IF NOT EXISTS extracted_dept_code TEXT REFERENCES public.department_mappings(code) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS extracted_semester TEXT;

-- Index for speedy joins and department filtering
CREATE INDEX IF NOT EXISTS idx_surveys_extracted_dept_code ON public.surveys(extracted_dept_code);
CREATE INDEX IF NOT EXISTS idx_surveys_extracted_reg_no ON public.surveys(extracted_reg_no);
CREATE INDEX IF NOT EXISTS idx_surveys_extracted_semester ON public.surveys(extracted_semester);

-- 3. Populate default mappings identified in survey dataset
INSERT INTO public.department_mappings (code, standard_dept_name, faculty_name, faculty_code)
VALUES
    ('BSBA',   'Bachelor of Business Administration',        'Faculty of Management Sciences',          'FMS'),
    ('BBA',    'Bachelor of Business Administration',        'Faculty of Management Sciences',          'FMS'),
    ('BSAF',   'Accounting & Finance',                       'Faculty of Management Sciences',          'FMS'),
    ('BSPM',   'Project Management',                         'Faculty of Management Sciences',          'FMS'),
    ('BSFTE',  'Fintech & E-Commerce',                       'Faculty of Management Sciences',          'FMS'),
    ('BSIR',   'International Relations',                    'Faculty of Social Sciences',              'FSS'),
    ('BSSOC',  'Sociology (BS)',                             'Faculty of Social Sciences',              'FSS'),
    ('MSSOC',  'Sociology (MS)',                             'Faculty of Social Sciences',              'FSS'),
    ('BSPKS',  'Pakistan Studies',                           'Faculty of Social Sciences',              'FSS'),
    ('BSPK',   'Pakistan Studies',                           'Faculty of Social Sciences',              'FSS'),
    ('PKS',    'Pakistan Studies',                           'Faculty of Social Sciences',              'FSS'),
    ('BSHIS',  'History',                                    'Faculty of Social Sciences',              'FSS'),
    ('BSBT',   'Biotechnology',                              'Faculty of Basic & Applied Sciences',     'FBAS'),
    ('BSES',   'Environmental Science',                      'Faculty of Basic & Applied Sciences',     'FBAS'),
    ('BSESCC', 'Environmental Science & Climate Change',     'Faculty of Basic & Applied Sciences',     'FBAS'),
    ('BSCS',   'Computer Science',                           'Faculty of Computing & IT',               'FCIT'),
    ('BSSE',   'Software Engineering',                       'Faculty of Computing & IT',               'FCIT'),
    ('ELT',    'English Language Teaching',                  'Faculty of Languages & Literature',       'FLL'),
    ('BSENG',  'English Literature',                         'Faculty of Languages & Literature',       'FLL'),
    ('LLB',    'Law',                                        'Faculty of Shariah & Law',                'FSL')
ON CONFLICT (code) DO NOTHING;

-- 4. Enable Row Level Security
ALTER TABLE public.department_mappings ENABLE ROW LEVEL SECURITY;

-- Everyone can read department mappings
DROP POLICY IF EXISTS "Public and authenticated users can view department mappings" ON public.department_mappings;
CREATE POLICY "Public and authenticated users can view department mappings"
ON public.department_mappings FOR SELECT
USING (true);

-- Admins and members can insert or update department mappings
DROP POLICY IF EXISTS "Admins can manage department mappings" ON public.department_mappings;
CREATE POLICY "Admins can manage department mappings"
ON public.department_mappings FOR ALL
USING (
    public.get_user_role() IN ('admin', 'member')
);

-- Service role bypass for webhooks
DROP POLICY IF EXISTS "Service role has full access to department mappings" ON public.department_mappings;
CREATE POLICY "Service role has full access to department mappings"
ON public.department_mappings FOR ALL
WITH CHECK (true);

-- 5. Helper Function for Admin Dashboard Analytics (Code + Real-time Student Count)
CREATE OR REPLACE FUNCTION public.get_department_mapping_stats()
RETURNS TABLE (
    code TEXT,
    standard_dept_name TEXT,
    faculty_name TEXT,
    faculty_code TEXT,
    student_count BIGINT,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dm.code,
        dm.standard_dept_name,
        dm.faculty_name,
        dm.faculty_code,
        COUNT(s.id) AS student_count,
        dm.updated_at
    FROM public.department_mappings dm
    LEFT JOIN public.surveys s ON s.extracted_dept_code = dm.code
    GROUP BY dm.code, dm.standard_dept_name, dm.faculty_name, dm.faculty_code, dm.updated_at
    ORDER BY COUNT(s.id) DESC, dm.code ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
