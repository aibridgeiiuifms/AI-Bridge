-- Keep gallery database and Storage permissions aligned with /dashboard/gallery.
CREATE OR REPLACE FUNCTION public.can_manage_event_gallery()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.profile_id = auth.uid()
      AND (m.can_manage_gallery = true OR m.can_manage_team = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Managers insert event-gallery images" ON storage.objects;
CREATE POLICY "Managers insert event-gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-gallery'
  AND public.can_manage_event_gallery()
);

DROP POLICY IF EXISTS "Managers update event-gallery images" ON storage.objects;
CREATE POLICY "Managers update event-gallery images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-gallery'
  AND public.can_manage_event_gallery()
)
WITH CHECK (
  bucket_id = 'event-gallery'
  AND public.can_manage_event_gallery()
);

DROP POLICY IF EXISTS "Managers delete event-gallery images" ON storage.objects;
CREATE POLICY "Managers delete event-gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-gallery'
  AND public.can_manage_event_gallery()
);
