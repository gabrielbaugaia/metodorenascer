import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Utensils, Loader2, Apple } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NutritionProtocol {
  id: string;
  conteudo: any;
}


export default function Nutricao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [protocol, setProtocol] = useState<NutritionProtocol | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProtocol = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("protocolos")
          .select("id, conteudo")
          .eq("user_id", user.id)
          .eq("tipo", "nutricao")
          .eq("ativo", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching nutrition protocol:", error);
        } else if (data) {
          setProtocol(data as NutritionProtocol);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocol();
  }, [user]);

  const conteudo = protocol?.conteudo || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 px-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

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
              {conteudo.refeicoes && conteudo.refeicoes.length > 0 
                ? "Seu cardápio estratégico para máxima performance"
                : "Seu protocolo nutricional será gerado em breve"}
            </p>
          </div>

          {(!conteudo.refeicoes || conteudo.refeicoes.length === 0) ? (
            <Card className="p-8 text-center">
              <Utensils className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum plano nutricional disponível</h3>
              <p className="text-muted-foreground mb-4">
                Complete sua anamnese para receber seu protocolo nutricional personalizado.
              </p>
              <Button variant="fire" onClick={() => navigate("/anamnese")}>
                Completar Anamnese
              </Button>
            </Card>
          ) : (
            <>
              {/* Macros overview */}
              {conteudo.macros && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <Card className="p-4 text-center bg-primary/10">
                    <p className="text-2xl font-bold text-primary">
                      {conteudo.calorias_diarias || conteudo.macros.calorias_diarias || "--"}
                    </p>
                    <p className="text-xs text-muted-foreground">Calorias/dia</p>
                  </Card>
                  <Card className="p-4 text-center bg-blue-500/10">
                    <p className="text-2xl font-bold text-blue-500">
                      {conteudo.macros.proteinas_g || "--"}g
                    </p>
                    <p className="text-xs text-muted-foreground">Proteínas</p>
                  </Card>
                  <Card className="p-4 text-center bg-green-500/10">
                    <p className="text-2xl font-bold text-green-500">
                      {conteudo.macros.carboidratos_g || "--"}g
                    </p>
                    <p className="text-xs text-muted-foreground">Carboidratos</p>
                  </Card>
                </div>
              )}

              {/* Meals */}
              <div className="space-y-4">
                {conteudo.refeicoes?.map((refeicao: any, index: number) => (
                  <Card
                    key={index}
                    className="border border-border/60"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                          <Apple className="w-5 h-5 text-primary" />
                          <span className="font-display">{refeicao.nome}</span>
                        </CardTitle>
                        <Badge variant="outline">{refeicao.horario}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {refeicao.alimentos?.map((alimento: any, aIndex: number) => (
                          <li
                            key={aIndex}
                            className="text-sm text-muted-foreground flex justify-between"
                          >
                            <span>
                              {typeof alimento === "string" ? alimento : alimento.item}
                            </span>
                            {alimento.calorias && (
                              <span>{alimento.calorias} kcal</span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {refeicao.calorias_total && (
                        <p className="text-sm font-medium mt-2 text-right">
                          Total: {refeicao.calorias_total} kcal
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Tips */}
              {conteudo.dicas && conteudo.dicas.length > 0 && (
                <Card className="mt-6 p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Dica do dia:</strong> {conteudo.dicas[0]}
                  </p>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
