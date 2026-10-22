CREATE TABLE public.plan_promotions (
  slug text PRIMARY KEY,
  plan_slug text NOT NULL,
  promo_value_cents integer NOT NULL,
  slot_limit integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.plan_promotions TO authenticated;
GRANT ALL ON public.plan_promotions TO service_role;
ALTER TABLE public.plan_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read promotions" ON public.plan_promotions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update promotions" ON public.plan_promotions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.plan_promotion_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_slug text NOT NULL REFERENCES public.plan_promotions(slug),
  idempotency_key text NOT NULL UNIQUE,
  asaas_subscription_id text,
  status text NOT NULL DEFAULT 'reserved',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
GRANT SELECT ON public.plan_promotion_claims TO authenticated;
GRANT ALL ON public.plan_promotion_claims TO service_role;
ALTER TABLE public.plan_promotion_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read claims" ON public.plan_promotion_claims FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.promotion_used(_slug text) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.plan_promotion_claims
  WHERE promotion_slug = _slug AND (status = 'paid' OR (status = 'reserved' AND created_at > now() - interval '30 minutes'))
$$;

CREATE OR REPLACE FUNCTION public.get_promotion_status(_slug text)
RETURNS TABLE(active boolean, promo_value_cents integer, slot_limit integer, remaining integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.active AND public.promotion_used(p.slug) < p.slot_limit, p.promo_value_cents, p.slot_limit,
         greatest(p.slot_limit - public.promotion_used(p.slug), 0)
  FROM public.plan_promotions p WHERE p.slug = _slug
$$;
GRANT EXECUTE ON FUNCTION public.get_promotion_status(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.reserve_promotion_slot(_slug text, _key text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.plan_promotions;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('promo:' || _slug));
  IF EXISTS (SELECT 1 FROM plan_promotion_claims WHERE idempotency_key = _key) THEN RETURN true; END IF;
  SELECT * INTO p FROM plan_promotions WHERE slug = _slug;
  IF p.slug IS NULL OR NOT p.active OR public.promotion_used(_slug) >= p.slot_limit THEN RETURN false; END IF;
  INSERT INTO plan_promotion_claims(promotion_slug, idempotency_key) VALUES (_slug, _key);
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION public.reserve_promotion_slot(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promotion_used(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_promotion_slot(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.promotion_used(text) TO service_role;

INSERT INTO public.plan_promotions(slug, plan_slug, promo_value_cents, slot_limit, active)
VALUES ('start-97-20', 'start', 9700, 20, false);