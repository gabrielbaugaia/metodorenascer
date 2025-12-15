-- Remove a constraint antiga que não inclui 'mindset'
ALTER TABLE public.protocolos DROP CONSTRAINT IF EXISTS protocolos_tipo_check;

-- Cria nova constraint incluindo mindset
ALTER TABLE public.protocolos ADD CONSTRAINT protocolos_tipo_check 
CHECK (tipo IN ('treino', 'nutricao', 'mindset'));