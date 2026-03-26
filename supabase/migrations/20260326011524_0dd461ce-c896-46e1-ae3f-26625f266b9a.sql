
CREATE TABLE public.cardio_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cardio_type TEXT NOT NULL DEFAULT 'rua',
  duration_minutes INTEGER,
  distance_km NUMERIC,
  calories_burned INTEGER,
  avg_hr_bpm INTEGER,
  max_hr_bpm INTEGER,
  fasting BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  fitness_screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cardio_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cardio sessions"
  ON public.cardio_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cardio sessions"
  ON public.cardio_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cardio sessions"
  ON public.cardio_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cardio sessions"
  ON public.cardio_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all cardio sessions"
  ON public.cardio_sessions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
