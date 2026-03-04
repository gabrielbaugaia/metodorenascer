
-- =============================================
-- SIS Phase 2: Create 6 tables + storage bucket
-- =============================================

-- 1) sis_cognitive_checkins
CREATE TABLE public.sis_cognitive_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  mental_energy int CHECK (mental_energy BETWEEN 1 AND 5),
  mental_clarity int CHECK (mental_clarity BETWEEN 1 AND 5),
  focus int CHECK (focus BETWEEN 1 AND 5),
  irritability int CHECK (irritability BETWEEN 1 AND 5),
  food_discipline int CHECK (food_discipline BETWEEN 1 AND 5),
  alcohol boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_sis_cognitive_checkins_user_date ON public.sis_cognitive_checkins (user_id, date DESC);

ALTER TABLE public.sis_cognitive_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cognitive checkins" ON public.sis_cognitive_checkins
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access cognitive checkins" ON public.sis_cognitive_checkins
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) sis_structural_assessments (table only, no UI)
CREATE TABLE public.sis_structural_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  photo_front_url text,
  photo_side_url text,
  photo_back_url text,
  video_url text,
  cervical_angle numeric,
  pelvic_tilt numeric,
  scapular_asymmetry numeric,
  squat_score int CHECK (squat_score BETWEEN 1 AND 5),
  hinge_score int CHECK (hinge_score BETWEEN 1 AND 5),
  overhead_score int CHECK (overhead_score BETWEEN 1 AND 5),
  mobility_score int CHECK (mobility_score BETWEEN 1 AND 5),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sis_structural_user_date ON public.sis_structural_assessments (user_id, date DESC);

ALTER TABLE public.sis_structural_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own structural assessments" ON public.sis_structural_assessments
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access structural assessments" ON public.sis_structural_assessments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) sis_scores_daily
CREATE TABLE public.sis_scores_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  mechanical_score numeric(5,2),
  recovery_score numeric(5,2),
  structural_score numeric(5,2),
  body_comp_score numeric(5,2),
  cognitive_score numeric(5,2),
  consistency_score numeric(5,2),
  shape_intelligence_score numeric(5,2),
  classification text,
  alerts jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_sis_scores_daily_user_date ON public.sis_scores_daily (user_id, date DESC);

ALTER TABLE public.sis_scores_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scores" ON public.sis_scores_daily
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins full access scores" ON public.sis_scores_daily
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage scores" ON public.sis_scores_daily
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 4) sis_streaks
CREATE TABLE public.sis_streaks (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak int DEFAULT 0,
  best_streak int DEFAULT 0,
  last_checkin_date date
);

ALTER TABLE public.sis_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks" ON public.sis_streaks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage streaks" ON public.sis_streaks
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins full access streaks" ON public.sis_streaks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) sis_device_sources (stub)
CREATE TABLE public.sis_device_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider text NOT NULL,
  access_status text DEFAULT 'disconnected',
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sis_device_sources_user ON public.sis_device_sources (user_id);

ALTER TABLE public.sis_device_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own device sources" ON public.sis_device_sources
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins full access device sources" ON public.sis_device_sources
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6) sis_wearable_raw (stub)
CREATE TABLE public.sis_wearable_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider text NOT NULL,
  date date NOT NULL,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sis_wearable_raw_user_date ON public.sis_wearable_raw (user_id, date DESC);

ALTER TABLE public.sis_wearable_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wearable data" ON public.sis_wearable_raw
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins full access wearable data" ON public.sis_wearable_raw
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for SIS media
INSERT INTO storage.buckets (id, name, public) VALUES ('sis-media', 'sis-media', false);

-- Storage RLS: users can manage own files
CREATE POLICY "Users can upload own SIS media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sis-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own SIS media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'sis-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own SIS media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'sis-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can access all SIS media" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'sis-media' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'sis-media' AND public.has_role(auth.uid(), 'admin'));
