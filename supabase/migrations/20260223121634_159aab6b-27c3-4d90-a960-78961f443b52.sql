
-- Add last_seen_at column to active_workout_sessions for heartbeat tracking
ALTER TABLE public.active_workout_sessions 
ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone DEFAULT now();

-- Performance indexes for frequently queried tables
CREATE INDEX IF NOT EXISTS idx_events_user_created ON public.events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_workout_completions_user_date ON public.workout_completions(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_manual_day_logs_user_date ON public.manual_day_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_health_daily_user_date ON public.health_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_message_sends_user_sent ON public.message_sends(user_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_pending_logins_created ON public.pending_logins(created_at);

-- Data retention function for events table (keep last 180 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.events WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$;
