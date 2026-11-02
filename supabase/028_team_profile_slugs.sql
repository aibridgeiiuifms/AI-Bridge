-- Add stable, readable public profile URLs for team members.
ALTER TABLE public.members
    ADD COLUMN IF NOT EXISTS profile_slug TEXT;

WITH normalized AS (
    SELECT
        id,
        COALESCE(
            NULLIF(
                TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(COALESCE(full_name, '')), '[^a-z0-9]+', '-', 'g')),
                ''
            ),
            'team-member'
        ) AS base_slug
    FROM public.members
),
ranked AS (
    SELECT
        m.id,
        n.base_slug,
        COUNT(*) OVER (PARTITION BY n.base_slug) AS duplicate_count
    FROM public.members m
    JOIN normalized n ON n.id = m.id
)
UPDATE public.members m
SET profile_slug = CASE
    WHEN ranked.duplicate_count = 1 THEN ranked.base_slug
    ELSE ranked.base_slug || '-' || LEFT(REPLACE(m.id::TEXT, '-', ''), 6)
END
FROM ranked
WHERE m.id = ranked.id
  AND (m.profile_slug IS NULL OR BTRIM(m.profile_slug) = '');

ALTER TABLE public.members
    ALTER COLUMN profile_slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_profile_slug
    ON public.members(profile_slug)
    WHERE profile_slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_member_profile_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_base_slug TEXT;
BEGIN
    IF NEW.profile_slug IS NULL OR BTRIM(NEW.profile_slug) = '' THEN
        v_base_slug := COALESCE(
            NULLIF(
                TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(COALESCE(NEW.full_name, '')), '[^a-z0-9]+', '-', 'g')),
                ''
            ),
            'team-member'
        );

        NEW.profile_slug := v_base_slug;
        IF EXISTS (
            SELECT 1
            FROM public.members
            WHERE profile_slug = NEW.profile_slug
              AND id IS DISTINCT FROM NEW.id
        ) THEN
            NEW.profile_slug := v_base_slug || '-' || LEFT(REPLACE(NEW.id::TEXT, '-', ''), 6);
        END IF;
    ELSE
        NEW.profile_slug := TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(NEW.profile_slug), '[^a-z0-9]+', '-', 'g'));
    END IF;

    IF NEW.profile_slug = '' THEN
        RAISE EXCEPTION 'Profile URL slug must contain letters or numbers';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_member_profile_slug ON public.members;
CREATE TRIGGER trg_set_member_profile_slug
    BEFORE INSERT OR UPDATE OF profile_slug, full_name ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.set_member_profile_slug();
