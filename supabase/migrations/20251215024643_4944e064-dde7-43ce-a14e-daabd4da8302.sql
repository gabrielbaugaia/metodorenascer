-- Tabela de códigos de indicação
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de indicações realizadas
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_user_id UUID NOT NULL UNIQUE,
  discount_applied BOOLEAN DEFAULT false,
  discount_applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies para referral_codes
CREATE POLICY "Users can view own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view referral codes by code"
  ON public.referral_codes FOR SELECT
  USING (true);

-- Policies para referrals
CREATE POLICY "Users can view referrals they made"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage referrals"
  ON public.referrals FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar coluna de código de indicação usado no perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

-- Função para gerar código único de indicação
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Gera código alfanumérico de 8 caracteres
    new_code := upper(substr(md5(random()::text), 1, 8));
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Insere o código de indicação para o novo usuário
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, new_code)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar código automaticamente quando perfil é criado
CREATE TRIGGER on_profile_created_generate_referral
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();