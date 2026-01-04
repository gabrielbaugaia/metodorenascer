-- Permitir que service role acesse todas as subscriptions para envio de push
CREATE POLICY "Service role can read all subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (true);

-- Permitir que service role acesse todas as preferências para verificar se deve enviar
CREATE POLICY "Service role can read all preferences"
ON public.notification_preferences
FOR SELECT
USING (true);