-- Add city field to blog_leads
ALTER TABLE public.blog_leads ADD COLUMN IF NOT EXISTS city TEXT;

-- Add document URL and CTA text to blog_posts
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS lead_document_url TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS lead_cta_text TEXT DEFAULT 'Baixar Agora';