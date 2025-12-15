-- Adiciona campos de horário de treino e sono na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS horario_treino TIME,
ADD COLUMN IF NOT EXISTS horario_acorda TIME,
ADD COLUMN IF NOT EXISTS horario_dorme TIME,
ADD COLUMN IF NOT EXISTS cashback_balance INTEGER DEFAULT 0;

-- Adicionar coluna de cashback para sistema de indicações
COMMENT ON COLUMN public.profiles.cashback_balance IS 'Saldo de cashback do cliente em centavos (10% por indicação)';