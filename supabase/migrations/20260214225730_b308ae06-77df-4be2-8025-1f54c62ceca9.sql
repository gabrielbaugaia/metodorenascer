
-- Table for active workout sessions
CREATE TABLE public.active_workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workout_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  total_duration_seconds integer,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.active_workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own sessions"
  ON public.active_workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions"
  ON public.active_workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.active_workout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON public.active_workout_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all sessions"
  ON public.active_workout_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Table for individual set logs
CREATE TABLE public.workout_set_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL REFERENCES public.active_workout_sessions(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  set_number integer NOT NULL,
  weight_kg numeric NOT NULL DEFAULT 0,
  reps_done integer NOT NULL DEFAULT 0,
  rest_seconds integer NOT NULL DEFAULT 60,
  rest_respected boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_set_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own set logs"
  ON public.workout_set_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own set logs"
  ON public.workout_set_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all set logs"
  ON public.workout_set_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all set logs"
  ON public.workout_set_logs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_set_logs_user_exercise ON public.workout_set_logs (user_id, exercise_name, created_at DESC);
CREATE INDEX idx_set_logs_session ON public.workout_set_logs (user_id, session_id);
CREATE INDEX idx_active_sessions_user ON public.active_workout_sessions (user_id, status);

-- Add duration tracking to workout_completions
ALTER TABLE public.workout_completions ADD COLUMN IF NOT EXISTS total_duration_seconds integer;
ALTER TABLE public.workout_completions ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.active_workout_sessions(id);
