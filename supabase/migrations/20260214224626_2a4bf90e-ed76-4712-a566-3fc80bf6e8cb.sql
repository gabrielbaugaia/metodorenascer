
ALTER TABLE public.protocolos ADD COLUMN audit_result jsonb DEFAULT null;
ALTER TABLE public.mqo_protocols ADD COLUMN audit_result jsonb DEFAULT null;
