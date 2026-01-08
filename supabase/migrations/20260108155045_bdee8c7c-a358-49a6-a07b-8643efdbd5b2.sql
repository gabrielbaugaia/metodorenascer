-- Add scheduling fields to automated_messages
ALTER TABLE public.automated_messages 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS schedule_recurring TEXT CHECK (schedule_recurring IN ('once', 'daily', 'weekly', 'monthly'));

-- Create table for tracking sent messages with engagement
CREATE TABLE public.message_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.automated_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_sends ENABLE ROW LEVEL SECURITY;

-- Admin can view all sends
CREATE POLICY "Admins can view all message sends"
ON public.message_sends
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert sends
CREATE POLICY "Admins can insert message sends"
ON public.message_sends
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for faster queries
CREATE INDEX idx_message_sends_message_id ON public.message_sends(message_id);
CREATE INDEX idx_message_sends_sent_at ON public.message_sends(sent_at);
CREATE INDEX idx_message_sends_status ON public.message_sends(status);

-- View for message metrics
CREATE OR REPLACE VIEW public.v_message_metrics AS
SELECT 
  am.id as message_id,
  am.message_title,
  am.trigger_type,
  am.is_custom,
  COUNT(ms.id) as total_sent,
  COUNT(ms.opened_at) as total_opened,
  COUNT(ms.clicked_at) as total_clicked,
  CASE WHEN COUNT(ms.id) > 0 
    THEN ROUND((COUNT(ms.opened_at)::numeric / COUNT(ms.id)::numeric) * 100, 1)
    ELSE 0 
  END as open_rate,
  CASE WHEN COUNT(ms.opened_at) > 0 
    THEN ROUND((COUNT(ms.clicked_at)::numeric / COUNT(ms.opened_at)::numeric) * 100, 1)
    ELSE 0 
  END as click_rate
FROM public.automated_messages am
LEFT JOIN public.message_sends ms ON ms.message_id = am.id
GROUP BY am.id, am.message_title, am.trigger_type, am.is_custom;