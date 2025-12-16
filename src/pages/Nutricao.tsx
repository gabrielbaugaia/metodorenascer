import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, Loader2, Apple, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateProtocolPdf } from "@/lib/generateProtocolPdf";
import { toast } from "sonner";

interface NutritionProtocol {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: any;
  data_geracao: string;
}


export default function Nutricao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [protocol, setProtocol] = useState<NutritionProtocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchProtocol = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("protocolos")
          .select("id, tipo, titulo, conteudo, data_geracao")
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

  const handleDownloadPdf = () => {
    if (!protocol) return;
    setDownloading(true);
    try {
      generateProtocolPdf(protocol);
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-foreground">
                Plano <span className="text-gradient">Nutricional</span>
              </h1>
              <p className="text-muted-foreground text-sm">
                {conteudo.refeicoes && conteudo.refeicoes.length > 0 
                  ? "Seu cardápio estratégico para máxima performance"
                  : "Seu protocolo será gerado em breve"}
              </p>
            </div>
          </div>
          {protocol && (
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={downloading}
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? "Baixando..." : "Baixar PDF"}
            </Button>
          )}
        </div>

        {(!conteudo.refeicoes || conteudo.refeicoes.length === 0) ? (
          <Card className="p-8 text-center">
            <Utensils className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum plano nutricional disponível</h3>
            <p className="text-muted-foreground mb-4">
              Seu protocolo nutricional será gerado em breve. Fale com seu mentor para mais informações.
            </p>
            <Button variant="fire" onClick={() => navigate("/suporte")}>
              Falar com Mentor
            </Button>
          </Card>
        ) : (
          <>
            {/* Macros overview */}
            {conteudo.macros && (
              <div className="grid grid-cols-3 gap-4">
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
                <Card key={index} className="border border-border/60">
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
                        <li key={aIndex} className="text-sm text-muted-foreground flex justify-between">
                          <span>{typeof alimento === "string" ? alimento : alimento.item}</span>
                          {alimento.calorias && <span>{alimento.calorias} kcal</span>}
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
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Dica do dia:</strong> {conteudo.dicas[0]}
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </ClientLayout>
  );
}
