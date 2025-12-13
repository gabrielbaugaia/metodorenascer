import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChefHat, Plus, X, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const popularIngredients = [
  "Frango", "Ovo", "Batata doce", "Arroz integral", "Brócolis",
  "Aveia", "Banana", "Whey protein", "Abacate", "Salmão",
  "Quinoa", "Espinafre", "Amendoim", "Iogurte", "Tomate"
];

export default function Receitas() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [recipe, setRecipe] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addIngredient = (ingredient: string) => {
    const trimmed = ingredient.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
    }
    setInputValue("");
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter((i) => i !== ingredient));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addIngredient(inputValue);
    }
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      toast({
        title: "Selecione ingredientes",
        description: "Adicione pelo menos um ingrediente para gerar a receita",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setRecipe(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-recipe", {
        body: { ingredients },
      });

      if (error) throw error;

      if (data?.recipe) {
        setRecipe(data.recipe);
      } else {
        throw new Error("Receita não foi gerada");
      }
    } catch (error) {
      console.error("Error generating recipe:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a receita. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-display text-4xl text-foreground">
                Gerador de <span className="text-gradient">Receitas</span>
              </h1>
            </div>
            <p className="text-muted-foreground">
              Escolha os ingredientes e nossa IA criará uma receita fitness personalizada
            </p>
          </div>

          {/* Ingredient input */}
          <Card variant="dashboard" className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Selecione seus ingredientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Digite um ingrediente..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={() => inputValue.trim() && addIngredient(inputValue)}
                  disabled={!inputValue.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Popular ingredients */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ingredientes populares:</p>
                <div className="flex flex-wrap gap-2">
                  {popularIngredients.map((ing) => (
                    <Badge
                      key={ing}
                      variant={ingredients.includes(ing.toLowerCase()) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => {
                        if (ingredients.includes(ing.toLowerCase())) {
                          removeIngredient(ing.toLowerCase());
                        } else {
                          addIngredient(ing);
                        }
                      }}
                    >
                      {ing}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Selected ingredients */}
              {ingredients.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Ingredientes selecionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map((ing) => (
                      <Badge key={ing} className="capitalize gap-1">
                        {ing}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeIngredient(ing)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate button */}
              <Button
                onClick={generateRecipe}
                disabled={loading || ingredients.length === 0}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando receita...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Receita com IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated recipe */}
          {recipe && (
            <Card variant="dashboard" className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-primary" />
                  Sua Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {recipe}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
