ALTER TABLE public.vo2max_tests
  ADD COLUMN IF NOT EXISTS modo_execucao text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS estagio_max int,
  ADD COLUMN IF NOT EXISTS pausas int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notas_execucao text,
  ADD COLUMN IF NOT EXISTS screenshot_app_url text;