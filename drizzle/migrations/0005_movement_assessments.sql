CREATE TABLE public.movement_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessed_at date NOT NULL DEFAULT current_date,
  assessment_type text NOT NULL DEFAULT 'completa',
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  restrictions text,
  notes text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movement_assessments TO authenticated;
GRANT ALL ON public.movement_assessments TO service_role;
ALTER TABLE public.movement_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage movement assessments" ON public.movement_assessments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Students read own published movement" ON public.movement_assessments FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND status = 'published');
CREATE INDEX movement_assessments_user_idx ON public.movement_assessments(user_id, assessed_at DESC);
CREATE TRIGGER update_movement_assessments_updated_at BEFORE UPDATE ON public.movement_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.movement_assessment_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.movement_assessments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  position_key text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movement_assessment_media TO authenticated;
GRANT ALL ON public.movement_assessment_media TO service_role;
ALTER TABLE public.movement_assessment_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage movement media" ON public.movement_assessment_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins manage movement-media files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'movement-media' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'movement-media' AND public.has_role(auth.uid(),'admin'));