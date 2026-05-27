
-- Restrict service-role-only policies to service_role
ALTER POLICY "Service role can manage challenges" ON public.adaptive_challenges TO service_role;
ALTER POLICY "Service role can manage behavior profiles" ON public.behavior_profiles TO service_role;
ALTER POLICY "Service role can manage trial_usage" ON public.trial_usage TO service_role;

-- Revoke public EXECUTE on internal SECURITY DEFINER functions not meant for client API
REVOKE EXECUTE ON FUNCTION public.cleanup_old_events() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_pending_logins() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_cashback_balance(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_engagement(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_funnel_status(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.cleanup_old_events() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_pending_logins() TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_cashback_balance(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_engagement(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_funnel_status(uuid) TO service_role;
