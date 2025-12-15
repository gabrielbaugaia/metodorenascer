-- Add DELETE policy to progress table so users can delete their own health tracking data
CREATE POLICY "Users can delete own progress"
ON public.progress
FOR DELETE
USING (auth.uid() = user_id);