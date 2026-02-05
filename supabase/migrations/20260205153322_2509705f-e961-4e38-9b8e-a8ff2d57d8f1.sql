-- 1. Tabela de planos comerciais
CREATE TABLE public.commercial_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  stripe_price_id text,
  period_months integer DEFAULT 1,
  modules_access jsonb NOT NULL DEFAULT '{}',
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Tabela de campanhas de trial
CREATE TABLE public.trial_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration_days integer NOT NULL DEFAULT 7,
  is_active boolean DEFAULT false,
  module_limits jsonb NOT NULL DEFAULT '{}',
  max_participants integer,
  current_participants integer DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Tabela de acesso por modulo do usuario
CREATE TABLE public.user_module_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  access_level text NOT NULL DEFAULT 'none',
  limits jsonb DEFAULT '{}',
  usage_count integer DEFAULT 0,
  trial_campaign_id uuid REFERENCES public.trial_campaigns(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module)
);

-- 4. Adicionar commercial_plan_id na subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS commercial_plan_id uuid REFERENCES public.commercial_plans(id);

-- 5. Indices para performance
CREATE INDEX idx_user_module_access_user ON public.user_module_access(user_id);
CREATE INDEX idx_user_module_access_module ON public.user_module_access(user_id, module);
CREATE INDEX idx_commercial_plans_active ON public.commercial_plans(is_active);
CREATE INDEX idx_trial_campaigns_active ON public.trial_campaigns(is_active);

-- 6. RLS
ALTER TABLE public.commercial_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_access ENABLE ROW LEVEL SECURITY;

-- Politicas para commercial_plans
CREATE POLICY "Anyone can view active plans" ON public.commercial_plans
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.commercial_plans
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politicas para trial_campaigns
CREATE POLICY "Anyone can view active campaigns" ON public.trial_campaigns
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage campaigns" ON public.trial_campaigns
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Politicas para user_module_access
CREATE POLICY "Users can view own access" ON public.user_module_access
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all access" ON public.user_module_access
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage access" ON public.user_module_access
FOR ALL USING (true);

-- 7. Inserir planos comerciais iniciais
INSERT INTO public.commercial_plans (slug, name, description, price_cents, modules_access, features, sort_order, is_popular) VALUES
('treino', 'Treino', 'Acesso ao plano de treino personalizado', 9700, 
  '{"treino": "full", "dashboard": "full", "checkins": "full", "suporte": "full", "nutricao": "none", "mindset": "none", "receitas": "none"}',
  '["Treino personalizado por IA", "Dashboard de progresso", "Check-ins semanais", "Suporte via chat"]', 1, false),
  
('treino_dieta', 'Treino + Dieta', 'Treino e plano nutricional completo', 14700,
  '{"treino": "full", "nutricao": "full", "dashboard": "full", "checkins": "full", "suporte": "full", "mindset": "none", "receitas": "none"}',
  '["Treino personalizado por IA", "Plano nutricional completo", "Dashboard de progresso", "Check-ins semanais", "Suporte via chat"]', 2, true),
  
('completo', 'Completo', 'Acesso total a todos os modulos', 19700,
  '{"treino": "full", "nutricao": "full", "mindset": "full", "receitas": "full", "dashboard": "full", "checkins": "full", "suporte": "full", "protocolos": "full"}',
  '["Treino personalizado por IA", "Plano nutricional completo", "Mindset e desenvolvimento pessoal", "Gerador de receitas ilimitado", "Dashboard completo", "Suporte prioritario", "Atualizacoes futuras"]', 3, false),
  
('nutricao_receitas', 'Nutrição + Receitas', 'Foco em alimentação saudável', 12700,
  '{"nutricao": "full", "receitas": "full", "dashboard": "full", "checkins": "full", "suporte": "full", "treino": "none", "mindset": "none"}',
  '["Plano nutricional completo", "Gerador de receitas por IA", "Biblioteca alimentar", "Dashboard de progresso", "Suporte via chat"]', 4, false);

-- 8. Inserir campanha trial padrão (desativada)
INSERT INTO public.trial_campaigns (name, duration_days, is_active, module_limits) VALUES
('7 Dias Grátis', 7, false, 
  '{"treino": {"access_level": "limited", "max_workouts_visible": 1, "allow_pdf_download": false, "allow_history": false}, "nutricao": {"access_level": "limited", "max_meals_visible": 2, "show_full_plan": false, "allow_pdf_download": false}, "mindset": {"access_level": "limited", "max_modules_visible": 1}, "receitas": {"access_level": "limited", "max_recipes_per_day": 1, "total_recipes_allowed": 3}}');