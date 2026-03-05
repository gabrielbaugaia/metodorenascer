
-- Table: transformation_journeys
CREATE TABLE public.transformation_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  current_day integer NOT NULL DEFAULT 1,
  current_phase text NOT NULL DEFAULT 'installation',
  status text NOT NULL DEFAULT 'active',
  badges_earned jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transformation_journeys_user_id_key UNIQUE (user_id)
);

ALTER TABLE public.transformation_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journey" ON public.transformation_journeys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journey" ON public.transformation_journeys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journey" ON public.transformation_journeys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all journeys" ON public.transformation_journeys FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can manage journeys" ON public.transformation_journeys FOR ALL USING (true);

-- Table: food_logs
CREATE TABLE public.food_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  meal_type text NOT NULL,
  food_name text NOT NULL,
  calories numeric NOT NULL DEFAULT 0,
  protein_g numeric NOT NULL DEFAULT 0,
  carbs_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  portion_size text NOT NULL DEFAULT '100g',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food logs" ON public.food_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own food logs" ON public.food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own food logs" ON public.food_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own food logs" ON public.food_logs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all food logs" ON public.food_logs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Table: daily_nutrition_targets
CREATE TABLE public.daily_nutrition_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  calories_target numeric NOT NULL DEFAULT 2000,
  protein_target_g numeric NOT NULL DEFAULT 120,
  carbs_target_g numeric NOT NULL DEFAULT 200,
  fat_target_g numeric NOT NULL DEFAULT 65,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_nutrition_targets_user_id_key UNIQUE (user_id)
);

ALTER TABLE public.daily_nutrition_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own targets" ON public.daily_nutrition_targets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own targets" ON public.daily_nutrition_targets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own targets" ON public.daily_nutrition_targets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all targets" ON public.daily_nutrition_targets FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Table: foods_database
CREATE TABLE public.foods_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_name text NOT NULL,
  calories numeric NOT NULL DEFAULT 0,
  protein_g numeric NOT NULL DEFAULT 0,
  carbs_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  portion_size text NOT NULL DEFAULT '100g',
  category text NOT NULL DEFAULT 'geral'
);

ALTER TABLE public.foods_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view foods database" ON public.foods_database FOR SELECT USING (true);
CREATE POLICY "Admins can manage foods database" ON public.foods_database FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add nutrition_score column to sis_scores_daily
ALTER TABLE public.sis_scores_daily ADD COLUMN IF NOT EXISTS nutrition_score numeric;

-- Seed Brazilian foods
INSERT INTO public.foods_database (food_name, calories, protein_g, carbs_g, fat_g, portion_size, category) VALUES
('Arroz branco cozido', 130, 2.7, 28, 0.3, '100g', 'carboidratos'),
('Arroz integral cozido', 124, 2.6, 26, 1.0, '100g', 'carboidratos'),
('Feijão carioca cozido', 76, 4.8, 14, 0.5, '100g', 'leguminosas'),
('Feijão preto cozido', 77, 4.5, 14, 0.5, '100g', 'leguminosas'),
('Frango grelhado (peito)', 165, 31, 0, 3.6, '100g', 'proteínas'),
('Frango desfiado', 150, 25, 0, 5, '100g', 'proteínas'),
('Ovo cozido', 78, 6.3, 0.6, 5.3, '1 unidade', 'proteínas'),
('Ovo frito', 107, 6.3, 0.4, 9, '1 unidade', 'proteínas'),
('Batata doce cozida', 77, 0.6, 18, 0.1, '100g', 'carboidratos'),
('Batata inglesa cozida', 52, 1.2, 12, 0.1, '100g', 'carboidratos'),
('Banana prata', 98, 1.3, 26, 0.1, '1 unidade', 'frutas'),
('Banana nanica', 92, 1.4, 24, 0.1, '1 unidade', 'frutas'),
('Maçã', 56, 0.3, 15, 0.1, '1 unidade', 'frutas'),
('Mamão papaia', 40, 0.5, 10, 0.1, '100g', 'frutas'),
('Abacate', 96, 1.2, 6, 8.4, '100g', 'frutas'),
('Carne bovina magra grelhada', 219, 26, 0, 12, '100g', 'proteínas'),
('Carne moída refogada', 212, 24, 0, 12, '100g', 'proteínas'),
('Peixe tilápia grelhada', 128, 26, 0, 2.7, '100g', 'proteínas'),
('Atum em lata (light)', 116, 26, 0, 1, '100g', 'proteínas'),
('Sardinha em lata', 208, 25, 0, 11, '100g', 'proteínas'),
('Leite integral', 61, 3.2, 4.7, 3.3, '200ml', 'laticínios'),
('Leite desnatado', 35, 3.4, 5, 0.1, '200ml', 'laticínios'),
('Iogurte natural', 51, 4.1, 6.9, 0.7, '170g', 'laticínios'),
('Queijo branco (minas)', 264, 17, 3, 20, '100g', 'laticínios'),
('Queijo cottage', 98, 11, 3.4, 4.3, '100g', 'laticínios'),
('Pão francês', 150, 4.7, 29, 1.4, '1 unidade', 'carboidratos'),
('Pão integral', 69, 3.6, 12, 1.3, '1 fatia', 'carboidratos'),
('Tapioca', 68, 0, 17, 0, '1 unidade', 'carboidratos'),
('Aveia em flocos', 68, 2.7, 12, 1.4, '2 colheres', 'carboidratos'),
('Granola', 196, 5, 32, 6, '50g', 'carboidratos'),
('Brócolis cozido', 35, 2.4, 7, 0.4, '100g', 'vegetais'),
('Espinafre cozido', 23, 2.9, 3.6, 0.3, '100g', 'vegetais'),
('Cenoura crua', 34, 0.7, 8, 0.1, '100g', 'vegetais'),
('Tomate', 18, 0.9, 3.9, 0.2, '100g', 'vegetais'),
('Alface', 14, 1.2, 2.3, 0.2, '100g', 'vegetais'),
('Azeite de oliva', 119, 0, 0, 14, '1 colher', 'gorduras'),
('Castanha do Pará', 185, 4, 3.5, 19, '30g (3 unidades)', 'gorduras'),
('Amendoim torrado', 170, 7, 5, 14, '30g', 'gorduras'),
('Pasta de amendoim', 94, 4, 3, 8, '1 colher', 'gorduras'),
('Whey protein', 120, 24, 3, 1.5, '1 scoop (30g)', 'suplementos'),
('Creatina', 0, 0, 0, 0, '5g', 'suplementos'),
('Mandioca cozida', 125, 0.6, 30, 0.3, '100g', 'carboidratos'),
('Cuscuz', 112, 1.5, 25, 0.2, '100g', 'carboidratos'),
('Macarrão cozido', 102, 3.5, 20, 0.6, '100g', 'carboidratos'),
('Linguiça de frango grelhada', 137, 14, 1, 8.5, '1 unidade', 'proteínas'),
('Presunto de peru', 26, 4.5, 0.6, 0.7, '1 fatia', 'proteínas'),
('Abóbora cozida', 29, 0.8, 7, 0.1, '100g', 'vegetais'),
('Inhame cozido', 97, 2, 23, 0.1, '100g', 'carboidratos'),
('Mel', 64, 0, 17, 0, '1 colher', 'outros'),
('Açaí puro', 58, 0.8, 6.2, 3.9, '100g', 'frutas');
