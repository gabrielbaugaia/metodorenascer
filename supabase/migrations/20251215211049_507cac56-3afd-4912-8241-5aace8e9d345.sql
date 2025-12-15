-- Drop the existing view and recreate with proper security
DROP VIEW IF EXISTS public.daily_activity_aggregated;

-- Recreate view with SECURITY INVOKER (default, but explicit)
CREATE VIEW public.daily_activity_aggregated 
WITH (security_invoker = true) AS
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