-- Add UPDATE policy for storage
CREATE POLICY "Users can update own body photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'body-photos' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'body-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);