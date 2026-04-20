-- Fix INSERT policy to explicitly target anon and authenticated roles
DROP POLICY IF EXISTS "Anyone can submit quiz leads" ON public.quiz_leads;

CREATE POLICY "Anyone can submit quiz leads"
ON public.quiz_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Fix UPDATE policy for funnel progression
DROP POLICY IF EXISTS "Public can advance funnel status only" ON public.quiz_leads;

CREATE POLICY "Public can advance funnel status only"
ON public.quiz_leads
FOR UPDATE
TO anon, authenticated
USING (status = ANY (ARRAY['completed_quiz','viewed_offer']))
WITH CHECK (status = ANY (ARRAY['viewed_offer','clicked_checkout']));