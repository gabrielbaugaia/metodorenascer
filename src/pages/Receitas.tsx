import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, Plus, X, Loader2, Sparkles, Bookmark, BookmarkCheck, Heart, Trash2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const popularIngredients = [
  "Frango", "Ovo", "Batata doce", "Arroz integral", "Brócolis",
  "Aveia", "Banana", "Whey protein", "Abacate", "Salmão",
  "Quinoa", "Espinafre", "Amendoim", "Iogurte", "Tomate"
];

interface SavedRecipe {
  id: string;
  title: string;
  ingredients: string[];
  recipe_content: string;
  is_favorite: boolean;
  created_at: string;
}

export default function Receitas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [recipe, setRecipe] = useState<string | null>(null);
  const [recipeTitle, setRecipeTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [activeTab, setActiveTab] = useState("generate");

  useEffect(() => {
    if (user) {
      fetchSavedRecipes();
    }
  }, [user]);

  const fetchSavedRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_recipes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedRecipes(data || []);
    } catch (error) {
      console.error("Erro ao carregar receitas:", error);
    } finally {
      setLoadingRecipes(false);
    }
  };

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

  const extractTitle = (recipeText: string): string => {
    const lines = recipeText.split("\n").filter(line => line.trim());
    const firstLine = lines[0] || "";
    // Remove marcadores markdown
    return firstLine.replace(/^[#*\-]+\s*/, "").trim() || "Receita Fitness";
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
    setRecipeTitle("");

    try {
      const { data, error } = await supabase.functions.invoke("generate-recipe", {
        body: { ingredients },
      });

      if (error) {
        // Handle rate limiting and payment errors
        const errorMessage = error.message?.toLowerCase() || "";
        if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
          throw new Error("Muitas requisições. Aguarde alguns segundos e tente novamente.");
        }
        if (errorMessage.includes("402") || errorMessage.includes("payment")) {
          throw new Error("Limite de uso atingido. Entre em contato com o suporte.");
        }
        throw error;
      }

      if (data?.recipe) {
        setRecipe(data.recipe);
        setRecipeTitle(extractTitle(data.recipe));
      } else {
        throw new Error("Receita não foi gerada");
      }
    } catch (error: unknown) {
      console.error("Error generating recipe:", error);
      const errorMsg = error instanceof Error ? error.message : "Não foi possível gerar a receita. Tente novamente.";
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = async (favorite: boolean = false) => {
    if (!recipe || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("saved_recipes")
        .insert({
          user_id: user.id,
          title: recipeTitle,
          ingredients: ingredients,
          recipe_content: recipe,
          is_favorite: favorite,
        });

      if (error) throw error;

      toast({
        title: favorite ? "Receita favoritada!" : "Receita salva!",
        description: "Sua receita foi salva no histórico",
      });

      fetchSavedRecipes();
    } catch (error) {
      console.error("Erro ao salvar receita:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a receita",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = async (recipeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("saved_recipes")
        .update({ is_favorite: !currentStatus })
        .eq("id", recipeId);

      if (error) throw error;

      setSavedRecipes(prev =>
        prev.map(r =>
          r.id === recipeId ? { ...r, is_favorite: !currentStatus } : r
        )
      );

      toast({
        title: !currentStatus ? "Adicionada aos favoritos!" : "Removida dos favoritos",
      });
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from("saved_recipes")
        .delete()
        .eq("id", recipeId);

      if (error) throw error;

      setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
      toast({ title: "Receita excluída" });
    } catch (error) {
      console.error("Erro ao excluir receita:", error);
    }
  };

  const favoriteRecipes = savedRecipes.filter(r => r.is_favorite);

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold uppercase text-foreground">
              Gerador de <span className="text-primary">Receitas</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Escolha ingredientes e nossa IA criará uma receita fitness personalizada
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Salvas ({savedRecipes.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Favoritas ({favoriteRecipes.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Gerar Receita */}
          <TabsContent value="generate" className="space-y-6">
            {/* Ingredient input */}
            <Card variant="dashboard">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg uppercase">
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-primary" />
                      {recipeTitle}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveRecipe(false)}
                        disabled={saving}
                      >
                        <Bookmark className="h-4 w-4 mr-1" />
                        Salvar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveRecipe(true)}
                        disabled={saving}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Favoritar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <div 
                      className="text-muted-foreground leading-relaxed space-y-2"
                      dangerouslySetInnerHTML={{
                        __html: recipe
                          .replace(/## (.*?)(\n|$)/g, '<h2 class="text-lg font-bold text-foreground mt-4 mb-2">$1</h2>')
                          .replace(/### (.*?)(\n|$)/g, '<h3 class="text-base font-semibold text-foreground mt-3 mb-1">$1</h3>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                          .replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>')
                          .replace(/^(\d+)\. (.*?)$/gm, '<li class="ml-4 list-decimal">$2</li>')
                          .replace(/\n/g, '<br/>')
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Receitas Salvas */}
          <TabsContent value="saved" className="space-y-4">
            {loadingRecipes ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : savedRecipes.length === 0 ? (
              <Card variant="dashboard" className="p-8 text-center">
                <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Você ainda não salvou nenhuma receita.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab("generate")}
                >
                  Gerar primeira receita
                </Button>
              </Card>
            ) : (
              savedRecipes.map((savedRecipe) => (
                <RecipeCard
                  key={savedRecipe.id}
                  recipe={savedRecipe}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteRecipe}
                />
              ))
            )}
          </TabsContent>

          {/* Tab: Favoritas */}
          <TabsContent value="favorites" className="space-y-4">
            {loadingRecipes ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : favoriteRecipes.length === 0 ? (
              <Card variant="dashboard" className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Você ainda não tem receitas favoritas.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab("saved")}
                >
                  Ver receitas salvas
                </Button>
              </Card>
            ) : (
              favoriteRecipes.map((savedRecipe) => (
                <RecipeCard
                  key={savedRecipe.id}
                  recipe={savedRecipe}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteRecipe}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}

// Componente de Card de Receita Salva
function RecipeCard({
  recipe,
  onToggleFavorite,
  onDelete,
}: {
  recipe: SavedRecipe;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="dashboard">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ChefHat className="w-5 h-5 text-primary" />
              {recipe.title}
              {recipe.is_favorite && (
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              )}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(recipe.created_at).toLocaleDateString("pt-BR")}
              </span>
              <span>{recipe.ingredients.length} ingredientes</span>
            </div>
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavorite(recipe.id, recipe.is_favorite)}
              className={recipe.is_favorite ? "text-red-500" : "text-muted-foreground"}
            >
              <Heart className={`h-4 w-4 ${recipe.is_favorite ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(recipe.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 animate-fade-in">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Ingredientes:</p>
            <div className="flex flex-wrap gap-1">
              {recipe.ingredients.map((ing) => (
                <Badge key={ing} variant="outline" className="capitalize text-xs">
                  {ing}
                </Badge>
              ))}
            </div>
          </div>
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-sm">
              {recipe.recipe_content}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
