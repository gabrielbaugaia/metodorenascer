-- SECURITY FIX: Remove overly permissive RLS policies
-- These policies used USING(true) which exposed sensitive data to all clients
-- Service role operations bypass RLS automatically, so these policies were unnecessary

-- 1. Remove permissive policy from notification_preferences
DROP POLICY IF EXISTS "Service role can read all preferences" ON public.notification_preferences;

-- 2. Remove permissive policy from push_subscriptions
DROP POLICY IF EXISTS "Service role can read all subscriptions" ON public.push_subscriptions;

-- Verification: User-scoped policies already exist:
-- notification_preferences: "Users can view their own preferences" USING (auth.uid() = user_id)
-- push_subscriptions: "Users can view their own subscriptions" USING (auth.uid() = user_id)
-- These will remain active and properly scope data access