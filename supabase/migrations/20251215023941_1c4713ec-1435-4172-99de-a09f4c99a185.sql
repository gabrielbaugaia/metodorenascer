-- Tabela para rastrear último acesso do usuário
CREATE TABLE public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  last_access TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_photo_submitted TIMESTAMP WITH TIME ZONE,
  photo_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  inactivity_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own activity"
  ON public.user_activity FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
  ON public.user_activity FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all activity"
  ON public.user_activity FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabela para mensagens automáticas configuráveis pelo admin
CREATE TABLE public.automated_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL, -- 'inactivity_3_days', 'photo_reminder_30_days', 'welcome', etc.
  message_title TEXT NOT NULL,
  message_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automated_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can manage messages
CREATE POLICY "Admins can manage automated messages"
  ON public.automated_messages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can read active messages (needed for edge function)
CREATE POLICY "Anyone can read active messages"
  ON public.automated_messages FOR SELECT
  USING (is_active = true);

-- Tabela para log de notificações enviadas
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  message_content TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notification_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications"
  ON public.notification_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage notifications"
  ON public.notification_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default automated messages
INSERT INTO public.automated_messages (trigger_type, message_title, message_content) VALUES
('inactivity_3_days', 'Sumido(a)?', 'Olá! Notamos que você não acessa o app há alguns dias. Está tudo bem? Lembre-se que consistência é a chave para resultados. Volte a treinar!'),
('photo_reminder_30_days', 'Hora de atualizar suas fotos!', 'Já se passaram 30 dias desde sua última atualização de fotos. Tire novas fotos de progresso para acompanharmos sua evolução juntos!'),
('welcome', 'Bem-vindo ao Método Renascer!', 'Parabéns por dar o primeiro passo! Seu plano personalizado está pronto. Comece agora sua transformação!');

-- Trigger para updated_at
CREATE TRIGGER update_user_activity_updated_at
  BEFORE UPDATE ON public.user_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automated_messages_updated_at
  BEFORE UPDATE ON public.automated_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();