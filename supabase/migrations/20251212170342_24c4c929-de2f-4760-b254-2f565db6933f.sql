-- Allow service role to insert subscriptions (for edge functions)
CREATE POLICY "Service role can insert subscriptions" 
ON public.subscriptions 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Allow service role to update subscriptions
CREATE POLICY "Service role can update subscriptions" 
ON public.subscriptions 
FOR UPDATE 
TO service_role
USING (true);

-- Allow users to insert their own subscription (for edge function via service role)
CREATE POLICY "Users can insert own subscription" 
ON public.subscriptions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
