-- Adicionar coluna de foto de perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT;