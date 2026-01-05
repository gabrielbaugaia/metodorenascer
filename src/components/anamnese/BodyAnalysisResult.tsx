import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Activity, 
  Target, 
  Dumbbell, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

interface BodyAnalysis {
  resumoGeral: string;
  biotipo?: {
    tipo: string;
    descricao: string;
  };
  composicaoCorporal?: {
    percentualGorduraEstimado: string;
    classificacao: string;
    distribuicaoGordura: string;
    massaMuscular: string;
  };
  analisePostural?: {
    cabeca: string;
    ombros: string;
    coluna: string;
    quadril: string;
    joelhos: string;
    observacoes: string;
  };
  analiseFrente?: {
    pontosFortePrincipais: string[];
    areasDesenvolver: string[];
    simetria: string;
    observacoes: string;
  };
  analiseLado?: {
    posturaGeral: string;
    desenvolvimentoPeitoral: string;
    desenvolvimentoCostas: string;
    abdomen: string;
    observacoes: string;
  };
  analiseCostas?: {
    larguraCostas: string;
    desenvolvimentoDorsais: string;
    trapezio: string;
    simetriaLombar: string;
    observacoes: string;
  };
  gruposMuscularesDestaque?: {
    pontosFortes: string[];
    pontosFracos: string[];
  };
  recomendacoes?: {
    treino: string[];
    postura: string[];
    prioridades: string[];
  };
  mensagemMotivacional?: string;
  error?: string;
}

interface BodyAnalysisResultProps {
  analysis: BodyAnalysis;
}

function MetricBadge({ label, value, variant = "default" }: { label: string; value: string; variant?: "default" | "secondary" | "outline" }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Badge variant={variant} className="justify-center">{value}</Badge>
    </div>
  );
}

export function BodyAnalysisResult({ analysis }: BodyAnalysisResultProps) {
  if (analysis.error && !analysis.biotipo) {
    return (
      <Card className="border-yellow-500/50 bg-yellow-500/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertCircle className="h-5 w-5" />
            <p>{analysis.resumoGeral || "Análise temporariamente indisponível."}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo Geral */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Resumo da Avaliação Física
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{analysis.resumoGeral}</p>
        </CardContent>
      </Card>

      {/* Biotipo e Composição */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.biotipo && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Biotipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="mb-2 capitalize">
                {analysis.biotipo.tipo}
              </Badge>
              <p className="text-sm text-muted-foreground">{analysis.biotipo.descricao}</p>
            </CardContent>
          </Card>
        )}

        {analysis.composicaoCorporal && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                Composição Corporal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <MetricBadge 
                  label="% Gordura Est." 
                  value={analysis.composicaoCorporal.percentualGorduraEstimado} 
                />
                <MetricBadge 
                  label="Classificação" 
                  value={analysis.composicaoCorporal.classificacao} 
                />
                <MetricBadge 
                  label="Massa Muscular" 
                  value={analysis.composicaoCorporal.massaMuscular} 
                  variant="secondary"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Distribuição: {analysis.composicaoCorporal.distribuicaoGordura}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Análise Postural */}
      {analysis.analisePostural && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Análise Postural
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
              <MetricBadge label="Cabeça" value={analysis.analisePostural.cabeca} variant="outline" />
              <MetricBadge label="Ombros" value={analysis.analisePostural.ombros} variant="outline" />
              <MetricBadge label="Coluna" value={analysis.analisePostural.coluna} variant="outline" />
              <MetricBadge label="Quadril" value={analysis.analisePostural.quadril} variant="outline" />
              <MetricBadge label="Joelhos" value={analysis.analisePostural.joelhos} variant="outline" />
            </div>
            {analysis.analisePostural.observacoes && (
              <p className="text-sm text-muted-foreground">{analysis.analisePostural.observacoes}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pontos Fortes e Fracos */}
      {analysis.gruposMuscularesDestaque && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Pontos Fortes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.gruposMuscularesDestaque.pontosFortes?.map((ponto, i) => (
                  <Badge key={i} variant="outline" className="border-green-500/50 text-green-600">
                    {ponto}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-orange-600">
                <Dumbbell className="h-4 w-4" />
                Áreas para Desenvolver
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.gruposMuscularesDestaque.pontosFracos?.map((ponto, i) => (
                  <Badge key={i} variant="outline" className="border-orange-500/50 text-orange-600">
                    {ponto}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recomendações */}
      {analysis.recomendacoes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.recomendacoes.prioridades && analysis.recomendacoes.prioridades.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">🎯 Prioridades</h4>
                <ul className="space-y-1">
                  {analysis.recomendacoes.prioridades.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.recomendacoes.treino && analysis.recomendacoes.treino.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">💪 Treino</h4>
                <ul className="space-y-1">
                  {analysis.recomendacoes.treino.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.recomendacoes.postura && analysis.recomendacoes.postura.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">🧘 Postura</h4>
                <ul className="space-y-1">
                  {analysis.recomendacoes.postura.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensagem Motivacional */}
      {analysis.mensagemMotivacional && (
        <Card className="border-primary bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <p className="text-center italic text-sm">
              "{analysis.mensagemMotivacional}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
