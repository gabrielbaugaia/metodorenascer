CREATE TABLE public.hyrox_programs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 title text NOT NULL, start_date date NOT NULL, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
 config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(config)='object'), supersedes_id uuid REFERENCES public.hyrox_programs(id),
 consent_at timestamptz NOT NULL, created_by uuid NOT NULL REFERENCES public.profiles(id), approved_by uuid REFERENCES public.profiles(id), approved_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK((status='draft' AND approved_at IS NULL AND approved_by IS NULL) OR (status='published' AND approved_at IS NOT NULL AND approved_by IS NOT NULL))
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.hyrox_programs TO authenticated; GRANT ALL ON public.hyrox_programs TO service_role;
ALTER TABLE public.hyrox_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY hyrox_programs_read ON public.hyrox_programs FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin') OR (user_id=auth.uid() AND status='published'));
CREATE POLICY hyrox_programs_insert ON public.hyrox_programs FOR INSERT TO authenticated WITH CHECK(public.has_role(auth.uid(),'admin') AND created_by=auth.uid());
CREATE POLICY hyrox_programs_update ON public.hyrox_programs FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'admin') AND status='draft') WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE POLICY hyrox_programs_delete ON public.hyrox_programs FOR DELETE TO authenticated USING(public.has_role(auth.uid(),'admin') AND status='draft');
CREATE INDEX hyrox_programs_user_idx ON public.hyrox_programs(user_id,created_at DESC);
CREATE FUNCTION public.hyrox_program_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF TG_OP='DELETE' THEN IF OLD.status='published' THEN RAISE EXCEPTION 'Approved protocols are immutable'; END IF; RETURN OLD; END IF;
 IF TG_OP='UPDATE' THEN IF OLD.status='published' THEN RAISE EXCEPTION 'Approved protocols are immutable'; END IF; IF NEW.user_id<>OLD.user_id OR NEW.created_by<>OLD.created_by OR NEW.supersedes_id IS DISTINCT FROM OLD.supersedes_id THEN RAISE EXCEPTION 'Protocol identity cannot change'; END IF; END IF;
 IF NEW.supersedes_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.hyrox_programs WHERE id=NEW.supersedes_id AND user_id=NEW.user_id AND status='published') THEN RAISE EXCEPTION 'Invalid previous version'; END IF;
 IF NEW.status='published' AND (NEW.approved_by IS DISTINCT FROM auth.uid() OR NOT public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Trainer approval required'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER hyrox_program_guard BEFORE INSERT OR UPDATE OR DELETE ON public.hyrox_programs FOR EACH ROW EXECUTE FUNCTION public.hyrox_program_guard();
CREATE TABLE public.hyrox_activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), program_id uuid NOT NULL REFERENCES public.hyrox_programs(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('strength','running','hyrox','recovery')), workout_key text, planned_date date NOT NULL, planned_time time,
 actual_date date, status text NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','completed','planned_absence')),
 duration_min numeric CHECK(duration_min>0), distance_km numeric CHECK(distance_km>0), pace text, heart_rate integer CHECK(heart_rate BETWEEN 20 AND 250),
 rpe numeric CHECK(rpe BETWEEN 0 AND 10), sleep_hours numeric CHECK(sleep_hours BETWEEN 0 AND 24), energy integer CHECK(energy BETWEEN 1 AND 5), fatigue integer CHECK(fatigue BETWEEN 1 AND 5),
 discomfort text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '', station_notes text NOT NULL DEFAULT '', set_entries jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(set_entries)='array'),
 updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), CHECK(status<>'completed' OR actual_date IS NOT NULL)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.hyrox_activities TO authenticated; GRANT ALL ON public.hyrox_activities TO service_role;
