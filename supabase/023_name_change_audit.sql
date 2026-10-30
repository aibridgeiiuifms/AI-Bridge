-- ==============================================================================
-- 023_name_change_audit.sql
-- Migration: Add 1-Time Certificate Recipient Name Correction & Audit Trail
-- ==============================================================================

DO $$
BEGIN
    -- 1. Add audit columns to public.certificates if they do not exist
    ALTER TABLE public.certificates 
        ADD COLUMN IF NOT EXISTS name_change_used BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS name_changed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS old_name TEXT,
        ADD COLUMN IF NOT EXISTS name_change_reason TEXT;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- 2. Create partial index for fast admin lookup of modified certificates
CREATE INDEX IF NOT EXISTS idx_certificates_name_change_used 
ON public.certificates(name_change_used) 
WHERE name_change_used = true;

-- 3. Update existing records: if old_name is null, it defaults to null until modified
COMMENT ON COLUMN public.certificates.name_change_used IS 'Flag indicating whether student has used their 1-time name correction';
COMMENT ON COLUMN public.certificates.name_changed_at IS 'Timestamp when the student corrected their certificate name';
COMMENT ON COLUMN public.certificates.old_name IS 'Original recipient name prior to the 1-time correction';
COMMENT ON COLUMN public.certificates.name_change_reason IS 'Reason or note provided by student during the correction';
