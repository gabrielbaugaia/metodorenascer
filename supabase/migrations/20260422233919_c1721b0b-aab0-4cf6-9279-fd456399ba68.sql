-- Add muscle_groups array column and migrate data from muscle_group
ALTER TABLE public.reels_videos
ADD COLUMN IF NOT EXISTS muscle_groups text[] NOT NULL DEFAULT '{}';

-- Migrate existing single-value muscle_group into array
UPDATE public.reels_videos
SET muscle_groups = ARRAY[muscle_group]
WHERE muscle_group IS NOT NULL
  AND muscle_group <> ''
  AND (muscle_groups IS NULL OR array_length(muscle_groups, 1) IS NULL);

-- Index for filtering by muscle group
CREATE INDEX IF NOT EXISTS idx_reels_videos_muscle_groups
ON public.reels_videos USING GIN (muscle_groups);