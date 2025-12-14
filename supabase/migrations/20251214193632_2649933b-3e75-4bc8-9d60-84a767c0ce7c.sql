-- Enum for client/subscription status
CREATE TYPE public.client_status AS ENUM ('active', 'paused', 'blocked', 'canceled');

-- Table for AI-generated protocols (training/nutrition)
CREATE TABLE public.protocolos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('treino', 'nutricao', 'receita')),
  titulo TEXT NOT NULL,
  conteudo JSONB NOT NULL,
  data_geracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.protocolos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own protocols"
ON public.protocolos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all protocols"
ON public.protocolos FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all protocols"
ON public.protocolos FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own protocols"
ON public.protocolos FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Table for AI chat conversations
CREATE TABLE public.conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagens JSONB NOT NULL DEFAULT '[]'::jsonb,
  tipo TEXT DEFAULT 'suporte' CHECK (tipo IN ('suporte', 'mentor', 'receitas')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
ON public.conversas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
ON public.conversas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON public.conversas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations"
ON public.conversas FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all conversations"
ON public.conversas FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add client_status to profiles for admin control
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_status client_status DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sexo TEXT CHECK (sexo IN ('masculino', 'feminino', 'outro'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS restricoes_medicas TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nivel_experiencia TEXT CHECK (nivel_experiencia IN ('iniciante', 'intermediario', 'avancado'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS objetivos_detalhados JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medidas JSONB;

-- Table for weekly check-ins
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peso_atual NUMERIC,
  medidas JSONB,
  notas TEXT,
  foto_url TEXT,
  semana_numero INTEGER,
  data_checkin TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins"
ON public.checkins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins"
ON public.checkins FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all checkins"
ON public.checkins FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversas;

-- Trigger for updated_at
CREATE TRIGGER update_protocolos_updated_at
BEFORE UPDATE ON public.protocolos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversas_updated_at
BEFORE UPDATE ON public.conversas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();