import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Utensils, Flame, Droplets, Beef, Cookie } from "lucide-react";

const dailyMeals = [
  {
    time: "07:00",
    meal: "Café da Manhã",
    foods: ["3 ovos mexidos", "2 fatias de pão integral", "1 banana", "200ml de café"],
    calories: 450,
  },
  {
    time: "10:00",
    meal: "Lanche da Manhã",
    foods: ["1 scoop de whey", "1 maçã", "30g de amendoim"],
    calories: 280,
  },
  {
    time: "13:00",
    meal: "Almoço",
    foods: ["150g de frango grelhado", "100g de arroz integral", "Salada verde à vontade", "1 colher de azeite"],
    calories: 520,
  },
  {
    time: "16:00",
    meal: "Lanche da Tarde",
    foods: ["200g de iogurte natural", "50g de granola", "1 banana"],
    calories: 350,
  },
  {
    time: "19:00",
    meal: "Jantar",
    foods: ["150g de salmão", "200g de batata doce", "Brócolis refogado", "Azeite"],
    calories: 550,
  },
  {
    time: "21:30",
    meal: "Ceia",
    foods: ["Caseína ou 150g de cottage", "1 colher de pasta de amendoim"],
    calories: 200,
  },
];

const macros = {
  calories: { current: 2350, target: 2400, unit: "kcal", icon: Flame, color: "text-orange-500" },
  protein: { current: 180, target: 190, unit: "g", icon: Beef, color: "text-red-500" },
  carbs: { current: 250, target: 280, unit: "g", icon: Cookie, color: "text-yellow-500" },
  water: { current: 2.5, target: 3, unit: "L", icon: Droplets, color: "text-blue-500" },
};

export default function Nutricao() {
  const navigate = useNavigate();

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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-display text-4xl text-foreground">
                Plano <span className="text-gradient">Nutricional</span>
              </h1>
            </div>
            <p className="text-muted-foreground">
              Seu cardápio estratégico para máxima performance
            </p>
          </div>

          {/* Macros overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(macros).map(([key, value]) => (
              <Card key={key} variant="glass" className="p-4 text-center">
                <value.icon className={`w-6 h-6 mx-auto mb-2 ${value.color}`} />
                <p className="text-2xl font-bold text-foreground">
                  {value.current}
                  <span className="text-sm text-muted-foreground">{value.unit}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  de {value.target}{value.unit}
                </p>
                <div className="progress-bar mt-2 h-1">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${(value.current / value.target) * 100}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Meals */}
          <div className="space-y-4">
            {dailyMeals.map((meal, index) => (
              <Card
                key={meal.meal}
                variant="dashboard"
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-sm text-primary font-mono">{meal.time}</span>
                      <span className="font-display">{meal.meal}</span>
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {meal.calories} kcal
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {meal.foods.map((food) => (
                      <li key={food} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {food}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tips */}
          <Card variant="glass" className="mt-6 p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Dica do dia:</strong> Mantenha-se hidratado! 
              Beba água antes das refeições para melhorar a digestão e controlar o apetite.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
