
-- Create anamnese_tokens table
CREATE TABLE public.anamnese_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anamnese_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can insert tokens
CREATE POLICY "Admins can insert anamnese tokens"
ON public.anamnese_tokens
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can read tokens
CREATE POLICY "Admins can view anamnese tokens"
ON public.anamnese_tokens
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage (for edge function)
CREATE POLICY "Service role can manage anamnese tokens"
ON public.anamnese_tokens
FOR ALL
USING (true);
