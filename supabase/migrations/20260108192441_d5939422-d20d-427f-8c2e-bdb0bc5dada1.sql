-- Add fields to track invitation expiration for free plans
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS access_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- Update existing free subscriptions to have expiration date (7 days from creation)
UPDATE public.subscriptions 
SET invitation_expires_at = created_at + INTERVAL '7 days'
WHERE status = 'free' AND invitation_expires_at IS NULL;

-- Create function to auto-set expiration on new free subscriptions
CREATE OR REPLACE FUNCTION public.set_free_subscription_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'free' AND NEW.invitation_expires_at IS NULL THEN
    NEW.invitation_expires_at := NEW.created_at + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new free subscriptions
DROP TRIGGER IF EXISTS set_free_expiration_trigger ON public.subscriptions;
CREATE TRIGGER set_free_expiration_trigger
BEFORE INSERT ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_free_subscription_expiration();