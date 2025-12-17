-- Add column to store AI analysis in checkins table
ALTER TABLE public.checkins 
ADD COLUMN IF NOT EXISTS ai_analysis TEXT DEFAULT NULL;