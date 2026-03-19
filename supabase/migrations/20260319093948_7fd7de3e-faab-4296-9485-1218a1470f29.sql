ALTER TABLE public.health_daily 
  ADD COLUMN IF NOT EXISTS exercise_minutes integer,
  ADD COLUMN IF NOT EXISTS standing_hours integer,
  ADD COLUMN IF NOT EXISTS distance_km numeric;