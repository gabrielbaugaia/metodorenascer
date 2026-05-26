
CREATE TABLE public.vo2max_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  protocolo text NOT NULL CHECK (protocolo IN ('cooper','bruce','astrand')),
  valor_ml_kg_min numeric(5,2) NOT NULL,
  classificacao text NOT NULL,
  test_date date NOT NULL DEFAULT CURRENT_DATE,
  local text,
  dados_brutos jsonb NOT NULL DEFAULT '{}'::jsonb,
  screenshot_url text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vo2max_tests_user_date ON public.vo2max_tests(user_id, test_date DESC);

ALTER TABLE public.vo2max_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own vo2max tests" ON public.vo2max_tests
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users insert own vo2max tests" ON public.vo2max_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own vo2max tests" ON public.vo2max_tests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own vo2max tests" ON public.vo2max_tests
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_vo2max_tests_updated
  BEFORE UPDATE ON public.vo2max_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
