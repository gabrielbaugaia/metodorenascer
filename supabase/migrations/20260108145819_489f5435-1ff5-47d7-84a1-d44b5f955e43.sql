-- Add new columns to automated_messages for audience targeting
ALTER TABLE public.automated_messages 
ADD COLUMN IF NOT EXISTS target_audience jsonb DEFAULT '{"type": "all"}'::jsonb,
ADD COLUMN IF NOT EXISTS schedule_type text DEFAULT 'trigger',
ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false;

-- Insert default messages for new trigger types if they don't exist
INSERT INTO public.automated_messages (trigger_type, message_title, message_content, is_active, target_audience, is_custom)
SELECT * FROM (VALUES
  ('birthday', 'Feliz Aniversário! 🎂', 'Parabéns pelo seu dia especial! Continue focado nos seus objetivos e celebre suas conquistas. Que este novo ano seja repleto de saúde e evolução!', true, '{"type": "birthday"}'::jsonb, false),
  ('inactive_after_signup', 'Sentimos sua falta!', 'Você se cadastrou mas ainda não explorou tudo que temos para oferecer. Que tal dar o primeiro passo hoje?', true, '{"type": "inactive_after_signup", "plan_filter": "all"}'::jsonb, false),
  ('goal_weight_loss', 'Dica para Emagrecimento', 'Continue focado no seu objetivo de emagrecimento! Lembre-se: consistência é a chave para resultados duradouros.', false, '{"type": "goal", "goal": "emagrecimento"}'::jsonb, false),
  ('goal_hypertrophy', 'Dica para Hipertrofia', 'Para ganhar massa muscular, nutrição e descanso são tão importantes quanto o treino. Continue firme!', false, '{"type": "goal", "goal": "hipertrofia"}'::jsonb, false),
  ('goal_conditioning', 'Dica para Condicionamento', 'Seu condicionamento físico melhora a cada treino. Não desista, os resultados vêm com o tempo!', false, '{"type": "goal", "goal": "condicionamento"}'::jsonb, false)
) AS v(trigger_type, message_title, message_content, is_active, target_audience, is_custom)
WHERE NOT EXISTS (
  SELECT 1 FROM public.automated_messages WHERE trigger_type = v.trigger_type
);