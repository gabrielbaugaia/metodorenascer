-- Create a function to safely increment cashback balance
CREATE OR REPLACE FUNCTION public.increment_cashback_balance(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET cashback_balance = COALESCE(cashback_balance, 0) + 1
  WHERE id = target_user_id;
END;
$$;