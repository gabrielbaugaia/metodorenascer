ALTER TABLE public.hyrox_activities DROP CONSTRAINT IF EXISTS hyrox_activities_kind_check;
ALTER TABLE public.hyrox_activities ADD CONSTRAINT hyrox_activities_kind_check CHECK(kind IN ('strength','running','hyrox','recovery','checkin'));
ALTER TABLE public.hyrox_activities ADD COLUMN weight_kg numeric CHECK(weight_kg BETWEEN 20 AND 400), ADD COLUMN recovery integer CHECK(recovery BETWEEN 1 AND 5), ADD COLUMN difficulty integer CHECK(difficulty BETWEEN 1 AND 5), ADD COLUMN sleep_quality integer CHECK(sleep_quality BETWEEN 1 AND 5), ADD COLUMN station_entries jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(station_entries)='array');
ALTER TABLE public.hyrox_reviews ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','submitted','in_review','updated'));
UPDATE public.hyrox_reviews SET status=CASE WHEN reviewed_at IS NOT NULL THEN 'updated' WHEN submitted_at IS NOT NULL THEN 'submitted' ELSE 'pending' END;
ALTER TABLE public.hyrox_programs ADD COLUMN triage_confirmed_at timestamptz, ADD COLUMN triage_confirmed_by uuid REFERENCES public.profiles(id);
CREATE OR REPLACE FUNCTION public.hyrox_program_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF TG_OP='DELETE' THEN IF OLD.status='published' THEN RAISE EXCEPTION 'Approved protocols are immutable'; END IF; RETURN OLD; END IF;
 IF TG_OP='UPDATE' THEN
  IF OLD.status='published' THEN
   IF public.has_role(auth.uid(),'admin') AND (to_jsonb(NEW)-'triage_confirmed_at'-'triage_confirmed_by')=(to_jsonb(OLD)-'triage_confirmed_at'-'triage_confirmed_by') AND (NEW.triage_confirmed_at IS NULL OR NEW.triage_confirmed_by=auth.uid()) THEN RETURN NEW; END IF;
   RAISE EXCEPTION 'Approved protocols are immutable'; END IF;
  IF NEW.user_id<>OLD.user_id OR NEW.created_by<>OLD.created_by OR NEW.supersedes_id IS DISTINCT FROM OLD.supersedes_id THEN RAISE EXCEPTION 'Protocol identity cannot change'; END IF; END IF;
 IF NEW.supersedes_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.hyrox_programs WHERE id=NEW.supersedes_id AND user_id=NEW.user_id AND status='published') THEN RAISE EXCEPTION 'Invalid previous version'; END IF;
 IF NEW.status='published' AND (NEW.approved_by IS DISTINCT FROM auth.uid() OR NOT public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Trainer approval required'; END IF;
 RETURN NEW; END $$;
DROP POLICY hyrox_programs_update ON public.hyrox_programs;
CREATE POLICY hyrox_programs_update ON public.hyrox_programs FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.hyrox_date_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.hyrox_programs p WHERE p.id=NEW.program_id AND NEW.planned_date BETWEEN p.start_date AND p.start_date+COALESCE(NULLIF(p.config->>'duration_days','')::int,90)-1) THEN RAISE EXCEPTION 'Planned date must be within the protocol'; END IF; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.hyrox_review_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF TG_OP='UPDATE' AND (NEW.program_id<>OLD.program_id OR NEW.checkpoint<>OLD.checkpoint) THEN RAISE EXCEPTION 'Review identity cannot change'; END IF;
 IF NOT public.has_role(auth.uid(),'admin') THEN
 IF TG_OP='INSERT' AND (NEW.feedback<>'' OR NEW.reviewed_at IS NOT NULL OR NEW.reviewed_by IS NOT NULL OR NEW.status NOT IN ('pending','submitted')) THEN RAISE EXCEPTION 'Trainer feedback is restricted'; END IF;
 IF TG_OP='UPDATE' AND (NEW.feedback IS DISTINCT FROM OLD.feedback OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status<>'submitted') OR OLD.status IN ('in_review','updated')) THEN RAISE EXCEPTION 'Trainer feedback is restricted'; END IF;
 ELSE IF NEW.reviewed_at IS NOT NULL AND NEW.reviewed_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Invalid reviewer'; END IF; END IF; RETURN NEW; END $$;