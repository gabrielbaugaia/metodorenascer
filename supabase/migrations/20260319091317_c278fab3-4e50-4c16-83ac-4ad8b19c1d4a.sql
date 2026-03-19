
-- Add screenshot columns 4-7 to manual_day_logs
ALTER TABLE public.manual_day_logs
  ADD COLUMN IF NOT EXISTS fitness_screenshot_path_4 text,
  ADD COLUMN IF NOT EXISTS fitness_screenshot_path_5 text,
  ADD COLUMN IF NOT EXISTS fitness_screenshot_path_6 text,
  ADD COLUMN IF NOT EXISTS fitness_screenshot_path_7 text;

-- Create workout_notes table
CREATE TABLE public.workout_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  protocolo_id uuid REFERENCES public.protocolos(id) ON DELETE CASCADE NOT NULL,
  workout_day text NOT NULL,
  note text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, protocolo_id, workout_day)
);

ALTER TABLE public.workout_notes ENABLE ROW LEVEL SECURITY;

-- Users can manage own notes
CREATE POLICY "Users can manage own workout notes"
  ON public.workout_notes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all notes
CREATE POLICY "Admins can view all workout notes"
  ON public.workout_notes FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
