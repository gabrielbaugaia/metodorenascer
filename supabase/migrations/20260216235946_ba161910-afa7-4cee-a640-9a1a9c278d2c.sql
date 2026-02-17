
ALTER TABLE public.health_workouts ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_health_workouts_external_id 
  ON public.health_workouts (user_id, external_id) 
  WHERE external_id IS NOT NULL;
