CREATE TABLE public.hormonal_compounds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
 class_name text NOT NULL DEFAULT '',
 route text NOT NULL DEFAULT '',
 concentration_reference text NOT NULL DEFAULT '',
 half_life_reference text NOT NULL DEFAULT '',
 source_reference text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hormonal_compounds TO authenticated;
GRANT ALL ON public.hormonal_compounds TO service_role;
ALTER TABLE public.hormonal_compounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY hormonal_compounds_admin ON public.hormonal_compounds FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));