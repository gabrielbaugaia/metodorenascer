
-- behavior_profiles table
CREATE TABLE public.behavior_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_type text NOT NULL DEFAULT 'executor',
  confidence_score numeric NOT NULL DEFAULT 0,
  metrics_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT behavior_profiles_user_id_unique UNIQUE (user_id)
);

ALTER TABLE public.behavior_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own behavior profile"
ON public.behavior_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all behavior profiles"
ON public.behavior_profiles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage behavior profiles"
ON public.behavior_profiles FOR ALL
USING (true);

-- adaptive_challenges table
CREATE TABLE public.adaptive_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_type text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'active'
);

ALTER TABLE public.adaptive_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges"
ON public.adaptive_challenges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
ON public.adaptive_challenges FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all challenges"
ON public.adaptive_challenges FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage challenges"
ON public.adaptive_challenges FOR ALL
USING (true);
