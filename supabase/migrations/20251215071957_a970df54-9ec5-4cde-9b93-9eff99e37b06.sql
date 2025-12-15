-- Criar tabela de vídeos de exercícios
CREATE TABLE public.exercise_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_name text NOT NULL,
  video_url text NOT NULL,
  muscle_group text NOT NULL,
  difficulty_level text DEFAULT 'todos',
  environment text DEFAULT 'ambos',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(exercise_name, environment)
);

-- Enable RLS
ALTER TABLE public.exercise_videos ENABLE ROW LEVEL SECURITY;

-- Admins can manage videos
CREATE POLICY "Admins can manage exercise videos"
ON public.exercise_videos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone authenticated can view videos
CREATE POLICY "Authenticated users can view exercise videos"
ON public.exercise_videos
FOR SELECT
TO authenticated
USING (true);

-- Insert initial exercise videos
INSERT INTO public.exercise_videos (exercise_name, video_url, muscle_group, difficulty_level, environment) VALUES
-- Peito
('Supino reto com barra', 'https://www.youtube.com/watch?v=rT7DgCr-3pg', 'peito', 'todos', 'academia'),
('Supino inclinado com halteres', 'https://www.youtube.com/watch?v=8iPEnn-ltC8', 'peito', 'todos', 'academia'),
('Flexão de braço', 'https://www.youtube.com/watch?v=IODxDxX7oi4', 'peito', 'todos', 'casa'),
('Flexão inclinada', 'https://www.youtube.com/watch?v=cfns5VDVVvk', 'peito', 'iniciante', 'casa'),
('Crucifixo com halteres', 'https://www.youtube.com/watch?v=eozdVDA78K0', 'peito', 'todos', 'academia'),
('Crossover', 'https://www.youtube.com/watch?v=taI4XduLpTk', 'peito', 'intermediário', 'academia'),

-- Costas
('Puxada frontal', 'https://www.youtube.com/watch?v=CAwf7n6Luuc', 'costas', 'todos', 'academia'),
('Remada curvada', 'https://www.youtube.com/watch?v=kBWAon7ItDw', 'costas', 'todos', 'academia'),
('Remada unilateral', 'https://www.youtube.com/watch?v=pYcpY20QaE8', 'costas', 'todos', 'academia'),
('Barra fixa', 'https://www.youtube.com/watch?v=eGo4IYlbE5g', 'costas', 'intermediário', 'ambos'),
('Remada baixa', 'https://www.youtube.com/watch?v=GZbfZ033f74', 'costas', 'todos', 'academia'),
('Superman', 'https://www.youtube.com/watch?v=cc6UVRS7PW4', 'costas', 'todos', 'casa'),

-- Ombros
('Desenvolvimento com halteres', 'https://www.youtube.com/watch?v=qEwKCR5JCog', 'ombros', 'todos', 'academia'),
('Elevação lateral', 'https://www.youtube.com/watch?v=3VcKaXpzqRo', 'ombros', 'todos', 'ambos'),
('Elevação frontal', 'https://www.youtube.com/watch?v=-t7fuZ0KhDA', 'ombros', 'todos', 'ambos'),
('Face pull', 'https://www.youtube.com/watch?v=rep-qVOkqgk', 'ombros', 'todos', 'academia'),
('Desenvolvimento Arnold', 'https://www.youtube.com/watch?v=3ml7BH7mNwQ', 'ombros', 'intermediário', 'academia'),

