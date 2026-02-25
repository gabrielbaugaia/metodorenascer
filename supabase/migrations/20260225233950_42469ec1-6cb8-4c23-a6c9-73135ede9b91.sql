
CREATE POLICY "Admins can upload body photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'body-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update body photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'body-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'body-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete body photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'body-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
