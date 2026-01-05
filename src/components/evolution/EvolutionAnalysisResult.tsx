import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Dumbbell,
  Utensils,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Scale,
  Flame,
  Download,
  Loader2,
  MoveRight
} from "lucide-react";
import { useState } from "react";
import { generateAnalysisPdf } from "@/lib/generateAnalysisPdf";

interface EvolutionAnalysis {
  resumoGeral: string;
  mudancasObservadas?: {
    composicaoCorporal?: {
      gorduraCorporal: string;
      descricaoGordura: string;
      massaMuscular: string;
      descricaoMuscular: string;
      definicaoGeral: string;
    };
    frente?: {
      mudancasPositivas: string[];
      areasAtencao: string[];
      observacoes: string;
    };
    lado?: {
      mudancasPositivas: string[];
      areasAtencao: string[];
      observacoes: string;
    };
    costas?: {
      mudancasPositivas: string[];
      areasAtencao: string[];
      observacoes: string;
    };
    postura?: {
      mudou: boolean;
      descricao: string;
    };
  };
  analisePeso?: {
    variacao: string;
    interpretacao: string;
    tendencia: string;
  };
  ajustesTreino?: {
    manutencao: string[];
    intensificar: string[];
    adicionar: string[];
    observacoes: string;
  };
  ajustesDieta?: {
    calorias: string;
    proteina: string;
    carboidratos: string;
    sugestoes: string[];
    observacoes: string;
  };
  metasProximos30Dias?: string[];
  pontuacaoEvolucao?: {
    nota: number;
    justificativa: string;
  };
  mensagemMotivacional?: string;
}

interface PhotoComparison {
  initialFronte?: string | null;
  initialLado?: string | null;
  initialCostas?: string | null;
  currentFrente?: string | null;
  currentLado?: string | null;
  currentCostas?: string | null;
}

interface EvolutionAnalysisResultProps {
  analysis: EvolutionAnalysis;
  photos?: PhotoComparison;
  clientName?: string;
  checkinDate?: Date;
  showPhotoComparison?: boolean;
}

