-- Allow admins to read private body-photos objects (needed to generate signed URLs in admin UI)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can read body-photos'
  ) THEN
    DROP POLICY "Admins can read body-photos" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "Admins can read body-photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'body-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
