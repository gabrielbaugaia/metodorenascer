CREATE OR REPLACE FUNCTION public.claim_invite_link(_slug text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l invite_links; uid uuid := auth.uid(); exp timestamptz;
BEGIN
  IF uid IS NULL THEN RETURN 'not_authenticated'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('invite:' || _slug));
  SELECT * INTO l FROM invite_links WHERE slug = _slug;
  IF l.id IS NULL OR NOT l.active THEN RETURN 'invalid'; END IF;
  IF EXISTS (SELECT 1 FROM invite_link_claims WHERE user_id = uid) THEN RETURN 'already_claimed'; END IF;
  IF EXISTS (SELECT 1 FROM subscriptions WHERE user_id = uid AND status IN ('active','trialing')
      AND (current_period_end IS NULL OR current_period_end > now())) THEN RETURN 'already_active'; END IF;
  IF (SELECT count(*) FROM invite_link_claims WHERE link_id = l.id) >= l.slot_limit THEN RETURN 'sold_out'; END IF;
  exp := now() + make_interval(days => l.access_days);
  INSERT INTO invite_link_claims(link_id, user_id, expires_at) VALUES (l.id, uid, exp);
  INSERT INTO subscriptions(user_id, status, plan_type, plan_name, price_cents, current_period_start, current_period_end, stripe_customer_id)
  VALUES (uid, 'active', 'convite', upper(l.label), 0, now(), exp, 'invite_link_' || l.slug);
  INSERT INTO entitlements(user_id, access_level, override_level, override_expires_at)
  VALUES (uid, 'none', 'full', exp)
  ON CONFLICT (user_id) DO UPDATE SET override_level = 'full',
    override_expires_at = GREATEST(COALESCE(entitlements.override_expires_at, exp), exp), updated_at = now();
  RETURN 'ok';
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_invite_link(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_invite_link(text) TO authenticated;

INSERT INTO public.entitlements(user_id, access_level, override_level, override_expires_at)
SELECT c.user_id, 'none', 'full', c.expires_at FROM public.invite_link_claims c
WHERE c.expires_at > now()
ON CONFLICT (user_id) DO UPDATE SET override_level = 'full',
  override_expires_at = GREATEST(COALESCE(public.entitlements.override_expires_at, EXCLUDED.override_expires_at), EXCLUDED.override_expires_at), updated_at = now();