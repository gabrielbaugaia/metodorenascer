CREATE FUNCTION public.hyrox_save_draft(_id uuid,_title text,_start date,_config jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE p public.hyrox_programs; delta integer; BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Trainer required'; END IF;
 SELECT * INTO p FROM public.hyrox_programs WHERE id=_id FOR UPDATE;
 IF p.id IS NULL OR p.status<>'draft' THEN RAISE EXCEPTION 'Editable draft required'; END IF;
 IF _title IS NULL OR trim(_title)='' OR _start IS NULL OR jsonb_typeof(_config)<>'object' THEN RAISE EXCEPTION 'Invalid draft'; END IF;
 delta=_start-p.start_date;
 UPDATE public.hyrox_programs SET title=_title,start_date=_start,config=_config WHERE id=_id;
 IF delta<>0 THEN UPDATE public.hyrox_activities SET planned_date=planned_date+delta WHERE program_id=_id AND status='planned'; END IF;
 RETURN _id; END $$;
REVOKE ALL ON FUNCTION public.hyrox_save_draft(uuid,text,date,jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.hyrox_save_draft(uuid,text,date,jsonb) TO authenticated;
CREATE FUNCTION public.hyrox_calendar_lock() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN PERFORM pg_advisory_xact_lock(hashtextextended(NEW.program_id::text,0)); IF EXISTS(SELECT 1 FROM public.hyrox_activities WHERE program_id=NEW.program_id AND planned_date=NEW.planned_date AND planned_time IS NOT DISTINCT FROM NEW.planned_time AND kind=NEW.kind AND workout_key IS NOT DISTINCT FROM NEW.workout_key) THEN RAISE EXCEPTION 'Session already planned'; END IF; RETURN NEW; END $$;
CREATE TRIGGER hyrox_calendar_lock BEFORE INSERT ON public.hyrox_activities FOR EACH ROW EXECUTE FUNCTION public.hyrox_calendar_lock();