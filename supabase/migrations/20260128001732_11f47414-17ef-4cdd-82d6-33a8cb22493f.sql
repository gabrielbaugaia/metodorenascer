-- 1. Add funnel_status column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS funnel_status text DEFAULT 'visitor';

-- 2. Add session_id column to events for anonymous tracking
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS session_id text;

-- 3. Create index for session_id lookups
CREATE INDEX IF NOT EXISTS idx_events_session_id ON public.events(session_id) WHERE session_id IS NOT NULL;

-- 4. Update RLS policy on events to allow anonymous inserts with session_id
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
DROP POLICY IF EXISTS "Anyone can insert events with session" ON public.events;

CREATE POLICY "Anyone can insert events with session" 
ON public.events 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND (user_id IS NULL OR auth.uid() = user_id))
  OR 
  (auth.uid() IS NULL AND session_id IS NOT NULL AND user_id IS NULL)
);

-- 5. Create function to update funnel_status based on user state
CREATE OR REPLACE FUNCTION public.update_funnel_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_subscription boolean;
  v_has_workout boolean;
  v_has_streak boolean;
  v_new_status text;
BEGIN
  -- Check if user has active subscription
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = NEW.id AND status IN ('active', 'trialing')
  ) INTO v_has_subscription;
  
  -- Check if user has completed at least one workout
  SELECT EXISTS (
    SELECT 1 FROM public.workout_completions 
    WHERE user_id = NEW.id
  ) INTO v_has_workout;
  
  -- Check if user has streak >= 3
  SELECT EXISTS (
    SELECT 1 FROM public.user_streaks 
    WHERE user_id = NEW.id AND current_streak >= 3
  ) INTO v_has_streak;
  
  -- Determine status based on hierarchy
  IF v_has_subscription THEN
    v_new_status := 'paying';
  ELSIF v_has_workout OR v_has_streak THEN
    v_new_status := 'engaged';
  ELSIF NEW.anamnese_completa = true THEN
    v_new_status := 'active';
  ELSE
    v_new_status := 'lead';
  END IF;
  
  -- Only update if status changed
  IF NEW.funnel_status IS DISTINCT FROM v_new_status THEN
    NEW.funnel_status := v_new_status;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Create trigger to auto-update funnel_status on profile changes
DROP TRIGGER IF EXISTS trigger_update_funnel_status ON public.profiles;
CREATE TRIGGER trigger_update_funnel_status
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_funnel_status();

-- 7. Create function to recalculate funnel status (callable from edge functions)
CREATE OR REPLACE FUNCTION public.recalculate_funnel_status(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_subscription boolean;
  v_has_workout boolean;
  v_has_streak boolean;
  v_anamnese_completa boolean;
  v_new_status text;
BEGIN
  -- Get anamnese status
  SELECT anamnese_completa INTO v_anamnese_completa
  FROM public.profiles WHERE id = target_user_id;
  
  -- Check subscription
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = target_user_id AND status IN ('active', 'trialing')
  ) INTO v_has_subscription;
  
  -- Check workout
  SELECT EXISTS (
    SELECT 1 FROM public.workout_completions 
    WHERE user_id = target_user_id
  ) INTO v_has_workout;
  
  -- Check streak
  SELECT EXISTS (
    SELECT 1 FROM public.user_streaks 
    WHERE user_id = target_user_id AND current_streak >= 3
  ) INTO v_has_streak;
  
  -- Determine status
  IF v_has_subscription THEN
    v_new_status := 'paying';
  ELSIF v_has_workout OR v_has_streak THEN
    v_new_status := 'engaged';
  ELSIF v_anamnese_completa = true THEN
    v_new_status := 'active';
  ELSE
    v_new_status := 'lead';
  END IF;
  
  -- Update profile
  UPDATE public.profiles 
  SET funnel_status = v_new_status 
  WHERE id = target_user_id;
  
  RETURN v_new_status;
END;
$$;