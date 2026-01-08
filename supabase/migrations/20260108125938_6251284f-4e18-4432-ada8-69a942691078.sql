-- Add category field to blog_posts
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'geral';

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_search ON public.blog_posts USING gin(to_tsvector('portuguese', title));
CREATE INDEX IF NOT EXISTS idx_blog_posts_excerpt_search ON public.blog_posts USING gin(to_tsvector('portuguese', COALESCE(excerpt, '')));