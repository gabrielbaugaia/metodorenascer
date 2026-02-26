
-- Table to store external body composition assessments (Anovator, InBody, etc.)
CREATE TABLE public.body_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_url TEXT,
  source_name TEXT DEFAULT 'anovator',
  assessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Basic composition
  weight NUMERIC,
  height NUMERIC,
  bmi NUMERIC,
  body_fat_pct NUMERIC,
  muscle_pct NUMERIC,
  subcutaneous_fat_pct NUMERIC,
  visceral_fat NUMERIC,
  protein_pct NUMERIC,
  hydration_pct NUMERIC,
  bone_mass_kg NUMERIC,
  bmr_kcal NUMERIC,
  waist_hip_ratio NUMERIC,
  body_age NUMERIC,
  fat_mass_kg NUMERIC,
  muscle_mass_kg NUMERIC,
  
  -- Anthropometric
  waist_cm NUMERIC,
  hip_cm NUMERIC,
  arm_circumference_cm NUMERIC,
  thigh_circumference_cm NUMERIC,
  shoulder_width_cm NUMERIC,
  trunk_length_cm NUMERIC,
  leg_length_cm NUMERIC,
  wingspan_cm NUMERIC,
  
  -- Segment analysis (JSON for flexibility)
  segment_analysis JSONB,
  
  -- Postural risks (JSON)
  postural_analysis JSONB,
  
  -- Exercise & diet suggestions from the device
  exercise_suggestions JSONB,
  diet_suggestions JSONB,
  
  -- Body type classification
  body_type TEXT,
  
  -- Raw extracted data for reference
  raw_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.body_assessments ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage body_assessments"
  ON public.body_assessments
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can read their own assessments
CREATE POLICY "Users can read own body_assessments"
  ON public.body_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_body_assessments_user_id ON public.body_assessments(user_id);
CREATE INDEX idx_body_assessments_assessed_at ON public.body_assessments(user_id, assessed_at DESC);
