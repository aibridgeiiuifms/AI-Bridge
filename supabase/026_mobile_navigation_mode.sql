-- Store the public mobile navigation mode. Desktop navigation is not affected.
INSERT INTO public.system_settings (key, value, updated_at)
VALUES (
  'site_navigation_mode',
  jsonb_build_object('mobile', 'continuous'),
  timezone('utc'::text, now())
)
ON CONFLICT (key) DO NOTHING;
