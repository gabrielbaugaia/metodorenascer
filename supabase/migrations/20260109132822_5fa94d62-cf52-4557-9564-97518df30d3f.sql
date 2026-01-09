-- Drop the existing constraint and add new one with all valid statuses
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'pending_payment'::text, 'active'::text, 'free'::text, 'trialing'::text, 'cancelled'::text, 'canceled'::text, 'past_due'::text]));