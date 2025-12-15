-- Tabela para receitas salvas pelo usuário
CREATE TABLE public.saved_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL,
  recipe_content TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own recipes"
  ON public.saved_recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON public.saved_recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON public.saved_recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON public.saved_recipes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_saved_recipes_updated_at
  BEFORE UPDATE ON public.saved_recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();