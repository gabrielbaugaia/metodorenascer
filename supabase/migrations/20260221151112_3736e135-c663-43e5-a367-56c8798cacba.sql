
-- Table for Manual Inteligente (30s) inputs
CREATE TABLE public.manual_day_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours numeric,
  stress_level integer,
  energy_focus integer,
  trained_today boolean DEFAULT false,
  rpe integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.manual_day_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON public.manual_day_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.manual_day_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON public.manual_day_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all logs" ON public.manual_day_logs
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add data_mode preference to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_mode text DEFAULT 'manual';
