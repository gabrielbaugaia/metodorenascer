-- Fix permissive policies to be more restrictive
-- 1. Change engagement_summary system policies to service_role only

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "System can update engagement" ON public.engagement_summary;
DROP POLICY IF EXISTS "System can upsert engagement" ON public.engagement_summary;

-- Create restrictive service_role only policies
CREATE POLICY "Service role can update engagement"
  ON public.engagement_summary
  FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert engagement"
  ON public.engagement_summary
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 2. Fix admin_support_alerts - restrict to service_role only
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.admin_support_alerts;

CREATE POLICY "Service role can insert alerts"
  ON public.admin_support_alerts
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 3. Fix referrals system insert policy - restrict to service_role
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;

CREATE POLICY "Service role can insert referrals"
  ON public.referrals
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 4. Restrict subscriptions service_role policies (already correct, just ensuring)
-- These are already targeted to service_role, no changes needed

-- Add comments documenting the security model
COMMENT ON POLICY "Service role can update engagement" ON public.engagement_summary IS 
  'Edge functions with service_role can update engagement metrics for any user';

COMMENT ON POLICY "Service role can insert engagement" ON public.engagement_summary IS 
  'Edge functions with service_role can create engagement metrics for any user';

COMMENT ON POLICY "Service role can insert alerts" ON public.admin_support_alerts IS 
  'Edge functions with service_role can create support alerts for any user';

COMMENT ON POLICY "Service role can insert referrals" ON public.referrals IS 
  'Edge functions with service_role can create referral records';