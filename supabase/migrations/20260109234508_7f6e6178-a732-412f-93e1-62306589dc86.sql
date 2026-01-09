-- Create storage bucket for exercise GIFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-gifs', 'exercise-gifs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to exercise GIFs
CREATE POLICY "Exercise GIFs are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-gifs');

-- Allow admins to upload GIFs
CREATE POLICY "Admins can upload exercise GIFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exercise-gifs' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update exercise GIFs
CREATE POLICY "Admins can update exercise GIFs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'exercise-gifs' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to delete exercise GIFs
CREATE POLICY "Admins can delete exercise GIFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'exercise-gifs' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);