
-- Recriar v_mrr_summary: só contar quem tem stripe_subscription_id
CREATE OR REPLACE VIEW public.v_mrr_summary AS
SELECT COALESCE(plan_name, plan_type) AS plan_name,
    count(*) AS active_subscriptions,
    sum(mrr_value) AS total_mrr,
    avg(mrr_value) AS avg_mrr
   FROM subscriptions
  WHERE status = 'active' AND stripe_subscription_id IS NOT NULL
  GROUP BY (COALESCE(plan_name, plan_type));

-- Recriar v_metrics_by_channel: só contar pagantes reais
CREATE OR REPLACE VIEW public.v_metrics_by_channel AS
SELECT p.acquisition_channel,
    count(DISTINCT p.id) AS total_users,
    count(DISTINCT
        CASE
            WHEN s.status = 'active' AND s.stripe_subscription_id IS NOT NULL THEN s.user_id
            ELSE NULL::uuid
        END) AS active_subscribers,
    sum(
        CASE
            WHEN s.status = 'active' AND s.stripe_subscription_id IS NOT NULL THEN s.mrr_value
            ELSE 0::numeric
        END) AS total_mrr,
    count(DISTINCT
        CASE
            WHEN s.canceled_at IS NOT NULL AND s.stripe_subscription_id IS NOT NULL THEN s.user_id
            ELSE NULL::uuid
        END) AS churned_users
   FROM profiles p
     LEFT JOIN subscriptions s ON p.id = s.user_id
  WHERE p.acquisition_channel IS NOT NULL
  GROUP BY p.acquisition_channel;

-- Recriar v_retention_cohorts: só rastrear quem pagou
CREATE OR REPLACE VIEW public.v_retention_cohorts AS
SELECT date_trunc('month', started_at) AS cohort_month,
    count(*) AS total_started,
    count(
        CASE
            WHEN canceled_at IS NULL OR canceled_at > (started_at + '1 mon'::interval) THEN 1
            ELSE NULL::integer
        END) AS retained_1m,
    count(
        CASE
            WHEN canceled_at IS NULL OR canceled_at > (started_at + '3 mons'::interval) THEN 1
            ELSE NULL::integer
        END) AS retained_3m,
    count(
        CASE
            WHEN canceled_at IS NULL OR canceled_at > (started_at + '6 mons'::interval) THEN 1
            ELSE NULL::integer
        END) AS retained_6m
   FROM subscriptions
  WHERE started_at IS NOT NULL AND stripe_subscription_id IS NOT NULL
  GROUP BY (date_trunc('month', started_at))
  ORDER BY (date_trunc('month', started_at)) DESC;
