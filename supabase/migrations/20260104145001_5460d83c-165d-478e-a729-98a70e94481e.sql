-- Drop existing INSERT policy that might be too restrictive
DROP POLICY IF EXISTS "Users can upload own body photos" ON storage.objects;

-- Recreate with more robust check
CREATE POLICY "Users can upload own body photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'body-photos' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Ensure UPDATE policy exists properly
DROP POLICY IF EXISTS "Users can update own body photos" ON storage.objects;

CREATE POLICY "Users can update own body photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'body-photos' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'body-photos' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);