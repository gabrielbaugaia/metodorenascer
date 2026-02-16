
-- Tabela health_daily: 1 registro por usuário por dia
CREATE TABLE public.health_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  steps integer DEFAULT 0,
  active_calories integer DEFAULT 0,
  sleep_minutes integer DEFAULT 0,
  resting_hr integer NULL,
  hrv_ms numeric NULL,
  source text DEFAULT 'unknown',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT health_daily_user_date_unique UNIQUE(user_id, date)
);

-- Tabela health_workouts: múltiplos treinos por dia
CREATE TABLE public.health_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  type text NOT NULL,
  calories integer NULL,
  source text DEFAULT 'unknown',
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_health_daily_user_date ON public.health_daily(user_id, date DESC);
CREATE INDEX idx_health_workouts_user_start ON public.health_workouts(user_id, start_time DESC);

-- Trigger para updated_at em health_daily
CREATE TRIGGER update_health_daily_updated_at
  BEFORE UPDATE ON public.health_daily
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS health_daily
ALTER TABLE public.health_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health_daily"
  ON public.health_daily FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health_daily"
  ON public.health_daily FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health_daily"
  ON public.health_daily FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health_daily"
  ON public.health_daily FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all health_daily"
  ON public.health_daily FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS health_workouts
ALTER TABLE public.health_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health_workouts"
  ON public.health_workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health_workouts"
  ON public.health_workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health_workouts"
  ON public.health_workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health_workouts"
  ON public.health_workouts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all health_workouts"
  ON public.health_workouts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
