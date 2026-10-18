-- ==============================================================================
-- 012_migrate_existing_certificate_ids.sql
-- The AI Bridge — Migrate Existing Certificate IDs to New Short Format (AIB-XXXXXXXX)
-- ==============================================================================

-- 1. Add legacy_certificate_id column so old printed/scanned QR codes never break
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS legacy_certificate_id TEXT;

-- 2. Migrate existing certificates from old sequential format (e.g. AIB-2025-XXXX, AIB-2026-XXXX)
DO $$
DECLARE
    rec RECORD;
    v_new_id TEXT;
    v_count INT := 0;
BEGIN
    -- Select all certificates that have the old sequential format or don't match the new 12-char pattern
    FOR rec IN 
        SELECT id, certificate_id 
        FROM public.certificates 
        WHERE certificate_id ~ '^AIB-202[0-9]-' OR length(certificate_id) != 12
    LOOP
        -- Generate a new short, cryptographically random, 100% unique ID
        v_new_id := public.generate_short_certificate_id();

        -- Save old ID in legacy_certificate_id and assign new certificate_id
        UPDATE public.certificates
        SET 
            legacy_certificate_id = COALESCE(legacy_certificate_id, certificate_id),
            certificate_id = v_new_id
        WHERE id = rec.id;

        v_count := v_count + 1;
        RAISE NOTICE 'Updated Certificate %: % -> %', rec.id, rec.certificate_id, v_new_id;
    END LOOP;

    RAISE NOTICE 'Successfully migrated % certificate(s) to short AIB-XXXXXXXX format.', v_count;
END $$;
