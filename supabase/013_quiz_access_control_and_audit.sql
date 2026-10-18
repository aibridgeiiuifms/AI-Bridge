-- ==============================================================================
-- 013_quiz_access_control_and_audit.sql
-- The AI Bridge — 3-Tier Granular Quiz Permissions & Audit Trail System
-- ==============================================================================

-- 1. Add mcq_access_level column to member_permissions
-- Supported levels: 'none', 'viewer', 'moderator', 'manager'
ALTER TABLE public.member_permissions 
ADD COLUMN IF NOT EXISTS mcq_access_level TEXT DEFAULT 'none' 
CHECK (mcq_access_level IN ('none', 'viewer', 'moderator', 'manager'));

-- 2. Add mcq_access_level column to role_whitelist for pre-invitation authorization
ALTER TABLE public.role_whitelist 
ADD COLUMN IF NOT EXISTS mcq_access_level TEXT DEFAULT 'none' 
CHECK (mcq_access_level IN ('none', 'viewer', 'moderator', 'manager'));

-- 3. Add audit tracking fields to mcq_pool table
ALTER TABLE public.mcq_pool 
ADD COLUMN IF NOT EXISTS last_updated_by TEXT;

ALTER TABLE public.mcq_pool 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 4. Create dedicated audit log table for MCQ actions
CREATE TABLE IF NOT EXISTS public.mcq_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mcq_id UUID REFERENCES public.mcq_pool(id) ON DELETE SET NULL,
    question_snippet TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('toggle_status', 'edit_question', 'create_question', 'deactivate_question')),
    performed_by TEXT NOT NULL,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    details JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for mcq_audit_logs
ALTER TABLE public.mcq_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view MCQ audit logs" ON public.mcq_audit_logs;
CREATE POLICY "Anyone authenticated can view MCQ audit logs"
ON public.mcq_audit_logs FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins and authorized members can insert MCQ audit logs" ON public.mcq_audit_logs;
CREATE POLICY "Admins and authorized members can insert MCQ audit logs"
ON public.mcq_audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Migrate existing data: set mcq_access_level = 'manager' for members who currently have can_manage_mcqs = true
UPDATE public.member_permissions 
SET mcq_access_level = 'manager' 
WHERE can_manage_mcqs = true AND (mcq_access_level IS NULL OR mcq_access_level = 'none');
