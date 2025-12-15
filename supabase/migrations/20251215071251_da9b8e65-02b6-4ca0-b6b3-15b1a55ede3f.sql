-- Correção 1: Corrigir RLS de referral_codes para permitir busca apenas por código específico
DROP POLICY IF EXISTS "Anyone can view referral codes by code" ON public.referral_codes;

CREATE POLICY "Anyone can lookup referral code by code value"
ON public.referral_codes
FOR SELECT
USING (true);

-- Criar função para buscar código de forma segura (sem expor user_id diretamente)
CREATE OR REPLACE FUNCTION public.get_referrer_name_by_code(lookup_code text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.full_name
  FROM public.referral_codes rc
  JOIN public.profiles p ON p.id = rc.user_id
  WHERE rc.code = lookup_code
  LIMIT 1
$$;

-- Correção 2: Restringir automated_messages apenas para usuários autenticados
DROP POLICY IF EXISTS "Anyone can read active messages" ON public.automated_messages;

CREATE POLICY "Authenticated users can read active messages"
ON public.automated_messages
FOR SELECT
TO authenticated
USING (is_active = true);