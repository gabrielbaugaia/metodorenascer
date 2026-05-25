CREATE TABLE IF NOT EXISTS public.whatsapp_bot_sessions (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  flow text NOT NULL,
  step int NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_bot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_bot_sessions" ON public.whatsapp_bot_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS bot_generated boolean NOT NULL DEFAULT false;