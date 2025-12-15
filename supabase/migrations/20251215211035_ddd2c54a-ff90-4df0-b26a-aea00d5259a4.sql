-- Enum for health data sources
CREATE TYPE public.health_source AS ENUM ('google_fit', 'apple_health');

-- Table to track user connections to health services
CREATE TABLE public.health_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source health_source NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, source)
);

-- Daily activity aggregated data
CREATE TABLE public.daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER DEFAULT 0,
  distance_m NUMERIC DEFAULT 0,
  active_calories NUMERIC DEFAULT 0,
  active_minutes INTEGER DEFAULT 0,
  source health_source NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date, source)
);

-- Individual workout sessions
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_min NUMERIC,
  type TEXT NOT NULL,
  calories NUMERIC,
  distance_m NUMERIC,
  source health_source NOT NULL,
  external_id TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, external_id, source)
);

-- User health goals/preferences
CREATE TABLE public.health_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  daily_steps_goal INTEGER DEFAULT 8000,
  daily_active_minutes_goal INTEGER DEFAULT 30,
  daily_calories_goal INTEGER DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.health_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for health_connections
CREATE POLICY "Users can view own health connections"
ON public.health_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health connections"
ON public.health_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health connections"
ON public.health_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health connections"
ON public.health_connections FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for daily_activity
CREATE POLICY "Users can view own daily activity"
ON public.daily_activity FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily activity"
ON public.daily_activity FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily activity"
ON public.daily_activity FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily activity"
ON public.daily_activity FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for workout_sessions
CREATE POLICY "Users can view own workout sessions"
ON public.workout_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions"
ON public.workout_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all workout sessions"
ON public.workout_sessions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for health_goals
CREATE POLICY "Users can view own health goals"
ON public.health_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health goals"
ON public.health_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health goals"
ON public.health_goals FOR UPDATE
USING (auth.uid() = user_id);

-- Aggregated view combining data from all sources
CREATE OR REPLACE VIEW public.daily_activity_aggregated AS
SELECT 
  user_id,
  date,
  SUM(steps) as total_steps,
  SUM(distance_m) as total_distance_m,
  SUM(active_calories) as total_active_calories,
  SUM(active_minutes) as total_active_minutes,
  array_agg(DISTINCT source) as sources,
  MAX(last_synced_at) as last_synced_at
FROM public.daily_activity
GROUP BY user_id, date;

-- Trigger for updated_at on health_connections
CREATE TRIGGER update_health_connections_updated_at
BEFORE UPDATE ON public.health_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on daily_activity
CREATE TRIGGER update_daily_activity_updated_at
BEFORE UPDATE ON public.daily_activity
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on health_goals
CREATE TRIGGER update_health_goals_updated_at
BEFORE UPDATE ON public.health_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();