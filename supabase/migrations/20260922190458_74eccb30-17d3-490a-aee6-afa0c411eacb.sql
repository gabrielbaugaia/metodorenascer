CREATE TABLE public.prescription_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  muscle_locks jsonb NOT NULL DEFAULT '{}'::jsonb,
  locked_frequency integer,
  excluded_exercises text[] NOT NULL DEFAULT '{}',
  locked_exercises text[] NOT NULL DEFAULT '{}',
  deload_directive text CHECK (deload_directive IN ('forcar','ignorar')),
  baseline_plan jsonb,
  notes text,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescription_overrides TO authenticated;
GRANT ALL ON public.prescription_overrides TO service_role;
ALTER TABLE public.prescription_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage prescription overrides"
  ON public.prescription_overrides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_prescription_overrides_updated_at
  BEFORE UPDATE ON public.prescription_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.prescription_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'shadow',
  engine_version text,
  status text NOT NULL DEFAULT 'REQUER_REVISAO',
  review_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence text,
  inputs_snapshot jsonb,
  plan jsonb,
  previous_volume jsonb,
  proposed_volume jsonb,
  changes jsonb,
  alerts jsonb NOT NULL DEFAULT '[]'::jsonb,
  overrides_applied jsonb,
  trainer_decision text NOT NULL DEFAULT 'pendente',
  decision_note text,
  decided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  decided_at timestamptz,
  protocol_id uuid,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.prescription_runs TO authenticated;
GRANT ALL ON public.prescription_runs TO service_role;
ALTER TABLE public.prescription_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read prescription runs"
  ON public.prescription_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert prescription runs"
  ON public.prescription_runs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update prescription runs"
  ON public.prescription_runs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_prescription_runs_user_created ON public.prescription_runs (user_id, created_at DESC);
CREATE INDEX idx_prescription_runs_created ON public.prescription_runs (created_at DESC);