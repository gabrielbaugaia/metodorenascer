-- Drop the overly permissive public UPDATE policy
DROP POLICY IF EXISTS "Public can update funnel progression" ON public.quiz_leads;

-- Replace with a strict policy: public can only progress status forward,
-- and only set the corresponding viewed_offer_at / clicked_checkout_at timestamps.
-- They CANNOT change nome/email/whatsapp/risk_score/quiz_answers/contact fields/converted.
CREATE POLICY "Public can advance funnel status only"
ON public.quiz_leads
FOR UPDATE
TO public
USING (
  status IN ('completed_quiz', 'viewed_offer')
)
WITH CHECK (
  status IN ('viewed_offer', 'clicked_checkout')
);