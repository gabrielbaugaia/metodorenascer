import { useNavigate } from "react-router-dom";
import { useProtocol } from "@/hooks/useProtocol";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, Loader2, Apple, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generateProtocolPdf } from "@/lib/generateProtocolPdf";
import { toast } from "sonner";
import { useState } from "react";

interface Macros {
  proteinas_g?: number;
  carboidratos_g?: number;
  gorduras_g?: number;
  lipidios_g?: number;
  calorias_diarias?: number;
}

interface Refeicao {
  nome: string;
  horario?: string;
  alimentos?: (string | { item: string; calorias?: number })[];
  calorias_total?: number;
}

interface NutritionContent {
  refeicoes?: Refeicao[];
  macros?: Macros;
  calorias_diarias?: number;
  dicas?: string[];
}

export default function Nutricao() {
  const navigate = useNavigate();
  const { protocol, loading } = useProtocol("nutricao");
  const [downloading, setDownloading] = useState(false);

  const conteudo = (protocol?.conteudo as NutritionContent) || {};
  const refeicoes = conteudo.refeicoes || [];
  const macros = conteudo.macros;
  const dicas = conteudo.dicas || [];

  const handleDownloadPdf = () => {
    if (!protocol) return;
    setDownloading(true);
    try {
      generateProtocolPdf({
        id: protocol.id,
        tipo: "nutricao",
        titulo: protocol.titulo,
        conteudo: protocol.conteudo,
        data_geracao: protocol.data_geracao || new Date().toISOString(),
      });
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shrink-0">
              <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-3xl text-foreground truncate">
                Plano <span className="text-gradient">Nutricional</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {refeicoes.length > 0 
                  ? "Seu cardápio estratégico para máxima performance"
                  : "Seu protocolo será gerado em breve"}
              </p>
            </div>
          </div>
          {protocol && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? "Baixando..." : "Baixar PDF"}
            </Button>
          )}
        </div>

        {refeicoes.length === 0 ? (
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
            {macros && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-4 text-center bg-primary/10">
                  <p className="text-xl md:text-2xl font-bold text-primary">
                    {conteudo.calorias_diarias || macros.calorias_diarias || "--"}
                  </p>
                  <p className="text-xs text-muted-foreground">kcal/dia</p>
                </Card>
                <Card className="p-4 text-center bg-blue-500/10">
                  <p className="text-xl md:text-2xl font-bold text-blue-500">
                    {macros.proteinas_g || "--"}g
                  </p>
                  <p className="text-xs text-muted-foreground">Proteínas</p>
                </Card>
                <Card className="p-4 text-center bg-green-500/10">
                  <p className="text-xl md:text-2xl font-bold text-green-500">
                    {macros.carboidratos_g || "--"}g
                  </p>
                  <p className="text-xs text-muted-foreground">Carboidratos</p>
                </Card>
                <Card className="p-4 text-center bg-yellow-500/10">
                  <p className="text-xl md:text-2xl font-bold text-yellow-500">
                    {macros.gorduras_g || macros.lipidios_g || "--"}g
                  </p>
                  <p className="text-xs text-muted-foreground">Gorduras</p>
                </Card>
              </div>
            )}

            {/* Meals */}
            <div className="space-y-4">
              {refeicoes.map((refeicao, index) => (
                <Card key={index} className="border border-border/60">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <Apple className="w-5 h-5 text-primary" />
                        <span className="font-display">{refeicao.nome}</span>
                      </CardTitle>
                      {refeicao.horario && <Badge variant="outline">{refeicao.horario}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {refeicao.alimentos?.map((alimento, aIndex) => (
                        <li key={aIndex} className="text-sm text-muted-foreground flex justify-between">
                          <span>{typeof alimento === "string" ? alimento : alimento.item}</span>
                          {typeof alimento !== "string" && alimento.calorias && (
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
            {dicas.length > 0 && (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Dica do dia:</strong> {dicas[0]}
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </ClientLayout>
  );
}
