
-- Add new mental wellness fields to sis_cognitive_checkins
ALTER TABLE public.sis_cognitive_checkins 
  ADD COLUMN IF NOT EXISTS mood integer,
  ADD COLUMN IF NOT EXISTS anxiety integer,
  ADD COLUMN IF NOT EXISTS training_motivation integer,
  ADD COLUMN IF NOT EXISTS sleep_quality integer,
  ADD COLUMN IF NOT EXISTS social_interaction boolean DEFAULT true;

-- Create mental_wellness_scores table
CREATE TABLE public.mental_wellness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  burnout_index numeric DEFAULT 0,
  compulsion_risk numeric DEFAULT 0,
  sleep_mood_correlation numeric DEFAULT 0,
  body_mind_divergence numeric DEFAULT 0,
  motivation_trend numeric DEFAULT 0,
  resilience_index numeric DEFAULT 0,
  alerts jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.mental_wellness_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wellness scores"
  ON public.mental_wellness_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins full access wellness scores"
  ON public.mental_wellness_scores FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage wellness scores"
  ON public.mental_wellness_scores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
