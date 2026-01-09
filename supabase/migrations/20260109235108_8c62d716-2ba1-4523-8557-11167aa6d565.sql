-- Expand exercise_gifs table to store rich data from exercises database
ALTER TABLE public.exercise_gifs 
ADD COLUMN IF NOT EXISTS exercise_db_id TEXT,
ADD COLUMN IF NOT EXISTS target_muscles TEXT[],
ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[],
ADD COLUMN IF NOT EXISTS body_parts TEXT[],
ADD COLUMN IF NOT EXISTS equipments TEXT[],
ADD COLUMN IF NOT EXISTS instructions TEXT[];

-- Create index for faster lookups by exercise_db_id
CREATE INDEX IF NOT EXISTS idx_exercise_gifs_db_id ON public.exercise_gifs(exercise_db_id);

-- Update existing RLS policies to include new columns (no changes needed as they inherit)