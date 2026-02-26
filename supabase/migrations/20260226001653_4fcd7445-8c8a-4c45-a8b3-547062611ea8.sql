
-- Add fitness columns to manual_day_logs
ALTER TABLE public.manual_day_logs
  ADD COLUMN IF NOT EXISTS steps integer,
  ADD COLUMN IF NOT EXISTS active_calories integer,
  ADD COLUMN IF NOT EXISTS exercise_minutes integer,
  ADD COLUMN IF NOT EXISTS standing_hours integer,
  ADD COLUMN IF NOT EXISTS distance_km numeric(5,2),
  ADD COLUMN IF NOT EXISTS fitness_screenshot_path text;

-- Create fitness-screenshots storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('fitness-screenshots', 'fitness-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can upload their own screenshots
CREATE POLICY "Users can upload own fitness screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fitness-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: users can view their own screenshots
CREATE POLICY "Users can view own fitness screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'fitness-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: admins can view all fitness screenshots
CREATE POLICY "Admins can view all fitness screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'fitness-screenshots'
  AND public.has_role(auth.uid(), 'admin')
);
