CREATE TABLE public.invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  slot_limit integer NOT NULL DEFAULT 20 CHECK (slot_limit > 0),
  access_days integer NOT NULL DEFAULT 30 CHECK (access_days > 0),
  offer_days_before integer NOT NULL DEFAULT 5 CHECK (offer_days_before >= 0),
  offer_plan_slug text NOT NULL DEFAULT 'start',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invite_links TO authenticated;
GRANT ALL ON public.invite_links TO service_role;
ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invite links" ON public.invite_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.invite_link_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.invite_links(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.invite_link_claims TO authenticated;
GRANT ALL ON public.invite_link_claims TO service_role;
ALTER TABLE public.invite_link_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read claims" ON public.invite_link_claims FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_invite_link_status(_slug text)
RETURNS TABLE(label text, access_days integer, remaining integer, available boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.label, l.access_days,
    greatest(l.slot_limit - (SELECT count(*)::int FROM invite_link_claims c WHERE c.link_id = l.id), 0),
    l.active AND (SELECT count(*) FROM invite_link_claims c WHERE c.link_id = l.id) < l.slot_limit
  FROM invite_links l WHERE l.slug = _slug
$$;
GRANT EXECUTE ON FUNCTION public.get_invite_link_status(text) TO anon, authenticated;

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
  RETURN 'ok';
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_invite_link(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.claim_invite_link(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_invite_offer()
RETURNS TABLE(expires_at timestamptz, offer_starts_at timestamptz, offer_plan_slug text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.expires_at, c.expires_at - make_interval(days => l.offer_days_before), l.offer_plan_slug
  FROM invite_link_claims c JOIN invite_links l ON l.id = c.link_id WHERE c.user_id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION public.get_my_invite_offer() TO authenticated;