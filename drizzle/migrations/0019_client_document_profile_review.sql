ALTER TABLE public.client_documents ADD COLUMN reviewed_profile jsonb NOT NULL DEFAULT '{}'::jsonb, ADD COLUMN profile_applied_at timestamptz;
CREATE OR REPLACE FUNCTION public.review_client_document(_id uuid, _summary text, _use boolean, _date date, _profile jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $fn$
DECLARE d public.client_documents; p public.profiles; k text; v jsonb; n numeric; m jsonb; applied jsonb := '{}'::jsonb; skipped jsonb := '[]'::jsonb;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Somente o administrador pode revisar documentos'; END IF;
 IF _summary IS NULL OR length(trim(_summary))=0 OR length(_summary)>30000 OR _use IS NULL THEN RAISE EXCEPTION 'Informe o resumo revisado'; END IF;
 IF _profile IS NULL OR jsonb_typeof(_profile)<>'object' THEN RAISE EXCEPTION 'Dados inválidos'; END IF;
 SELECT * INTO d FROM public.client_documents WHERE id=_id FOR UPDATE;
 IF d.id IS NULL THEN RAISE EXCEPTION 'Documento não encontrado'; END IF;
 IF d.status='processing' THEN RAISE EXCEPTION 'Aguarde a leitura terminar'; END IF;
 IF _profile<>'{}'::jsonb AND (_date IS NULL OR _date>current_date) THEN RAISE EXCEPTION 'Confirme a data das medidas'; END IF;
 SELECT * INTO p FROM public.profiles WHERE id=d.user_id FOR UPDATE;
 m:=CASE WHEN jsonb_typeof(p.medidas)='object' THEN p.medidas ELSE '{}'::jsonb END;
 FOR k,v IN SELECT * FROM jsonb_each(_profile) LOOP
  IF k NOT IN ('weight','height','age','sexo','body_fat_pct','fat_mass_kg','lean_mass_kg','waist_cm','abdomen_cm','hip_cm','thigh_right_cm','thigh_left_cm') THEN RAISE EXCEPTION 'Campo não permitido: %',k; END IF;
  IF k='sexo' THEN
   IF jsonb_typeof(v)<>'string' OR v#>>'{}' NOT IN ('masculino','feminino') THEN RAISE EXCEPTION 'Sexo inválido'; END IF;
  ELSE
   IF jsonb_typeof(v)<>'number' THEN RAISE EXCEPTION 'Valor numérico inválido: %',k; END IF;
   n:=(v#>>'{}')::numeric;
   IF n<=0 OR n>600 OR (k='height' AND (n<50 OR n>250)) OR (k='age' AND (n>120 OR n<>trunc(n))) OR (k='body_fat_pct' AND n>=100) THEN RAISE EXCEPTION 'Valor fora do intervalo: %',k; END IF;
  END IF;
  IF EXISTS(SELECT 1 FROM public.client_documents x WHERE x.user_id=d.user_id AND x.id<>d.id AND x.profile_applied_at IS NOT NULL AND x.document_date>_date AND x.reviewed_profile ? k) THEN
   skipped:=skipped||jsonb_build_array(k); CONTINUE;
  END IF;
  applied:=applied||jsonb_build_object(k,v);
  CASE k
   WHEN 'weight' THEN p.weight:=n;
   WHEN 'height' THEN p.height:=n;
   WHEN 'age' THEN p.age:=n::integer;
   WHEN 'sexo' THEN p.sexo:=v#>>'{}';
   ELSE m:=m||jsonb_build_object(k,v);
  END CASE;
 END LOOP;
 IF applied<>'{}'::jsonb THEN
  UPDATE public.profiles SET weight=p.weight,height=p.height,age=p.age,sexo=p.sexo,medidas=m WHERE id=p.id;
 END IF;
 UPDATE public.client_documents SET reviewed_summary=trim(_summary),status='reviewed',use_in_protocol=_use,document_date=_date,
 reviewed_profile=CASE WHEN _profile='{}'::jsonb THEN reviewed_profile ELSE applied END,
 profile_applied_at=CASE WHEN applied='{}'::jsonb THEN profile_applied_at ELSE now() END WHERE id=d.id;
 RETURN jsonb_build_object('applied',applied,'skipped',skipped);
END $fn$;
REVOKE ALL ON FUNCTION public.review_client_document(uuid,text,boolean,date,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_client_document(uuid,text,boolean,date,jsonb) TO authenticated;