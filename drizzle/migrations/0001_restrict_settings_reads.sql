DROP POLICY IF EXISTS "read settings" ON public.payment_settings;
CREATE POLICY "Admins read settings" ON public.payment_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated can read engine config" ON public.prescription_engine_config;