ALTER TABLE public.hyrox_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY hyrox_activities_read ON public.hyrox_activities FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.hyrox_programs p WHERE p.id=program_id AND (public.has_role(auth.uid(),'admin') OR (p.user_id=auth.uid() AND p.status='published'))));
CREATE POLICY hyrox_activities_insert ON public.hyrox_activities FOR INSERT TO authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.hyrox_programs p WHERE p.id=program_id AND (public.has_role(auth.uid(),'admin') OR (p.user_id=auth.uid() AND p.status='published'))));
CREATE POLICY hyrox_activities_update ON public.hyrox_activities FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM public.hyrox_programs p WHERE p.id=program_id AND (public.has_role(auth.uid(),'admin') OR (p.user_id=auth.uid() AND p.status='published')))) WITH CHECK(EXISTS(SELECT 1 FROM public.hyrox_programs p WHERE p.id=program_id AND (public.has_role(auth.uid(),'admin') OR (p.user_id=auth.uid() AND p.status='published'))));
CREATE POLICY hyrox_activities_delete ON public.hyrox_activities FOR DELETE TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE INDEX hyrox_activities_program_idx ON public.hyrox_activities(program_id,planned_date);
CREATE TABLE public.hyrox_activity_audit (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), activity_id uuid NOT NULL REFERENCES public.hyrox_activities(id) ON DELETE CASCADE, program_id uuid NOT NULL REFERENCES public.hyrox_programs(id) ON DELETE CASCADE, changed_by uuid REFERENCES public.profiles(id), snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.hyrox_activity_audit TO authenticated; GRANT ALL ON public.hyrox_activity_audit TO service_role;
ALTER TABLE public.hyrox_activity_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY hyrox_audit_read ON public.hyrox_activity_audit FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.hyrox_programs p WHERE p.id=program_id AND (public.has_role(auth.uid(),'admin') OR (p.user_id=auth.uid() AND p.status='published'))));
CREATE FUNCTION public.hyrox_activity_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE e jsonb; BEGIN
 IF TG_OP='UPDATE' THEN IF NEW.program_id<>OLD.program_id OR NEW.kind<>OLD.kind OR NEW.workout_key IS DISTINCT FROM OLD.workout_key THEN RAISE EXCEPTION 'Activity identity cannot change'; END IF; INSERT INTO public.hyrox_activity_audit(activity_id,program_id,changed_by,snapshot) VALUES(OLD.id,OLD.program_id,auth.uid(),to_jsonb(OLD)); END IF;
 FOR e IN SELECT * FROM jsonb_array_elements(NEW.set_entries) LOOP
 IF (e->>'weight')::numeric<0 OR (e->>'reps')::numeric<0 OR (e->>'rir')::numeric<0 OR (e->>'rir')::numeric>10 THEN RAISE EXCEPTION 'Invalid set values'; END IF; END LOOP;
 NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER hyrox_activity_guard BEFORE INSERT OR UPDATE ON public.hyrox_activities FOR EACH ROW EXECUTE FUNCTION public.hyrox_activity_guard();
CREATE TABLE public.hyrox_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), program_id uuid NOT NULL REFERENCES public.hyrox_programs(id) ON DELETE CASCADE,
 checkpoint integer NOT NULL CHECK(checkpoint IN (30,60,90)), responses jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(responses)='object'), submitted_at timestamptz,
 feedback text NOT NULL DEFAULT '', reviewed_at timestamptz, reviewed_by uuid REFERENCES public.profiles(id), UNIQUE(program_id,checkpoint)
);
GRANT SELECT,INSERT,UPDATE ON public.hyrox_reviews TO authenticated; GRANT ALL ON public.hyrox_reviews TO service_role;
ALTER TABLE public.hyrox_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY hyrox_reviews_read ON public.hyrox_reviews FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.hyrox_programs p WHERE p.id=program_id AND (public.has_role(auth.uid(),'admin') OR (p.user_id=auth.uid() AND p.status='published'))));
CREATE POLICY hyrox_reviews_insert ON public.hyrox_reviews FOR INSERT TO authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.hyrox_programs p WHERE p.id=program_id AND (public.has_role(auth.uid(),'admin') OR (p.user_id=auth.uid() AND p.status='published'))));
CREATE POLICY hyrox_reviews_update ON public.hyrox_reviews FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM public.hyrox_programs p WHERE p.id=program_id AND (public.has_role(auth.uid(),'admin') OR (p.user_id=auth.uid() AND p.status='published')))) WITH CHECK(EXISTS(SELECT 1 FROM public.hyrox_programs p WHERE p.id=program_id AND (public.has_role(auth.uid(),'admin') OR (p.user_id=auth.uid() AND p.status='published'))));
CREATE FUNCTION public.hyrox_review_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF TG_OP='UPDATE' AND (NEW.program_id<>OLD.program_id OR NEW.checkpoint<>OLD.checkpoint) THEN RAISE EXCEPTION 'Review identity cannot change'; END IF;
 IF NOT public.has_role(auth.uid(),'admin') THEN
 IF TG_OP='INSERT' AND (NEW.feedback<>'' OR NEW.reviewed_at IS NOT NULL OR NEW.reviewed_by IS NOT NULL) THEN RAISE EXCEPTION 'Trainer feedback is restricted'; END IF;
 IF TG_OP='UPDATE' AND (NEW.feedback IS DISTINCT FROM OLD.feedback OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by) THEN RAISE EXCEPTION 'Trainer feedback is restricted'; END IF;
 ELSE IF NEW.reviewed_at IS NOT NULL AND NEW.reviewed_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Invalid reviewer'; END IF; END IF; RETURN NEW; END $$;
