
-- whatsapp_contacts
CREATE TABLE public.whatsapp_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  phone_e164 text NOT NULL UNIQUE,
  wa_id text,
  display_name text,
  opt_in_at timestamptz,
  opt_out_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_contacts_user_id ON public.whatsapp_contacts(user_id);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp_contacts"
  ON public.whatsapp_contacts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own whatsapp_contacts"
  ON public.whatsapp_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE TRIGGER update_whatsapp_contacts_updated_at
  BEFORE UPDATE ON public.whatsapp_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- whatsapp_messages
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  conversa_id uuid REFERENCES public.conversas(id) ON DELETE SET NULL,
  wa_message_id text UNIQUE,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  from_phone text,
  to_phone text,
  message_type text NOT NULL DEFAULT 'text',
  body text,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_messages_user_id ON public.whatsapp_messages(user_id);
CREATE INDEX idx_whatsapp_messages_conversa_id ON public.whatsapp_messages(conversa_id);
CREATE INDEX idx_whatsapp_messages_wa_message_id ON public.whatsapp_messages(wa_message_id);
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp_messages"
  ON public.whatsapp_messages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own whatsapp_messages"
  ON public.whatsapp_messages FOR SELECT
  USING (auth.uid() = user_id);

-- whatsapp_webhook_events
CREATE TABLE public.whatsapp_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_hash text UNIQUE,
  payload_json jsonb NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_webhook_events_created_at ON public.whatsapp_webhook_events(created_at DESC);
CREATE INDEX idx_whatsapp_webhook_events_processed_at ON public.whatsapp_webhook_events(processed_at);

ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp_webhook_events"
  ON public.whatsapp_webhook_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
