ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS treino_frequencia_semanal integer,
  ADD COLUMN IF NOT EXISTS treino_dias_semana text[],
  ADD COLUMN IF NOT EXISTS treino_duracao_sessao_min integer,
  ADD COLUMN IF NOT EXISTS treino_dias_consecutivos boolean,
  ADD COLUMN IF NOT EXISTS treino_max_sessoes_consecutivas integer,
  ADD COLUMN IF NOT EXISTS treino_prioridades jsonb,
  ADD COLUMN IF NOT EXISTS treino_equipamentos text[];

CREATE TABLE IF NOT EXISTS public.prescription_engine_config_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES public.prescription_engine_config(id) ON DELETE SET NULL,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL DEFAULT 'update',
  summary text,
  previous_config jsonb,
  new_config jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.prescription_engine_config_history TO authenticated;
GRANT ALL ON public.prescription_engine_config_history TO service_role;

ALTER TABLE public.prescription_engine_config_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view engine config history"
ON public.prescription_engine_config_history
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert engine config history"
ON public.prescription_engine_config_history
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND changed_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_engine_config_history_created ON public.prescription_engine_config_history(created_at DESC);