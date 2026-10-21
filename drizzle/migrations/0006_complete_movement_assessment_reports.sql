ALTER TABLE public.movement_assessments ADD COLUMN IF NOT EXISTS report jsonb, ADD COLUMN IF NOT EXISTS reviewed_at timestamptz, ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES public.profiles(id), ADD COLUMN IF NOT EXISTS supersedes_id uuid REFERENCES public.movement_assessments(id), ADD COLUMN IF NOT EXISTS root_id uuid REFERENCES public.movement_assessments(id), ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS correction_reason text;
ALTER TABLE public.movement_assessments ADD CONSTRAINT movement_status_valid CHECK (status IN ('draft','published')) NOT VALID;
CREATE TABLE public.movement_assessment_audit (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assessment_id uuid NOT NULL REFERENCES public.movement_assessments(id), actor_id uuid REFERENCES public.profiles(id), action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.movement_assessment_audit TO authenticated;
GRANT ALL ON public.movement_assessment_audit TO service_role;
ALTER TABLE public.movement_assessment_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read movement audit" ON public.movement_assessment_audit FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TABLE public.movement_analysis_access_state (id boolean PRIMARY KEY DEFAULT true CHECK (id), blocked_status integer, message text, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.movement_analysis_access_state TO service_role;
ALTER TABLE public.movement_analysis_access_state ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.movement_assessment_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE prev public.movement_assessments;
BEGIN
 IF TG_OP = 'DELETE' THEN
   IF OLD.status = 'published' OR EXISTS (SELECT 1 FROM public.movement_assessments WHERE supersedes_id = OLD.id) THEN RAISE EXCEPTION 'Avaliação publicada e histórico não podem ser excluídos'; END IF;
   RETURN OLD;
 END IF;
 IF TG_OP = 'UPDATE' THEN
   IF OLD.status = 'published' THEN RAISE EXCEPTION 'Avaliação publicada é imutável; crie uma correção'; END IF;
   IF NEW.user_id <> OLD.user_id OR NEW.supersedes_id IS DISTINCT FROM OLD.supersedes_id OR NEW.root_id IS DISTINCT FROM OLD.root_id OR NEW.version <> OLD.version THEN RAISE EXCEPTION 'Vínculo e versão não podem ser alterados'; END IF;
 ELSE
   NEW.created_by := auth.uid();
   IF NEW.supersedes_id IS NOT NULL THEN
     SELECT * INTO prev FROM public.movement_assessments WHERE id = NEW.supersedes_id;
     IF prev.id IS NULL OR prev.user_id <> NEW.user_id OR prev.status <> 'published' OR length(trim(coalesce(NEW.correction_reason,''))) < 5 THEN RAISE EXCEPTION 'Correção exige avaliação publicada do mesmo aluno e motivo'; END IF;
     NEW.root_id := coalesce(prev.root_id, prev.id); NEW.version := prev.version + 1;
   ELSE NEW.root_id := NEW.id; NEW.version := 1; END IF;
 END IF;
 IF jsonb_typeof(NEW.findings) <> 'array' THEN RAISE EXCEPTION 'Achados devem ser uma lista'; END IF;
 IF NEW.status = 'published' THEN
   IF NEW.report IS NOT NULL AND NEW.reviewed_at IS NULL THEN RAISE EXCEPTION 'Revise a análise antes de publicar'; END IF;
   NEW.published_at := now(); NEW.published_by := auth.uid();
 ELSE NEW.published_at := NULL; NEW.published_by := NULL; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER movement_guard BEFORE INSERT OR UPDATE OR DELETE ON public.movement_assessments FOR EACH ROW EXECUTE FUNCTION public.movement_assessment_guard();
CREATE OR REPLACE FUNCTION public.movement_audit_after() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.movement_assessment_audit(assessment_id,actor_id,action) VALUES (NEW.id,auth.uid(),CASE WHEN TG_OP='INSERT' THEN 'created' WHEN NEW.status='published' THEN 'published' ELSE 'updated' END); RETURN NEW; END $$;
CREATE TRIGGER movement_audit AFTER INSERT OR UPDATE ON public.movement_assessments FOR EACH ROW EXECUTE FUNCTION public.movement_audit_after();
CREATE OR REPLACE FUNCTION public.movement_media_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.movement_assessments; old_a public.movement_assessments;
BEGIN
 IF TG_OP <> 'INSERT' THEN SELECT * INTO old_a FROM public.movement_assessments WHERE id=OLD.assessment_id; IF old_a.status='published' THEN RAISE EXCEPTION 'Mídias publicadas são imutáveis'; END IF; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 SELECT * INTO a FROM public.movement_assessments WHERE id=NEW.assessment_id;
 IF a.id IS NULL OR a.status <> 'draft' OR a.user_id <> NEW.user_id THEN RAISE EXCEPTION 'Mídia exige rascunho do mesmo aluno'; END IF;
 IF NEW.kind NOT IN ('photo','video') OR NEW.storage_path NOT LIKE NEW.user_id::text || '/' || NEW.assessment_id::text || '/%' THEN RAISE EXCEPTION 'Tipo ou caminho de mídia inválido'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER movement_media_guard BEFORE INSERT OR UPDATE OR DELETE ON public.movement_assessment_media FOR EACH ROW EXECUTE FUNCTION public.movement_media_guard();
CREATE POLICY "Students read own published movement media" ON public.movement_assessment_media FOR SELECT TO authenticated USING (user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.movement_assessments a WHERE a.id=assessment_id AND a.user_id=auth.uid() AND a.status='published'));
DROP POLICY "Admins manage movement-media files" ON storage.objects;
CREATE POLICY "Admins read movement files" ON storage.objects FOR SELECT TO authenticated USING(bucket_id='movement-media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert draft movement files" ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='movement-media' AND public.has_role(auth.uid(),'admin') AND EXISTS(SELECT 1 FROM public.movement_assessments a WHERE a.id::text=(storage.foldername(name))[2] AND a.user_id::text=(storage.foldername(name))[1] AND a.status='draft'));
CREATE POLICY "Admins delete draft movement files" ON storage.objects FOR DELETE TO authenticated USING(bucket_id='movement-media' AND public.has_role(auth.uid(),'admin') AND EXISTS(SELECT 1 FROM public.movement_assessments a WHERE a.id::text=(storage.foldername(name))[2] AND a.user_id::text=(storage.foldername(name))[1] AND a.status='draft'));
CREATE POLICY "Students read published movement files" ON storage.objects FOR SELECT TO authenticated USING(bucket_id='movement-media' AND EXISTS(SELECT 1 FROM public.movement_assessment_media m JOIN public.movement_assessments a ON a.id=m.assessment_id WHERE m.storage_path=name AND m.user_id=auth.uid() AND a.user_id=auth.uid() AND a.status='published'));
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='movement_assessments') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.movement_assessments; END IF; END $$;