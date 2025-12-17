-- Allow users to update their own checkins (for AI analysis)
CREATE POLICY "Users can update own checkins" 
ON public.checkins 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);