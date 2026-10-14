-- Allow explicitly whitelisted Gmail accounts to use the ambassador portal.
-- Personal Gmail accounts not present in role_whitelist remain students.

DROP TRIGGER IF EXISTS trg_prevent_personal_gmail_ambassador ON public.role_whitelist;
DROP FUNCTION IF EXISTS public.prevent_personal_gmail_ambassador();

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_member_not_personal_gmail;

-- Migration 009 demoted personal Gmail whitelist entries. Restore them as
-- members so the existing whitelist remains the source of portal access.
UPDATE public.role_whitelist
SET target_role = 'member',
    updated_at = timezone('utc'::text, now())
WHERE target_role = 'student'
  AND LOWER(TRIM(email)) ~ '@(gmail|googlemail)\.com$';

-- Restore member permission records in case they were removed by migration 009.
INSERT INTO public.member_permissions (
    member_id,
    can_manage_events,
    can_view_surveys,
    can_verify_attendance,
    can_manage_mcqs,
    can_export_reports,
    can_manage_team
)
SELECT
    p.id,
    COALESCE(w.team_tag = 'awareness', false),
    true,
    COALESCE(w.team_tag = 'workshops', false),
    false,
    COALESCE(w.team_tag = 'analyzing', true),
    COALESCE(w.can_manage_team, false)
FROM public.profiles p
JOIN public.role_whitelist w
  ON LOWER(TRIM(w.email)) = LOWER(TRIM(p.email))
WHERE w.target_role = 'member'
ON CONFLICT (member_id) DO NOTHING;
