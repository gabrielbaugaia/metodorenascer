-- Convert muscle_group from TEXT to TEXT[] for multi-selection support
ALTER TABLE exercise_gifs 
  ALTER COLUMN muscle_group TYPE TEXT[] 
  USING ARRAY[muscle_group];

-- Add comment for documentation
COMMENT ON COLUMN exercise_gifs.muscle_group IS 'Array of muscle groups - supports multi-selection for compound exercises';