CREATE TRIGGER hyrox_review_guard BEFORE INSERT OR UPDATE ON public.hyrox_reviews FOR EACH ROW EXECUTE FUNCTION public.hyrox_review_guard();
CREATE TABLE public.hyrox_coach_notes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),program_id uuid NOT NULL REFERENCES public.hyrox_programs(id) ON DELETE CASCADE,body text NOT NULL,created_by uuid NOT NULL REFERENCES public.profiles(id),created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT ON public.hyrox_coach_notes TO authenticated; GRANT ALL ON public.hyrox_coach_notes TO service_role;
ALTER TABLE public.hyrox_coach_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY hyrox_notes_read ON public.hyrox_coach_notes FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE POLICY hyrox_notes_insert ON public.hyrox_coach_notes FOR INSERT TO authenticated WITH CHECK(public.has_role(auth.uid(),'admin') AND created_by=auth.uid());
CREATE TABLE public.hyrox_documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),program_id uuid NOT NULL REFERENCES public.hyrox_programs(id) ON DELETE CASCADE,title text NOT NULL,author text NOT NULL,document_date date,category text NOT NULL CHECK(category IN ('anamnese','assessment','running','nutrition','guidance','historical','review_photo')),storage_path text NOT NULL UNIQUE,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,DELETE ON public.hyrox_documents TO authenticated; GRANT ALL ON public.hyrox_documents TO service_role;
ALTER TABLE public.hyrox_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY hyrox_documents_read ON public.hyrox_documents FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.hyrox_programs p WHERE p.id=program_id AND (public.has_role(auth.uid(),'admin') OR (p.user_id=auth.uid() AND p.status='published'))));
CREATE POLICY hyrox_documents_insert ON public.hyrox_documents FOR INSERT TO authenticated WITH CHECK(public.has_role(auth.uid(),'admin') OR (category='review_photo' AND EXISTS(SELECT 1 FROM public.hyrox_programs p WHERE p.id=program_id AND p.user_id=auth.uid() AND p.status='published') AND storage_path LIKE 'hyrox/'||auth.uid()::text||'/%'));
CREATE POLICY hyrox_documents_delete ON public.hyrox_documents FOR DELETE TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE INDEX hyrox_documents_program_idx ON public.hyrox_documents(program_id);
CREATE POLICY hyrox_private_documents_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='client-documents' AND EXISTS(SELECT 1 FROM public.hyrox_documents d JOIN public.hyrox_programs p ON p.id=d.program_id WHERE d.storage_path=name AND p.user_id=auth.uid() AND p.status='published'));
CREATE POLICY hyrox_student_photo_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='client-documents' AND (storage.foldername(name))[1]='hyrox' AND (storage.foldername(name))[2]=auth.uid()::text AND EXISTS(SELECT 1 FROM public.hyrox_programs p WHERE p.user_id=auth.uid() AND p.status='published'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.hyrox_programs,public.hyrox_reviews;
