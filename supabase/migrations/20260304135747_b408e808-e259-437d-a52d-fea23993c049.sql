CREATE POLICY "Users can update own fitness screenshots"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'fitness-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);