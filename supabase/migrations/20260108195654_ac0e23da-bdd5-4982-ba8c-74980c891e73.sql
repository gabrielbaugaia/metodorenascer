-- SECURITY FIX: Restrict SECURITY DEFINER functions to prevent unauthorized access

-- 1. Update increment_cashback_balance to require service role only (called by triggers/edge functions)
CREATE OR REPLACE FUNCTION public.increment_cashback_balance(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function should only be called by service role (edge functions, triggers)
  -- The SECURITY DEFINER means it runs with owner privileges
  -- RLS policies on profiles table will still apply for direct table access
  UPDATE public.profiles
  SET cashback_balance = COALESCE(cashback_balance, 0) + 1
  WHERE id = target_user_id;
END;
$$;

-- Revoke execute from public, only allow service role
REVOKE EXECUTE ON FUNCTION public.increment_cashback_balance(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_cashback_balance(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_cashback_balance(uuid) FROM authenticated;

-- 2. Update recalculate_engagement to only allow self-recalculation or admin
CREATE OR REPLACE FUNCTION public.recalculate_engagement(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_logins integer;
  v_workouts integer;
  v_protocols integer;
  v_status text;
  v_last_login timestamp with time zone;
  v_caller_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get the calling user's ID
  v_caller_id := auth.uid();
  
  -- Check if caller is admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_caller_id AND role = 'admin'
  ) INTO v_is_admin;
  
  -- Only allow if caller is recalculating their own data OR is an admin OR no caller (service role)
  IF v_caller_id IS NOT NULL AND v_caller_id != target_user_id AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized to recalculate engagement for other users';
  END IF;

  -- Count logins in last 30 days
  SELECT COUNT(*) INTO v_logins
  FROM events
  WHERE user_id = target_user_id
    AND event_name = 'app_open'
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Count workouts completed in last 30 days
  SELECT COUNT(*) INTO v_workouts
  FROM workout_completions
  WHERE user_id = target_user_id
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Count protocols generated in last 30 days
  SELECT COUNT(*) INTO v_protocols
  FROM protocolos
  WHERE user_id = target_user_id
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Last login
  SELECT MAX(created_at) INTO v_last_login
  FROM events
  WHERE user_id = target_user_id
    AND event_name = 'app_open';

  -- Determine engagement status
  IF v_workouts >= 4 THEN
    v_status := 'ativo';
  ELSIF v_workouts BETWEEN 1 AND 3 OR (v_last_login IS NULL OR v_last_login < NOW() - INTERVAL '14 days') THEN
    v_status := 'em_risco';
  ELSE
    IF v_workouts = 0 AND (v_last_login IS NULL OR v_last_login < NOW() - INTERVAL '30 days') THEN
      v_status := 'quase_churn';
    ELSE
      v_status := 'em_risco';
    END IF;
  END IF;

  -- Upsert engagement_summary
  INSERT INTO engagement_summary (user_id, logins_last_30d, workouts_completed_last_30d, protocols_generated_last_30d, status_engagement, updated_at)
  VALUES (target_user_id, v_logins, v_workouts, v_protocols, v_status, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    logins_last_30d = EXCLUDED.logins_last_30d,
    workouts_completed_last_30d = EXCLUDED.workouts_completed_last_30d,
    protocols_generated_last_30d = EXCLUDED.protocols_generated_last_30d,
    status_engagement = EXCLUDED.status_engagement,
    updated_at = NOW();
END;
$$;

-- 3. Fix overly permissive RLS policies for subscriptions (service role bypass RLS anyway)
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "System can insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "System can update subscriptions" ON public.subscriptions;

-- Users can only view their own subscription
DROP POLICY IF EXISTS "Users can view their subscription" ON public.subscriptions;
CREATE POLICY "Users can view their subscription" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Restrict admin_support_alerts INSERT to authenticated users only (not true for all)
DROP POLICY IF EXISTS "Users can create alerts" ON public.admin_support_alerts;
DROP POLICY IF EXISTS "Allow insert for alerts" ON public.admin_support_alerts;
CREATE POLICY "Authenticated users can create their own alerts" 
ON public.admin_support_alerts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Restrict events INSERT to authenticated users (prevent analytics spam from anonymous)
DROP POLICY IF EXISTS "Anyone can insert events" ON public.events;
DROP POLICY IF EXISTS "Allow insert events" ON public.events;
CREATE POLICY "Authenticated users can insert events" 
ON public.events 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR auth.uid() = user_id));

-- 6. Restrict referrals INSERT to authenticated users only
DROP POLICY IF EXISTS "Allow insert referrals" ON public.referrals;
CREATE POLICY "Authenticated users can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referred_user_id);