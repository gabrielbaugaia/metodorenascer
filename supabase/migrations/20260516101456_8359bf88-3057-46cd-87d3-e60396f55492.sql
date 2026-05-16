
ALTER TABLE public.conversas DROP CONSTRAINT IF EXISTS conversas_tipo_check;
ALTER TABLE public.conversas ADD CONSTRAINT conversas_tipo_check
  CHECK (tipo = ANY (ARRAY['suporte'::text, 'mentor'::text, 'receitas'::text, 'whatsapp'::text]));
