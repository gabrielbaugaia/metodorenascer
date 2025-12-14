-- Add new columns to profiles for complete anamnese
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS objetivo_principal TEXT,
ADD COLUMN IF NOT EXISTS ja_treinou_antes BOOLEAN,
ADD COLUMN IF NOT EXISTS local_treino TEXT,
ADD COLUMN IF NOT EXISTS dias_disponiveis TEXT,
ADD COLUMN IF NOT EXISTS nivel_condicionamento TEXT,
ADD COLUMN IF NOT EXISTS pratica_aerobica BOOLEAN,
ADD COLUMN IF NOT EXISTS escada_sem_cansar TEXT,
ADD COLUMN IF NOT EXISTS condicoes_saude TEXT,
ADD COLUMN IF NOT EXISTS toma_medicamentos BOOLEAN,
ADD COLUMN IF NOT EXISTS refeicoes_por_dia TEXT,
ADD COLUMN IF NOT EXISTS bebe_agua_frequente BOOLEAN,
ADD COLUMN IF NOT EXISTS restricoes_alimentares TEXT,
ADD COLUMN IF NOT EXISTS qualidade_sono TEXT,
ADD COLUMN IF NOT EXISTS nivel_estresse TEXT,
ADD COLUMN IF NOT EXISTS consome_alcool TEXT,
ADD COLUMN IF NOT EXISTS fuma TEXT,
ADD COLUMN IF NOT EXISTS foto_frente_url TEXT,
ADD COLUMN IF NOT EXISTS foto_lado_url TEXT,
ADD COLUMN IF NOT EXISTS foto_costas_url TEXT,
ADD COLUMN IF NOT EXISTS observacoes_adicionais TEXT,
ADD COLUMN IF NOT EXISTS anamnese_completa BOOLEAN DEFAULT FALSE;

-- Create storage bucket for body photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('body-photos', 'body-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for body-photos bucket
CREATE POLICY "Users can upload own body photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'body-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own body photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'body-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own body photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'body-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all body photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'body-photos' 
  AND public.has_role(auth.uid(), 'admin')
);