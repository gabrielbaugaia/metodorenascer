-- Move pg_net extension from public to extensions schema
-- First drop the extension from public
DROP EXTENSION IF EXISTS pg_net;

-- Recreate it in the extensions schema (Supabase recommended location)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;