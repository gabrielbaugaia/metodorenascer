ALTER TABLE public.protocolos ADD COLUMN IF NOT EXISTS prescription_meta jsonb;

ALTER TABLE public.workout_set_logs ADD COLUMN IF NOT EXISTS rir numeric;

CREATE TABLE IF NOT EXISTS public.prescription_engine_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  label text NOT NULL DEFAULT 'Configuração padrão',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.prescription_engine_config TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.prescription_engine_config TO authenticated;
GRANT ALL ON public.prescription_engine_config TO service_role;

ALTER TABLE public.prescription_engine_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read engine config"
ON public.prescription_engine_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage engine config"
ON public.prescription_engine_config FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_prescription_engine_config_updated_at
BEFORE UPDATE ON public.prescription_engine_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_workout_set_logs_user_created ON public.workout_set_logs (user_id, created_at DESC);