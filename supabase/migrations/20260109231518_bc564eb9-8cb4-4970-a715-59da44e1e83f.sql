-- Create exercise_gifs table to track which exercises have GIF demonstrations
CREATE TABLE public.exercise_gifs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_name_pt TEXT NOT NULL,
  exercise_name_en TEXT NOT NULL,
  gif_url TEXT,
  muscle_group TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'missing')),
  api_source TEXT DEFAULT 'exercisedb',
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(exercise_name_pt)
);

-- Enable RLS
ALTER TABLE public.exercise_gifs ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage exercise gifs"
ON public.exercise_gifs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Everyone can read exercise gifs
CREATE POLICY "Everyone can view exercise gifs"
ON public.exercise_gifs
FOR SELECT
TO authenticated
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_exercise_gifs_name_pt ON public.exercise_gifs(exercise_name_pt);
CREATE INDEX idx_exercise_gifs_status ON public.exercise_gifs(status);
CREATE INDEX idx_exercise_gifs_muscle_group ON public.exercise_gifs(muscle_group);

-- Trigger to update updated_at
CREATE TRIGGER update_exercise_gifs_updated_at
BEFORE UPDATE ON public.exercise_gifs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();