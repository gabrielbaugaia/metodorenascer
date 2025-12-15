-- 1. Adicionar campos ao profiles (se não existirem)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS objective_primary text,
ADD COLUMN IF NOT EXISTS training_level text,
ADD COLUMN IF NOT EXISTS training_location text,
ADD COLUMN IF NOT EXISTS acquisition_channel text;

-- 2. Adicionar campos ao subscriptions (se não existirem)
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS plan_name text,
ADD COLUMN IF NOT EXISTS mrr_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS canceled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payments_count integer DEFAULT 0;

-- 3. Criar tabela de eventos para analytics
CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  page_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index para queries de analytics
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON public.events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_page_name ON public.events(page_name);

-- RLS para events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Permitir inserção para usuários autenticados e anônimos (para tracking na landing)
CREATE POLICY "Anyone can insert events" ON public.events
  FOR INSERT WITH CHECK (true);

-- Apenas admins podem ler eventos
CREATE POLICY "Admins can view all events" ON public.events
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Criar tabela engagement_summary
CREATE TABLE IF NOT EXISTS public.engagement_summary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  logins_last_30d integer DEFAULT 0,
  workouts_completed_last_30d integer DEFAULT 0,
  protocols_generated_last_30d integer DEFAULT 0,
  mindset_tasks_completed_last_30d integer DEFAULT 0,
  status_engagement text DEFAULT 'ativo',
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engagement_user_id ON public.engagement_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_status ON public.engagement_summary(status_engagement);

-- RLS para engagement_summary
ALTER TABLE public.engagement_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own engagement" ON public.engagement_summary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all engagement" ON public.engagement_summary
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage engagement" ON public.engagement_summary
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can upsert engagement" ON public.engagement_summary
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update engagement" ON public.engagement_summary
  FOR UPDATE USING (true);

-- 5. Função para recalcular engagement_summary de um usuário
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
BEGIN
  -- Contar logins nos últimos 30 dias
  SELECT COUNT(*) INTO v_logins
  FROM events
  WHERE user_id = target_user_id
    AND event_name = 'app_open'
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Contar treinos completados nos últimos 30 dias
  SELECT COUNT(*) INTO v_workouts
  FROM workout_completions
  WHERE user_id = target_user_id
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Contar protocolos gerados nos últimos 30 dias
  SELECT COUNT(*) INTO v_protocols
  FROM protocolos
  WHERE user_id = target_user_id
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Último login
  SELECT MAX(created_at) INTO v_last_login
  FROM events
  WHERE user_id = target_user_id
    AND event_name = 'app_open';

  -- Determinar status de engajamento
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

  -- Upsert no engagement_summary
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

-- 6. Views para métricas de dashboard

-- View: MRR total e por plano
CREATE OR REPLACE VIEW public.v_mrr_summary AS
SELECT 
  COALESCE(plan_name, plan_type) as plan_name,
  COUNT(*) as active_subscriptions,
  SUM(mrr_value) as total_mrr,
  AVG(mrr_value) as avg_mrr
FROM subscriptions
WHERE status = 'active'
GROUP BY COALESCE(plan_name, plan_type);

-- View: Funil de conversão (últimos 30 dias)
CREATE OR REPLACE VIEW public.v_conversion_funnel AS
SELECT
  (SELECT COUNT(*) FROM events WHERE event_name = 'page_view' AND page_name = 'landing' AND created_at >= NOW() - INTERVAL '30 days') as landing_views,
  (SELECT COUNT(*) FROM events WHERE event_name = 'plan_view' AND created_at >= NOW() - INTERVAL '30 days') as plan_views,
  (SELECT COUNT(*) FROM events WHERE event_name = 'checkout_started' AND created_at >= NOW() - INTERVAL '30 days') as checkout_started,
  (SELECT COUNT(*) FROM events WHERE event_name = 'checkout_completed' AND created_at >= NOW() - INTERVAL '30 days') as checkout_completed;

-- View: Páginas mais acessadas
CREATE OR REPLACE VIEW public.v_top_pages AS
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

-- View: Engajamento médio por status
CREATE OR REPLACE VIEW public.v_engagement_by_status AS
SELECT 
  status_engagement,
  COUNT(*) as user_count,
  AVG(workouts_completed_last_30d) as avg_workouts,
  AVG(logins_last_30d) as avg_logins
FROM engagement_summary
GROUP BY status_engagement;

-- View: Métricas por canal de aquisição
CREATE OR REPLACE VIEW public.v_metrics_by_channel AS
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

-- View: Retenção por coorte (mês de início)
CREATE OR REPLACE VIEW public.v_retention_cohorts AS
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