
-- Add avg_hr_bpm column to health_daily
ALTER TABLE public.health_daily ADD COLUMN IF NOT EXISTS avg_hr_bpm integer;

-- Create ecg_records table
CREATE TABLE public.ecg_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  file_url text NOT NULL,
  heart_rate_bpm integer,
  classification text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ecg_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ecg records"
  ON public.ecg_records FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all ecg records"
  ON public.ecg_records FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for ECG files
INSERT INTO storage.buckets (id, name, public)
VALUES ('ecg-records', 'ecg-records', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ecg-records bucket
CREATE POLICY "Users can upload own ecg files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ecg-records' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own ecg files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'ecg-records' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all ecg files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'ecg-records' AND has_role(auth.uid(), 'admin'::app_role));
