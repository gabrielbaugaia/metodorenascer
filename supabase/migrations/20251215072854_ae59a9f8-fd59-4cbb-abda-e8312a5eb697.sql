-- Table for workout completions tracking
CREATE TABLE public.workout_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_name TEXT,
  exercises_completed INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own completions" ON public.workout_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" ON public.workout_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions" ON public.workout_completions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all completions" ON public.workout_completions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for faster queries
CREATE INDEX idx_workout_completions_user_date ON public.workout_completions(user_id, workout_date);

-- Add onboarding_completed to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;