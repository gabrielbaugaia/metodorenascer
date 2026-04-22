
-- Tabela de Reels
CREATE TABLE public.reels_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  show_description BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL CHECK (category IN ('execucao', 'dica', 'explicativo')),
  muscle_group TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds NUMERIC,
  audio_removed BOOLEAN NOT NULL DEFAULT false,
  original_filename TEXT,
  file_size_bytes BIGINT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reels_videos_category ON public.reels_videos(category);
CREATE INDEX idx_reels_videos_muscle_group ON public.reels_videos(muscle_group);
CREATE INDEX idx_reels_videos_published ON public.reels_videos(is_published, created_at DESC);

ALTER TABLE public.reels_videos ENABLE ROW LEVEL SECURITY;

-- Admin: full management
CREATE POLICY "Admins can manage reels"
ON public.reels_videos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users: read published reels
CREATE POLICY "Authenticated users can view published reels"
ON public.reels_videos
FOR SELECT
TO authenticated
USING (is_published = true);

-- Trigger para updated_at
CREATE TRIGGER update_reels_videos_updated_at
BEFORE UPDATE ON public.reels_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket público para os vídeos
INSERT INTO storage.buckets (id, name, public)
VALUES ('reels-videos', 'reels-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view reels-videos files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'reels-videos');

CREATE POLICY "Admins can upload reels-videos files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reels-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reels-videos files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'reels-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reels-videos files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'reels-videos' AND public.has_role(auth.uid(), 'admin'));
