-- Fix referral_codes RLS: restrict public access to only allow lookup by specific code
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can lookup referral code by code value" ON public.referral_codes;

-- Create a more restrictive policy that only allows looking up a specific code
-- This prevents enumeration of all codes while still allowing the referral flow
CREATE POLICY "Lookup referral code by specific code value" 
ON public.referral_codes 
FOR SELECT 
USING (true);

-- Note: The actual restriction happens in the application layer by querying with specific code
-- To make it truly secure, we use a function-based approach

-- Create a secure function to lookup referral codes without exposing user_ids directly
CREATE OR REPLACE FUNCTION public.validate_referral_code(lookup_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.referral_codes
    WHERE code = lookup_code
  )
$$;

-- Update the policy to be more restrictive - only owner can see their own code
DROP POLICY IF EXISTS "Lookup referral code by specific code value" ON public.referral_codes;

CREATE POLICY "Users can only view their own referral code" 
ON public.referral_codes 
FOR SELECT 
USING (auth.uid() = user_id);

-- The get_referrer_name_by_code function already exists and uses SECURITY DEFINER
-- which is safe for lookups without exposing the full table