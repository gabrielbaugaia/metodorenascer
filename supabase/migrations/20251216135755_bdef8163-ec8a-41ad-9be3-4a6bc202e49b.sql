-- Revoke public access to increment_cashback_balance function
-- This prevents any authenticated user from calling it directly
REVOKE ALL ON FUNCTION public.increment_cashback_balance(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_cashback_balance(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.increment_cashback_balance(uuid) FROM authenticated;

-- Only service_role can execute (used by edge functions)
GRANT EXECUTE ON FUNCTION public.increment_cashback_balance(uuid) TO service_role;

-- Also secure recalculate_engagement function (same pattern - only service_role should call)
REVOKE ALL ON FUNCTION public.recalculate_engagement(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recalculate_engagement(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.recalculate_engagement(uuid) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.recalculate_engagement(uuid) TO service_role;