function TrendIcon({ trend }: { trend: string }) {
  const trendLower = trend.toLowerCase();
  if (trendLower.includes("aument") || trendLower.includes("positiv") || trendLower.includes("melhor")) {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  }
  if (trendLower.includes("diminu") || trendLower.includes("negativ") || trendLower.includes("pior") || trendLower.includes("reduz")) {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function MacroBadge({ label, value }: { label: string; value: string }) {
  const valueLower = value.toLowerCase();
  let variant: "default" | "secondary" | "outline" = "outline";
  let color = "";
  
  if (valueLower.includes("aumentar")) {
    variant = "default";
    color = "bg-green-500/20 text-green-400 border-green-500/30";
  } else if (valueLower.includes("reduzir")) {
    variant = "secondary";
    color = "bg-red-500/20 text-red-400 border-red-500/30";
  }
  
  return (
    <div className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-muted/30">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant={variant} className={color}>{value}</Badge>
    </div>
  );
}

export function EvolutionAnalysisResult({ 
  analysis, 
  photos,
  clientName = "Cliente",
  checkinDate,
  showPhotoComparison = false
}: EvolutionAnalysisResultProps) {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Handle legacy string format
  if (typeof analysis === 'string') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
            {analysis}
          </div>
        </CardContent>
      </Card>
    );
  }

  const score = analysis.pontuacaoEvolucao?.nota || 0;
  const scoreColor = score >= 8 ? "text-green-500" : score >= 6 ? "text-yellow-500" : "text-orange-500";

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      await generateAnalysisPdf({
        clientName,
        analysis,
        photos,
        checkinDate
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const hasPhotos = photos && (
    (photos.initialFronte || photos.initialLado || photos.initialCostas) &&
    (photos.currentFrente || photos.currentLado || photos.currentCostas)
  );

  return (
    <div className="space-y-4">
      {/* Photo Comparison - Before/After Side by Side */}
      {showPhotoComparison && hasPhotos && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MoveRight className="h-5 w-5 text-primary" />
              Comparação Visual: Antes vs Depois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Frente */}
              {(photos.initialFronte || photos.currentFrente) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Vista Frontal</h4>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                      {photos.initialFronte ? (
                        <img src={photos.initialFronte} alt="Antes - Frente" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Não disponível</div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-1 text-center">
                        <span className="text-xs font-medium">ANTES</span>
                      </div>
                    </div>
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted border-2 border-primary/30">
                      {photos.currentFrente ? (
                        <img src={photos.currentFrente} alt="Depois - Frente" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Não disponível</div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/80 p-1 text-center">
                        <span className="text-xs font-medium text-primary-foreground">DEPOIS</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lado */}
              {(photos.initialLado || photos.currentLado) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Vista Lateral</h4>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                      {photos.initialLado ? (
                        <img src={photos.initialLado} alt="Antes - Lado" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Não disponível</div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-1 text-center">
                        <span className="text-xs font-medium">ANTES</span>
                      </div>
                    </div>
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted border-2 border-primary/30">
                      {photos.currentLado ? (
                        <img src={photos.currentLado} alt="Depois - Lado" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Não disponível</div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/80 p-1 text-center">
                        <span className="text-xs font-medium text-primary-foreground">DEPOIS</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Costas */}
              {(photos.initialCostas || photos.currentCostas) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Vista Posterior</h4>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                      {photos.initialCostas ? (
                        <img src={photos.initialCostas} alt="Antes - Costas" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Não disponível</div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-1 text-center">
                        <span className="text-xs font-medium">ANTES</span>
                      </div>
                    </div>
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted border-2 border-primary/30">
                      {photos.currentCostas ? (
                        <img src={photos.currentCostas} alt="Depois - Costas" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Não disponível</div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/80 p-1 text-center">
                        <span className="text-xs font-medium text-primary-foreground">DEPOIS</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pontuação e Resumo */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Análise da Sua Evolução
            </CardTitle>
            <div className="flex items-center gap-3">
              {analysis.pontuacaoEvolucao && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Nota:</span>
                  <span className={`text-2xl font-bold ${scoreColor}`}>
                    {score}/10
                  </span>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadPdf}
                disabled={generatingPdf}
              >
                {generatingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed mb-3">{analysis.resumoGeral}</p>
          {analysis.pontuacaoEvolucao?.justificativa && (
            <p className="text-xs text-muted-foreground italic">
              {analysis.pontuacaoEvolucao.justificativa}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Análise de Peso */}
      {analysis.analisePeso && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4" />
              Análise do Peso
              <TrendIcon trend={analysis.analisePeso.tendencia} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {analysis.analisePeso.variacao}
              </Badge>
              <Badge 
                variant={analysis.analisePeso.tendencia === "positiva" ? "default" : "secondary"}
                className={analysis.analisePeso.tendencia === "positiva" ? "bg-green-500/20 text-green-400" : ""}
              >
                {analysis.analisePeso.tendencia}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.analisePeso.interpretacao}</p>
          </CardContent>
        </Card>
      )}

      {/* Mudanças na Composição Corporal */}
      {analysis.mudancasObservadas?.composicaoCorporal && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4" />
              Composição Corporal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendIcon trend={analysis.mudancasObservadas.composicaoCorporal.gorduraCorporal} />
                  <span className="text-sm font-medium">Gordura</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {analysis.mudancasObservadas.composicaoCorporal.descricaoGordura}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendIcon trend={analysis.mudancasObservadas.composicaoCorporal.massaMuscular} />
                  <span className="text-sm font-medium">Massa Muscular</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {analysis.mudancasObservadas.composicaoCorporal.descricaoMuscular}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <TrendIcon trend={analysis.mudancasObservadas.composicaoCorporal.definicaoGeral} />
                  <span className="text-sm font-medium">Definição</span>
                </div>
                <Badge variant="outline" className="capitalize">
                  {analysis.mudancasObservadas.composicaoCorporal.definicaoGeral}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mudanças por Ângulo */}
      {analysis.mudancasObservadas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["frente", "lado", "costas"].map((angle) => {
            const data = analysis.mudancasObservadas?.[angle as keyof typeof analysis.mudancasObservadas];
            if (!data || typeof data !== 'object' || !('mudancasPositivas' in data)) return null;
            
            return (
              <Card key={angle} className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm capitalize">{angle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.mudancasPositivas?.length > 0 && (
                    <div>
                      <p className="text-xs text-green-500 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Melhorias
                      </p>
                      <ul className="space-y-1">
                        {data.mudancasPositivas.map((m: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground">• {m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.areasAtencao?.length > 0 && (
                    <div>
                      <p className="text-xs text-orange-500 mb-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Atenção
                      </p>
                      <ul className="space-y-1">
                        {data.areasAtencao.map((a: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground">• {a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Ajustes de Treino */}
      {analysis.ajustesTreino && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-blue-400">
              <Dumbbell className="h-4 w-4" />
              Ajustes no Treino
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.ajustesTreino.intensificar?.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" /> Intensificar
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.ajustesTreino.intensificar.map((item, i) => (
                    <Badge key={i} variant="outline" className="border-green-500/50 text-green-400">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {analysis.ajustesTreino.adicionar?.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2 flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" /> Adicionar
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.ajustesTreino.adicionar.map((item, i) => (
                    <Badge key={i} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {analysis.ajustesTreino.manutencao?.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2">Manter ênfase</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.ajustesTreino.manutencao.map((item, i) => (
                    <Badge key={i} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {analysis.ajustesTreino.observacoes && (
              <p className="text-xs text-muted-foreground italic mt-2">
                {analysis.ajustesTreino.observacoes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ajustes de Dieta */}
      {analysis.ajustesDieta && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-orange-400">
              <Utensils className="h-4 w-4" />
              Ajustes na Dieta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <MacroBadge label="Calorias" value={analysis.ajustesDieta.calorias} />
              <MacroBadge label="Proteína" value={analysis.ajustesDieta.proteina} />
              <MacroBadge label="Carboidratos" value={analysis.ajustesDieta.carboidratos} />
            </div>
            {analysis.ajustesDieta.sugestoes?.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2">Sugestões específicas:</p>
                <ul className="space-y-1">
                  {analysis.ajustesDieta.sugestoes.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ArrowRight className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.ajustesDieta.observacoes && (
              <p className="text-xs text-muted-foreground italic">
                {analysis.ajustesDieta.observacoes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metas dos Próximos 30 Dias */}
      {analysis.metasProximos30Dias && analysis.metasProximos30Dias.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Metas para os Próximos 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.metasProximos30Dias.map((meta, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs text-primary font-bold">{i + 1}</span>
                  </div>
                  <span className="text-sm">{meta}</span>
                </li>
              ))}
            </ul>
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
            <p className="text-center text-xs text-muted-foreground mt-2">
              — Gabriel Baú, seu mentor
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
