
-- 1. Create entitlements table (FK to profiles, not auth.users)
CREATE TABLE public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_level text NOT NULL DEFAULT 'none',
  override_level text,
  override_expires_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Create trial_usage table (FK to profiles, not auth.users)
CREATE TABLE public.trial_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_workout boolean DEFAULT false,
  used_diet boolean DEFAULT false,
  used_mindset boolean DEFAULT false,
  used_recipe_count integer DEFAULT 0,
  used_support_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Add trial_end column to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS trial_end timestamptz;

-- 4. RLS for entitlements
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entitlements"
  ON public.entitlements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all entitlements"
  ON public.entitlements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage entitlements"
  ON public.entitlements FOR ALL
  USING (true);

-- 5. RLS for trial_usage
ALTER TABLE public.trial_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trial_usage"
  ON public.trial_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own trial_usage"
  ON public.trial_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all trial_usage"
  ON public.trial_usage FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage trial_usage"
  ON public.trial_usage FOR ALL
  USING (true);

-- 6. Seed entitlements from existing subscriptions
-- Active/trialing users get 'full'
INSERT INTO public.entitlements (user_id, access_level)
SELECT s.user_id, 'full'
FROM public.subscriptions s
WHERE s.status IN ('active', 'trialing', 'free')
  AND (s.access_blocked IS NULL OR s.access_blocked = false)
ON CONFLICT (user_id) DO UPDATE SET access_level = 'full';

-- Users with trial module access but no active subscription get 'trial_limited'
INSERT INTO public.entitlements (user_id, access_level)
SELECT DISTINCT uma.user_id, 'trial_limited'
FROM public.user_module_access uma
WHERE NOT EXISTS (
  SELECT 1 FROM public.entitlements e WHERE e.user_id = uma.user_id
)
AND (uma.expires_at IS NULL OR uma.expires_at > now())
ON CONFLICT (user_id) DO NOTHING;

-- 7. Fix elite grátis sem Stripe real
INSERT INTO public.entitlements (user_id, access_level)
SELECT s.user_id, 'none'
FROM public.subscriptions s
WHERE s.plan_type IN ('elite_fundador', 'embaixador')
  AND (s.stripe_subscription_id IS NULL OR s.stripe_subscription_id = '' OR s.stripe_subscription_id LIKE 'invite_%')
  AND s.status NOT IN ('active', 'trialing')
ON CONFLICT (user_id) DO UPDATE SET access_level = 'none';

-- 8. Create trigger to auto-update updated_at
CREATE TRIGGER update_entitlements_updated_at
  BEFORE UPDATE ON public.entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trial_usage_updated_at
  BEFORE UPDATE ON public.trial_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
