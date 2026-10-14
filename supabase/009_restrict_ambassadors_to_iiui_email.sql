-- Restrict ambassador access to institutional accounts, while preserving
-- personal Google sign-in for student and educator accounts.

-- Demote any existing personal Gmail ambassador whitelist entries and profiles.
UPDATE public.role_whitelist
SET target_role = 'student',
    updated_at = timezone('utc'::text, now())
WHERE target_role = 'member'
  AND LOWER(TRIM(email)) ~ '@(gmail|googlemail)\.com$';

UPDATE public.profiles
SET role = 'student',
    updated_at = timezone('utc'::text, now())
WHERE role = 'member'
  AND LOWER(TRIM(email)) ~ '@(gmail|googlemail)\.com$';

DELETE FROM public.member_permissions mp
USING public.profiles p
WHERE mp.member_id = p.id
  AND p.role = 'student'
  AND LOWER(TRIM(p.email)) ~ '@(gmail|googlemail)\.com$';

-- Keep role assignment safe even when whitelist writes do not go through the API.
CREATE OR REPLACE FUNCTION public.prevent_personal_gmail_ambassador()
RETURNS trigger AS $$
BEGIN
    IF NEW.target_role = 'member'
       AND LOWER(TRIM(NEW.email)) ~ '@(gmail|googlemail)\.com$' THEN
        RAISE EXCEPTION 'Ambassador access requires an approved IIUI email account.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_personal_gmail_ambassador ON public.role_whitelist;
CREATE TRIGGER trg_prevent_personal_gmail_ambassador
    BEFORE INSERT OR UPDATE OF email, target_role ON public.role_whitelist
    FOR EACH ROW EXECUTE FUNCTION public.prevent_personal_gmail_ambassador();

-- Protect profiles against direct role grants outside the whitelist flow.
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_member_not_personal_gmail
    CHECK (
        role <> 'member'
        OR LOWER(TRIM(email)) !~ '@(gmail|googlemail)\.com$'
    );
