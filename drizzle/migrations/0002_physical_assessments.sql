CREATE TABLE public.physical_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  root_id uuid,
  version integer NOT NULL DEFAULT 1,
  supersedes_id uuid REFERENCES public.physical_assessments(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','unpublished','superseded')),
  assessed_at date NOT NULL,
  birth_date date,
  age_years integer,
  sex text CHECK (sex IN ('male','female')),
  weight_kg numeric,
  height_cm numeric,
  skinfolds jsonb NOT NULL DEFAULT '{}'::jsonb,
  circumferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb,
  calc_method text,
  calc_version text,
  notes text,
  recommendations text,
  correction_reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  published_by uuid
);
CREATE INDEX idx_phys_assess_user ON public.physical_assessments(user_id, assessed_at);
CREATE INDEX idx_phys_assess_root ON public.physical_assessments(root_id);

CREATE TABLE public.physical_assessment_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.physical_assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position text NOT NULL CHECK (position IN ('front','right','left','back')),
  storage_path text NOT NULL,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, position)
);

CREATE TABLE public.physical_assessment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.physical_assessments(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.physical_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.physical_assessment_photos TO authenticated;
GRANT SELECT ON public.physical_assessment_audit TO authenticated;
GRANT ALL ON public.physical_assessments TO service_role;
GRANT ALL ON public.physical_assessment_photos TO service_role;
GRANT ALL ON public.physical_assessment_audit TO service_role;

ALTER TABLE public.physical_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_assessment_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_assessment_audit ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.physical_assessments_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.root_id IS NULL THEN NEW.root_id := NEW.id; END IF;
    NEW.status := 'draft';
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
    NEW.published_at := NULL; NEW.published_by := NULL;
    RETURN NEW;
  END IF;
  -- UPDATE
  IF OLD.status <> 'draft' THEN
    IF NEW.assessed_at IS DISTINCT FROM OLD.assessed_at OR NEW.birth_date IS DISTINCT FROM OLD.birth_date
      OR NEW.age_years IS DISTINCT FROM OLD.age_years OR NEW.sex IS DISTINCT FROM OLD.sex
      OR NEW.weight_kg IS DISTINCT FROM OLD.weight_kg OR NEW.height_cm IS DISTINCT FROM OLD.height_cm
      OR NEW.skinfolds IS DISTINCT FROM OLD.skinfolds OR NEW.circumferences IS DISTINCT FROM OLD.circumferences
      OR NEW.results IS DISTINCT FROM OLD.results OR NEW.notes IS DISTINCT FROM OLD.notes
      OR NEW.recommendations IS DISTINCT FROM OLD.recommendations OR NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.root_id IS DISTINCT FROM OLD.root_id OR NEW.version IS DISTINCT FROM OLD.version THEN
      RAISE EXCEPTION 'Avaliação publicada é imutável. Crie uma nova versão para corrigir.';
    END IF;
    IF NEW.status = 'draft' THEN
      RAISE EXCEPTION 'Avaliação publicada não volta a rascunho. Crie uma nova versão.';
    END IF;
    NEW.published_at := OLD.published_at; NEW.published_by := OLD.published_by;
  ELSE
    NEW.user_id := OLD.user_id; NEW.root_id := OLD.root_id; NEW.version := OLD.version;
    IF NEW.status = 'published' THEN
      IF NEW.results IS NULL THEN RAISE EXCEPTION 'Calcule a avaliação antes de publicar.'; END IF;
      NEW.published_at := now(); NEW.published_by := auth.uid();
    ELSIF NEW.status <> 'draft' THEN
      RAISE EXCEPTION 'Rascunho só pode ser publicado.';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_physical_assessments_guard BEFORE INSERT OR UPDATE ON public.physical_assessments
FOR EACH ROW EXECUTE FUNCTION public.physical_assessments_guard();

CREATE OR REPLACE FUNCTION public.physical_assessments_after()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO physical_assessment_audit(assessment_id, action, actor, details)
    VALUES (NEW.id, CASE WHEN NEW.supersedes_id IS NULL THEN 'created' ELSE 'correction_created' END, auth.uid(),
      jsonb_build_object('version', NEW.version, 'supersedes_id', NEW.supersedes_id, 'reason', NEW.correction_reason));
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO physical_assessment_audit(assessment_id, action, actor, details)
    VALUES (NEW.id, 'status:' || NEW.status, auth.uid(), jsonb_build_object('from', OLD.status));
    IF NEW.status = 'published' AND NEW.supersedes_id IS NOT NULL THEN
      UPDATE physical_assessments SET status = 'superseded'
      WHERE id = NEW.supersedes_id AND status IN ('published','unpublished');
    END IF;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_physical_assessments_after AFTER INSERT OR UPDATE ON public.physical_assessments
FOR EACH ROW EXECUTE FUNCTION public.physical_assessments_after();

CREATE OR REPLACE FUNCTION public.physical_assessment_photos_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status text; v_user uuid;
BEGIN
  SELECT status, user_id INTO v_status, v_user FROM physical_assessments
  WHERE id = COALESCE(NEW.assessment_id, OLD.assessment_id);
  IF v_status IS NOT NULL AND v_status <> 'draft' THEN
    RAISE EXCEPTION 'Fotos de avaliação publicada são imutáveis.';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  NEW.user_id := v_user;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_physical_assessment_photos_guard BEFORE INSERT OR UPDATE OR DELETE ON public.physical_assessment_photos
FOR EACH ROW EXECUTE FUNCTION public.physical_assessment_photos_guard();

CREATE POLICY "Admins manage assessments" ON public.physical_assessments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students read own published assessments" ON public.physical_assessments FOR SELECT TO authenticated
USING (user_id = auth.uid() AND status = 'published');

CREATE POLICY "Admins manage assessment photos" ON public.physical_assessment_photos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students read own published photos" ON public.physical_assessment_photos FOR SELECT TO authenticated
USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.physical_assessments a WHERE a.id = assessment_id AND a.status = 'published'));

CREATE POLICY "Admins read assessment audit" ON public.physical_assessment_audit FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage assessment photo files" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'assessment-photos' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'assessment-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students read own published assessment photo files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'assessment-photos' AND EXISTS (
  SELECT 1 FROM public.physical_assessment_photos p
  JOIN public.physical_assessments a ON a.id = p.assessment_id
  WHERE p.storage_path = storage.objects.name AND p.user_id = auth.uid() AND a.status = 'published'));