CREATE OR REPLACE FUNCTION public.physical_assessments_delete_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status <> 'draft' AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Somente rascunhos podem ser descartados. Avaliações publicadas são preservadas.';
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER trg_physical_assessments_delete_guard BEFORE DELETE ON public.physical_assessments
FOR EACH ROW EXECUTE FUNCTION public.physical_assessments_delete_guard();