-- Create table for GIF search queue jobs
CREATE TABLE public.gif_search_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_gif_id UUID NOT NULL REFERENCES public.exercise_gifs(id) ON DELETE CASCADE,
  exercise_name_pt TEXT NOT NULL,
  exercise_name_en TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  result_gif_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3
);

-- Create index for efficient queue processing
CREATE INDEX idx_gif_search_queue_status ON public.gif_search_queue(status, created_at);
CREATE INDEX idx_gif_search_queue_exercise ON public.gif_search_queue(exercise_gif_id);

-- Enable RLS
ALTER TABLE public.gif_search_queue ENABLE ROW LEVEL SECURITY;

-- Only admins can access the queue
CREATE POLICY "Admins can manage gif search queue" 
ON public.gif_search_queue 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add realtime for queue updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.gif_search_queue;