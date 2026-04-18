-- Add archive columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS archived_reason text,
  ADD COLUMN IF NOT EXISTS archived_by uuid;

-- Index for faster filtering of active vs archived
CREATE INDEX IF NOT EXISTS idx_profiles_archived_at ON public.profiles(archived_at);

-- Update recalculate_funnel_status to honor archived state
CREATE OR REPLACE FUNCTION public.recalculate_funnel_status(target_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_has_subscription boolean;
  v_has_workout boolean;
  v_has_streak boolean;
  v_anamnese_completa boolean;
  v_archived_at timestamp with time zone;
  v_new_status text;
BEGIN
  -- Get profile state
  SELECT anamnese_completa, archived_at
    INTO v_anamnese_completa, v_archived_at
  FROM public.profiles WHERE id = target_user_id;

  -- Archived users short-circuit
  IF v_archived_at IS NOT NULL THEN
    UPDATE public.profiles
      SET funnel_status = 'archived'
      WHERE id = target_user_id;
    RETURN 'archived';
  END IF;

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
$function$;