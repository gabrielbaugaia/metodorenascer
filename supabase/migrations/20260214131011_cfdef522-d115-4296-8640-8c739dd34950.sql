
-- MQO Module: Independent tables for Laboratório de Prescrição

-- Table: mqo_clients
CREATE TABLE public.mqo_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  summary text,
  objectives text,
  strengths text,
  attention_points text,
  suggested_strategy text,
  trainer_direction text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mqo_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mqo_clients"
  ON public.mqo_clients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mqo_clients_updated_at
  BEFORE UPDATE ON public.mqo_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: mqo_materials
CREATE TABLE public.mqo_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.mqo_clients(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mqo_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mqo_materials"
  ON public.mqo_materials FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Table: mqo_protocols
CREATE TABLE public.mqo_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.mqo_clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('treino', 'dieta', 'mentalidade')),
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'editado', 'publicado')),
  generation_options jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mqo_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mqo_protocols"
  ON public.mqo_protocols FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mqo_protocols_updated_at
  BEFORE UPDATE ON public.mqo_protocols
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: mqo_protocol_versions
CREATE TABLE public.mqo_protocol_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES public.mqo_protocols(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  content jsonb NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mqo_protocol_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mqo_protocol_versions"
  ON public.mqo_protocol_versions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for MQO materials
INSERT INTO storage.buckets (id, name, public) VALUES ('mqo-materials', 'mqo-materials', false);

-- Storage RLS: admin only
CREATE POLICY "Admins can manage mqo materials"
  ON storage.objects FOR ALL
  USING (bucket_id = 'mqo-materials' AND public.has_role(auth.uid(), 'admin'));
