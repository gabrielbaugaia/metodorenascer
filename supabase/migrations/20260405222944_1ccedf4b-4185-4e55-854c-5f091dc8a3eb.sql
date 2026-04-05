ALTER TABLE public.manual_day_logs ADD COLUMN IF NOT EXISTS resting_hr integer DEFAULT NULL;
ALTER TABLE public.manual_day_logs ADD COLUMN IF NOT EXISTS hrv_ms numeric DEFAULT NULL;
ALTER TABLE public.manual_day_logs ADD COLUMN IF NOT EXISTS avg_hr_bpm integer DEFAULT NULL;