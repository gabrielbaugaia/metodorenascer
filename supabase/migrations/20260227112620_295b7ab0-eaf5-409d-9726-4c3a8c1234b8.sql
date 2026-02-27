ALTER TABLE public.manual_day_logs
  ADD COLUMN IF NOT EXISTS fitness_screenshot_path_2 text,
  ADD COLUMN IF NOT EXISTS fitness_screenshot_path_3 text;