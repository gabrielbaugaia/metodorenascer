-- Criar tabela para leads de captura
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  telefone text NOT NULL,
  email text NOT NULL,
  origem text DEFAULT 'lancamento',
  converted boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem ver todos os leads
CREATE POLICY "Admins can view all leads"
ON public.leads
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política: Admins podem gerenciar leads
CREATE POLICY "Admins can manage leads"
ON public.leads
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política: Qualquer pessoa pode inserir leads (público)
CREATE POLICY "Anyone can insert leads"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- Índice para buscas por email
CREATE INDEX idx_leads_email ON public.leads(email);

-- Índice para buscas por data
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);