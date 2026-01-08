
-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  author_id UUID REFERENCES auth.users(id),
  meta_title TEXT,
  meta_description TEXT,
  enable_lead_capture BOOLEAN DEFAULT false,
  lead_capture_title TEXT,
  lead_capture_description TEXT,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_leads table for captured leads
CREATE TABLE public.blog_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  document_downloaded TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_leads ENABLE ROW LEVEL SECURITY;

-- Public read access for published posts
CREATE POLICY "Published posts are viewable by everyone" 
ON public.blog_posts 
FOR SELECT 
USING (status = 'published');

-- Admin full access to posts
CREATE POLICY "Admins can manage all posts" 
ON public.blog_posts 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Public insert for leads (anyone can submit)
CREATE POLICY "Anyone can submit leads" 
ON public.blog_leads 
FOR INSERT 
WITH CHECK (true);

-- Admin read access to leads
CREATE POLICY "Admins can view leads" 
ON public.blog_leads 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for blog assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-assets', 'blog-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for blog assets
CREATE POLICY "Blog images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'blog-assets');

CREATE POLICY "Admins can upload blog assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'blog-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blog assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'blog-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blog assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'blog-assets' AND public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for SEO slug lookups
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
