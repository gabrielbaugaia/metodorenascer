-- Restrict anamnese_tokens "Service role can manage anamnese tokens" to service_role only
DROP POLICY IF EXISTS "Service role can manage anamnese tokens" ON public.anamnese_tokens;
CREATE POLICY "Service role can manage anamnese tokens"
ON public.anamnese_tokens
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Restrict user_module_access "Service role can manage access" to service_role only
DROP POLICY IF EXISTS "Service role can manage access" ON public.user_module_access;
CREATE POLICY "Service role can manage access"
ON public.user_module_access
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);