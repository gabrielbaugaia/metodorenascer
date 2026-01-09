-- Create table for temporary login tokens for guest checkouts
CREATE TABLE public.pending_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL,
  temp_password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '1 hour')
);

-- Enable RLS (no public policies - only service role can access)
ALTER TABLE public.pending_logins ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_pending_logins_session_id ON public.pending_logins(session_id);

-- Auto-cleanup expired records (optional cleanup function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_logins()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.pending_logins 
  WHERE expires_at < now() OR used_at IS NOT NULL;
END;
$$;