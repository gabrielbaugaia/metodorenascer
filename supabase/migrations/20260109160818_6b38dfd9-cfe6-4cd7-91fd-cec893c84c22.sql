-- Add explicit service_role policy to pending_logins table
-- This documents that only service role should access this table

-- Add policy for service role full access
CREATE POLICY "Service role full access to pending_logins"
  ON public.pending_logins
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add table comment documenting the access pattern
COMMENT ON TABLE public.pending_logins IS 
  'Stores temporary credentials for guest checkout auto-login. Only accessible via service_role (edge functions). RLS enabled with explicit service_role-only policy for security.';