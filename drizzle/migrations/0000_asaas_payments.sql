CREATE TABLE public.payment_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  checkout_provider text NOT NULL DEFAULT 'stripe' CHECK (checkout_provider IN ('stripe','asaas')),
  grace_days int NOT NULL DEFAULT 3 CHECK (grace_days BETWEEN 0 AND 30),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.payment_settings (id) VALUES (1);
GRANT SELECT ON public.payment_settings TO anon, authenticated;
GRANT UPDATE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read settings" ON public.payment_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin update settings" ON public.payment_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.asaas_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  email text NOT NULL,
  asaas_customer_id text NOT NULL UNIQUE,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.asaas_customers (lower(email));
GRANT SELECT ON public.asaas_customers TO authenticated;
GRANT ALL ON public.asaas_customers TO service_role;
ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin" ON public.asaas_customers FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.asaas_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  asaas_customer_id text NOT NULL,
  asaas_subscription_id text UNIQUE,
  plan_slug text NOT NULL,
  plan_name text NOT NULL,
  value_cents int NOT NULL,
  cycle text NOT NULL DEFAULT 'MONTHLY',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','past_due','canceled')),
  paid_until timestamptz,
  next_due_date date,
  canceled_at timestamptz,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.asaas_subscriptions (user_id);
GRANT SELECT ON public.asaas_subscriptions TO authenticated;
GRANT ALL ON public.asaas_subscriptions TO service_role;
ALTER TABLE public.asaas_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin" ON public.asaas_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER upd_asaas_subs BEFORE UPDATE ON public.asaas_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.asaas_payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  asaas_payment_id text UNIQUE,
  asaas_subscription_id text,
  plan_slug text NOT NULL,
  value_cents int NOT NULL,
  billing_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  invoice_url text,
  due_date date,
  paid_at timestamptz,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.asaas_payment_orders (user_id);
CREATE INDEX ON public.asaas_payment_orders (asaas_subscription_id);
GRANT SELECT ON public.asaas_payment_orders TO authenticated;
GRANT ALL ON public.asaas_payment_orders TO service_role;
ALTER TABLE public.asaas_payment_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin" ON public.asaas_payment_orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER upd_asaas_orders BEFORE UPDATE ON public.asaas_payment_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.asaas_payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  asaas_payment_id text,
  asaas_subscription_id text,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  error text,
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.asaas_payment_events TO authenticated;
GRANT ALL ON public.asaas_payment_events TO service_role;
ALTER TABLE public.asaas_payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin only" ON public.asaas_payment_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));