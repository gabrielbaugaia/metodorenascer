-- 1. Restrict transformation_journeys "Service role can manage" to service_role only
DROP POLICY IF EXISTS "Service role can manage journeys" ON public.transformation_journeys;
CREATE POLICY "Service role can manage journeys"
ON public.transformation_journeys
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure users can still view and update their own journey (idempotent)
DROP POLICY IF EXISTS "Users can view own journey" ON public.transformation_journeys;
CREATE POLICY "Users can view own journey"
ON public.transformation_journeys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own journey" ON public.transformation_journeys;
CREATE POLICY "Users can insert own journey"
ON public.transformation_journeys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own journey" ON public.transformation_journeys;
CREATE POLICY "Users can update own journey"
ON public.transformation_journeys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Restrict entitlements "Service role can manage entitlements" to service_role only
DROP POLICY IF EXISTS "Service role can manage entitlements" ON public.entitlements;
CREATE POLICY "Service role can manage entitlements"
ON public.entitlements
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Remove broad authenticated read on automated_messages — admins-only via existing policy
DROP POLICY IF EXISTS "Authenticated users can read active messages" ON public.automated_messages;