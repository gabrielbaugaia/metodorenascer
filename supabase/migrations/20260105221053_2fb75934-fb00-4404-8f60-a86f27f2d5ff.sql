-- ============================================
-- SISTEMA DE CONQUISTAS/BADGES E MINI CHECK-INS
-- ============================================

-- Tabela para tipos de conquistas disponíveis
CREATE TABLE public.achievement_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('streak', 'workout', 'checkin', 'milestone', 'special')),
  requirement_value INTEGER NOT NULL DEFAULT 1,
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir conquistas padrão
INSERT INTO public.achievement_types (id, name, description, icon, category, requirement_value, points) VALUES
('streak_3', '3 Dias Seguidos', 'Treinou 3 dias consecutivos', 'flame', 'streak', 3, 10),
('streak_7', 'Semana Perfeita', 'Treinou 7 dias consecutivos', 'flame', 'streak', 7, 25),
('streak_14', 'Guerreiro', '14 dias de treino sem parar', 'flame', 'streak', 14, 50),
('streak_30', 'Imparável', '30 dias consecutivos de treino', 'flame', 'streak', 30, 100),
('workout_10', '10 Treinos', 'Completou 10 treinos', 'dumbbell', 'workout', 10, 20),
('workout_25', '25 Treinos', 'Completou 25 treinos', 'dumbbell', 'workout', 25, 40),
('workout_50', '50 Treinos', 'Completou 50 treinos', 'dumbbell', 'workout', 50, 75),
('workout_100', 'Centenário', 'Completou 100 treinos', 'dumbbell', 'workout', 100, 150),
('checkin_1', 'Primeiro Passo', 'Realizou primeiro check-in de evolução', 'camera', 'checkin', 1, 15),
('checkin_3', 'Consistente', 'Realizou 3 check-ins de evolução', 'camera', 'checkin', 3, 30),
('checkin_6', 'Dedicado', 'Realizou 6 check-ins de evolução', 'camera', 'checkin', 6, 60),
('first_workout', 'Iniciante', 'Completou seu primeiro treino', 'star', 'milestone', 1, 10),
('first_week', 'Primeira Semana', 'Completou primeira semana no programa', 'calendar', 'milestone', 7, 20),
('first_month', 'Primeiro Mês', 'Completou primeiro mês no programa', 'trophy', 'milestone', 30, 50);

-- Tabela para conquistas desbloqueadas pelos usuários
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id TEXT NOT NULL REFERENCES public.achievement_types(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notified BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Tabela para streaks dos usuários
CREATE TABLE public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para mini check-ins semanais
CREATE TABLE public.weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  current_weight DECIMAL(5,2),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  adherence_level INTEGER CHECK (adherence_level BETWEEN 1 AND 5),
  mood TEXT CHECK (mood IN ('great', 'good', 'neutral', 'bad', 'terrible')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, week_number, year)
);

-- Enable RLS
ALTER TABLE public.achievement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies para achievement_types (leitura pública)
CREATE POLICY "Anyone can view achievement types"
  ON public.achievement_types FOR SELECT
  USING (true);

-- RLS Policies para user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all achievements"
  ON public.user_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies para user_streaks
CREATE POLICY "Users can view their own streaks"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
  ON public.user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON public.user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all streaks"
  ON public.user_streaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies para weekly_checkins
CREATE POLICY "Users can view their own weekly checkins"
  ON public.weekly_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly checkins"
  ON public.weekly_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly checkins"
  ON public.weekly_checkins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all weekly checkins"
  ON public.weekly_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );