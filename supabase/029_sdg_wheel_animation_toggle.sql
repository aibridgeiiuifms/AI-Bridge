INSERT INTO public.system_settings (key, value, updated_at)
VALUES (
  'sdg_wheel_animation',
  jsonb_build_object('enabled', false),
  timezone('utc'::text, now())
)
ON CONFLICT (key) DO NOTHING;
