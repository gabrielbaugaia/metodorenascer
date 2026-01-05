-- Create table for admin support alerts/notifications
CREATE TABLE public.admin_support_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversa_id UUID REFERENCES public.conversas(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'new_message',
  urgency_level TEXT NOT NULL DEFAULT 'normal',
  message_preview TEXT,
  keywords_detected TEXT[],
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.admin_support_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can read alerts
CREATE POLICY "Admins can view support alerts"
ON public.admin_support_alerts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert (via service role or trigger)
CREATE POLICY "Service role can insert alerts"
ON public.admin_support_alerts
FOR INSERT
WITH CHECK (true);

-- Admins can update (mark as read)
CREATE POLICY "Admins can update alerts"
ON public.admin_support_alerts
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete alerts
CREATE POLICY "Admins can delete alerts"
ON public.admin_support_alerts
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_admin_support_alerts_unread ON public.admin_support_alerts(is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_admin_support_alerts_urgency ON public.admin_support_alerts(urgency_level, created_at DESC);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_support_alerts;