-- Bíceps
('Rosca direta', 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', 'biceps', 'todos', 'ambos'),
('Rosca alternada', 'https://www.youtube.com/watch?v=sAq_ocpRh_I', 'biceps', 'todos', 'ambos'),
('Rosca martelo', 'https://www.youtube.com/watch?v=zC3nLlEvin4', 'biceps', 'todos', 'ambos'),
('Rosca concentrada', 'https://www.youtube.com/watch?v=Jvj2wV0vOYU', 'biceps', 'todos', 'ambos'),
('Rosca Scott', 'https://www.youtube.com/watch?v=soxrZlIl35U', 'biceps', 'intermediário', 'academia'),

-- Tríceps
('Tríceps pulley', 'https://www.youtube.com/watch?v=2-LAMcpzODU', 'triceps', 'todos', 'academia'),
('Tríceps francês', 'https://www.youtube.com/watch?v=_gsUck-7M74', 'triceps', 'todos', 'ambos'),
('Tríceps testa', 'https://www.youtube.com/watch?v=d_KZxkY_0cM', 'triceps', 'intermediário', 'academia'),
('Mergulho no banco', 'https://www.youtube.com/watch?v=6kALZikXxLc', 'triceps', 'todos', 'casa'),
('Flexão diamante', 'https://www.youtube.com/watch?v=J0DnG1_S92I', 'triceps', 'intermediário', 'casa'),

-- Quadríceps
('Agachamento livre', 'https://www.youtube.com/watch?v=ultWZbUMPL8', 'quadriceps', 'todos', 'ambos'),
('Leg press', 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', 'quadriceps', 'todos', 'academia'),
('Agachamento búlgaro', 'https://www.youtube.com/watch?v=2C-uNgKwPLE', 'quadriceps', 'intermediário', 'ambos'),
('Cadeira extensora', 'https://www.youtube.com/watch?v=YyvSfVjQeL0', 'quadriceps', 'todos', 'academia'),
('Afundo', 'https://www.youtube.com/watch?v=QOVaHwm-Q6U', 'quadriceps', 'todos', 'ambos'),
('Agachamento sumô', 'https://www.youtube.com/watch?v=9ZuXKqRbT9k', 'quadriceps', 'todos', 'ambos'),

-- Posterior de coxa
('Stiff', 'https://www.youtube.com/watch?v=1uDiW5--rAE', 'posterior', 'todos', 'ambos'),
('Mesa flexora', 'https://www.youtube.com/watch?v=1Tq3QdYUuHs', 'posterior', 'todos', 'academia'),
('Elevação pélvica', 'https://www.youtube.com/watch?v=8bbE64NuDTU', 'posterior', 'todos', 'ambos'),
('Bom dia', 'https://www.youtube.com/watch?v=YA-h3n9L4YU', 'posterior', 'intermediário', 'ambos'),

-- Glúteos
('Hip thrust', 'https://www.youtube.com/watch?v=SEdqd1n0cvg', 'gluteos', 'todos', 'ambos'),
('Abdução de quadril', 'https://www.youtube.com/watch?v=c2pJTq0sPqY', 'gluteos', 'todos', 'ambos'),
('Glúteo máquina', 'https://www.youtube.com/watch?v=SLpR0jg0fGU', 'gluteos', 'todos', 'academia'),
('Ponte de glúteo', 'https://www.youtube.com/watch?v=OUgsJ8-Vi0E', 'gluteos', 'todos', 'casa'),

-- Panturrilha
('Panturrilha em pé', 'https://www.youtube.com/watch?v=-M4-G8p8fmc', 'panturrilha', 'todos', 'ambos'),
('Panturrilha sentado', 'https://www.youtube.com/watch?v=JbyjNymZOt0', 'panturrilha', 'todos', 'academia'),

-- Abdômen
('Abdominal crunch', 'https://www.youtube.com/watch?v=Xyd_fa5zoEU', 'abdomen', 'todos', 'ambos'),
('Prancha', 'https://www.youtube.com/watch?v=pSHjTRCQxIw', 'abdomen', 'todos', 'ambos'),
('Elevação de pernas', 'https://www.youtube.com/watch?v=JB2oyawG9KI', 'abdomen', 'todos', 'ambos'),
('Abdominal bicicleta', 'https://www.youtube.com/watch?v=9FGilxCbdz8', 'abdomen', 'todos', 'casa'),
('Abdominal infra', 'https://www.youtube.com/watch?v=l4kQd9eWclE', 'abdomen', 'todos', 'ambos'),
('Prancha lateral', 'https://www.youtube.com/watch?v=K2VljzCC16g', 'abdomen', 'todos', 'ambos');

-- Create index for faster lookups
CREATE INDEX idx_exercise_videos_name ON public.exercise_videos(exercise_name);
CREATE INDEX idx_exercise_videos_muscle ON public.exercise_videos(muscle_group);