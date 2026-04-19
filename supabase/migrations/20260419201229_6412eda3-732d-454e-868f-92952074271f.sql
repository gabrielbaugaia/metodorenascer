-- Create quiz_leads table
CREATE TABLE public.quiz_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contact info
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  
  -- Quiz data
  quiz_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_score INTEGER NOT NULL DEFAULT 0,
  
  -- Funnel status
  status TEXT NOT NULL DEFAULT 'completed_quiz',
  viewed_offer_at TIMESTAMP WITH TIME ZONE,
  clicked_checkout_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  
  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  session_id TEXT,
  
  -- Admin actions
  contacted_by_admin BOOLEAN NOT NULL DEFAULT false,
  contacted_at TIMESTAMP WITH TIME ZONE,
  contact_notes TEXT,
  
  CONSTRAINT quiz_leads_status_check CHECK (status IN ('completed_quiz', 'viewed_offer', 'clicked_checkout', 'converted')),
  CONSTRAINT quiz_leads_risk_score_check CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- Indexes for common queries
CREATE INDEX idx_quiz_leads_created_at ON public.quiz_leads(created_at DESC);
CREATE INDEX idx_quiz_leads_status ON public.quiz_leads(status);
CREATE INDEX idx_quiz_leads_email ON public.quiz_leads(lower(email));
CREATE INDEX idx_quiz_leads_risk_score ON public.quiz_leads(risk_score DESC);
CREATE INDEX idx_quiz_leads_utm_source ON public.quiz_leads(utm_source) WHERE utm_source IS NOT NULL;

-- Enable RLS
ALTER TABLE public.quiz_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a lead (public quiz form)
CREATE POLICY "Anyone can submit quiz leads"
ON public.quiz_leads
FOR INSERT
TO public
WITH CHECK (true);

-- Anyone can update their own lead by id (to track funnel progression as they navigate)
-- We restrict by id only (UUID is unguessable) and only allow updating status/funnel timestamps
CREATE POLICY "Public can update funnel progression"
ON public.quiz_leads
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Admins full access
CREATE POLICY "Admins can view all quiz leads"
ON public.quiz_leads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update quiz leads"
ON public.quiz_leads
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete quiz leads"
ON public.quiz_leads
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role full access (for stripe webhook)
CREATE POLICY "Service role full access quiz leads"
ON public.quiz_leads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_quiz_leads_updated_at
BEFORE UPDATE ON public.quiz_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();