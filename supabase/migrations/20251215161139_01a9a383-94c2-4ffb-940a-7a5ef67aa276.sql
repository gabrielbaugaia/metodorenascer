-- Corrigir views para usar SECURITY INVOKER (padrão seguro)
DROP VIEW IF EXISTS public.v_mrr_summary;
DROP VIEW IF EXISTS public.v_conversion_funnel;
DROP VIEW IF EXISTS public.v_top_pages;
DROP VIEW IF EXISTS public.v_engagement_by_status;
DROP VIEW IF EXISTS public.v_metrics_by_channel;
DROP VIEW IF EXISTS public.v_retention_cohorts;

-- Recriar views com SECURITY INVOKER explícito
CREATE VIEW public.v_mrr_summary 
WITH (security_invoker = on) AS
SELECT 
  COALESCE(plan_name, plan_type) as plan_name,
  COUNT(*) as active_subscriptions,
  SUM(mrr_value) as total_mrr,
  AVG(mrr_value) as avg_mrr
FROM subscriptions
WHERE status = 'active'
GROUP BY COALESCE(plan_name, plan_type);

CREATE VIEW public.v_conversion_funnel
WITH (security_invoker = on) AS
SELECT
  (SELECT COUNT(*) FROM events WHERE event_name = 'page_view' AND page_name = 'landing' AND created_at >= NOW() - INTERVAL '30 days') as landing_views,
  (SELECT COUNT(*) FROM events WHERE event_name = 'plan_view' AND created_at >= NOW() - INTERVAL '30 days') as plan_views,
  (SELECT COUNT(*) FROM events WHERE event_name = 'checkout_started' AND created_at >= NOW() - INTERVAL '30 days') as checkout_started,
  (SELECT COUNT(*) FROM events WHERE event_name = 'checkout_completed' AND created_at >= NOW() - INTERVAL '30 days') as checkout_completed;

CREATE VIEW public.v_top_pages
WITH (security_invoker = on) AS
SELECT 
  page_name,
  COUNT(*) as view_count,
  COUNT(DISTINCT user_id) as unique_visitors
FROM events
WHERE event_name = 'page_view'
  AND page_name IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY page_name
ORDER BY view_count DESC;

CREATE VIEW public.v_engagement_by_status
WITH (security_invoker = on) AS
SELECT 
  status_engagement,
  COUNT(*) as user_count,
  AVG(workouts_completed_last_30d) as avg_workouts,
  AVG(logins_last_30d) as avg_logins
FROM engagement_summary
GROUP BY status_engagement;

CREATE VIEW public.v_metrics_by_channel
WITH (security_invoker = on) AS
SELECT 
  p.acquisition_channel,
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.user_id END) as active_subscribers,
  SUM(CASE WHEN s.status = 'active' THEN s.mrr_value ELSE 0 END) as total_mrr,
  COUNT(DISTINCT CASE WHEN s.canceled_at IS NOT NULL THEN s.user_id END) as churned_users
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
WHERE p.acquisition_channel IS NOT NULL
GROUP BY p.acquisition_channel;

CREATE VIEW public.v_retention_cohorts
WITH (security_invoker = on) AS
SELECT 
  DATE_TRUNC('month', started_at) as cohort_month,
  COUNT(*) as total_started,
  COUNT(CASE WHEN canceled_at IS NULL OR canceled_at > started_at + INTERVAL '1 month' THEN 1 END) as retained_1m,
  COUNT(CASE WHEN canceled_at IS NULL OR canceled_at > started_at + INTERVAL '3 months' THEN 1 END) as retained_3m,
  COUNT(CASE WHEN canceled_at IS NULL OR canceled_at > started_at + INTERVAL '6 months' THEN 1 END) as retained_6m
FROM subscriptions
WHERE started_at IS NOT NULL
GROUP BY DATE_TRUNC('month', started_at)
ORDER BY cohort_month DESC;