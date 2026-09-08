-- 1. quiz_leads: impedir alteração de colunas sensíveis por público anônimo
CREATE OR REPLACE FUNCTION public.quiz_leads_guard_public_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Público só pode mudar o status (e updated_at). Demais colunas travadas.
  NEW.name := OLD.name;
  NEW.email := OLD.email;
  NEW.whatsapp := OLD.whatsapp;
  NEW.quiz_answers := OLD.quiz_answers;
  NEW.contact_notes := OLD.contact_notes;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quiz_leads_guard_public_update_trg ON public.quiz_leads;
CREATE TRIGGER quiz_leads_guard_public_update_trg
BEFORE UPDATE ON public.quiz_leads
FOR EACH ROW EXECUTE FUNCTION public.quiz_leads_guard_public_update();

-- 2. realtime.messages: matching exato de tópico
DROP POLICY IF EXISTS "Users subscribe to own user-id topics" ON realtime.messages;
CREATE POLICY "Users subscribe to own user-id topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('user:' || auth.uid()::text)
  OR public.has_role(auth.uid(), 'admin')
);

-- 3. Revogar EXECUTE em funções SECURITY DEFINER internas
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_pending_logins() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_events() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_cashback_balance(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalculate_engagement(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalculate_funnel_status(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.quiz_leads_guard_public_update() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_funnel_status() FROM anon, authenticated, PUBLIC;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_pending_logins() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_events() TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_cashback_balance(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_engagement(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_funnel_status(uuid) TO service_role;