CREATE TABLE public.client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('composicao_corporal','movimento','exame_medico')),
  title text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  document_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','extracted','reviewed','failed')),
  extracted_summary text,
  extracted_data jsonb,
  reviewed_summary text,
  use_in_protocol boolean NOT NULL DEFAULT false,
  error_message text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_documents TO authenticated;
GRANT ALL ON public.client_documents TO service_role;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage client documents" ON public.client_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX client_documents_user_idx ON public.client_documents(user_id, created_at DESC);
CREATE TRIGGER update_client_documents_updated_at BEFORE UPDATE ON public.client_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Admins read client-documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-documents' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins upload client-documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-documents' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete client-documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'client-documents' AND public.has_role(auth.uid(),'admin'));