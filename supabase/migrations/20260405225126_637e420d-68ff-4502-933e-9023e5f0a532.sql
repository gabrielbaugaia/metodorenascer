
ALTER TABLE public.health_daily
  ADD COLUMN IF NOT EXISTS sleeping_hr integer,
  ADD COLUMN IF NOT EXISTS sleeping_hrv numeric,
  ADD COLUMN IF NOT EXISTS min_hr integer,
  ADD COLUMN IF NOT EXISTS max_hr integer,
  ADD COLUMN IF NOT EXISTS sedentary_hr integer;

ALTER TABLE public.manual_day_logs
  ADD COLUMN IF NOT EXISTS sleeping_hr integer,
  ADD COLUMN IF NOT EXISTS sleeping_hrv numeric,
  ADD COLUMN IF NOT EXISTS min_hr integer,
  ADD COLUMN IF NOT EXISTS max_hr integer,
  ADD COLUMN IF NOT EXISTS sedentary_hr integer;
