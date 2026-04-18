-- 1. Restrict automated_messages SELECT to admins only
DROP POLICY IF EXISTS "Authenticated users can view active messages" ON public.automated_messages;
DROP POLICY IF EXISTS "Anyone can view active messages" ON public.automated_messages;
DROP POLICY IF EXISTS "Active messages viewable by authenticated" ON public.automated_messages;

-- Ensure only admins can read automated message content & targeting rules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='automated_messages' AND policyname='Admins can view automated messages'
  ) THEN
    CREATE POLICY "Admins can view automated messages"
      ON public.automated_messages
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- 2. Remove gif_search_queue from realtime publication (admin-only data, no need to broadcast)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='gif_search_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.gif_search_queue;
  END IF;
END $$;

-- 3. Lock down realtime.messages so users can only subscribe to topics they own
-- This prevents arbitrary subscription to admin_support_alerts / conversas of other users
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can subscribe to own topics" ON realtime.messages;
DROP POLICY IF EXISTS "Admins can subscribe to all topics" ON realtime.messages;

-- Allow authenticated users to receive realtime messages for topics
-- that include their own user_id, OR admins for any topic.
-- Topic naming convention enforced in client code: topics either include
-- the user's UUID or are admin-only channels prefixed with "admin:".
CREATE POLICY "Users subscribe to own user-id topics"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- topic contains the authenticated user's id
    (realtime.topic() LIKE '%' || auth.uid()::text || '%')
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );