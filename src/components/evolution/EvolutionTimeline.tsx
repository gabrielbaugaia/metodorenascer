import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EvolutionAnalysisResult } from "./EvolutionAnalysisResult";
import { formatAiContent } from "@/lib/sanitize";
import {
  Calendar,
  Scale,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Camera,
  Clock,
} from "lucide-react";

interface CheckIn {
  id: string;
  created_at: string;
  peso_atual: number | null;
  notas: string | null;
  foto_url: string | null;
  semana_numero: number | null;
  ai_analysis: string | null;
}

interface SignedPhotos {
  frente?: string | null;
  lado?: string | null;
  costas?: string | null;
  single?: string | null;
}

interface InitialPhotos {
  frente?: string | null;
  lado?: string | null;
  costas?: string | null;
}

interface EvolutionTimelineProps {
  checkins: CheckIn[];
  checkinPhotoSrc: Record<string, SignedPhotos>;
  initialWeight?: number | null;
  initialPhotos?: InitialPhotos;
  clientName?: string;
}

function parseAnalysis(analysisStr: string | null): { structured: boolean; data: any } {
  if (!analysisStr) return { structured: false, data: null };
  
  try {
    const parsed = JSON.parse(analysisStr);
    // Check if it has the expected structure
    if (parsed.resumoGeral || parsed.mudancasObservadas || parsed.ajustesTreino) {
      return { structured: true, data: parsed };
    }
    return { structured: false, data: analysisStr };
  } catch {
    return { structured: false, data: analysisStr };
  }
}

export function EvolutionTimeline({ 
  checkins, 
  checkinPhotoSrc, 
  initialWeight,
  initialPhotos,
  clientName = "Cliente"
}: EvolutionTimelineProps) {
  const [expandedCheckins, setExpandedCheckins] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedCheckins(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (checkins.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium mb-2">Nenhuma evolução registrada</h3>
          <p className="text-sm text-muted-foreground">
            Os check-ins de evolução aparecerão aqui após serem enviados.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate weight progression
  const weightData = checkins
    .filter(c => c.peso_atual)
    .map(c => ({ date: new Date(c.created_at), weight: c.peso_atual! }))
    .reverse();

  const totalWeightChange = weightData.length > 1 
    ? weightData[weightData.length - 1].weight - (initialWeight || weightData[0].weight)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Timeline de Evolução
          </CardTitle>
          {checkins.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {checkins.length} check-in{checkins.length > 1 ? "s" : ""}
              </Badge>
              {totalWeightChange !== 0 && (
                <Badge 
                  variant={totalWeightChange < 0 ? "default" : "secondary"}
                  className={`text-xs ${totalWeightChange < 0 ? "bg-green-500/20 text-green-400" : ""}`}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {totalWeightChange > 0 ? "+" : ""}{totalWeightChange.toFixed(1)} kg
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-3">
            {checkins.map((checkin, index) => {
              const signed = checkinPhotoSrc[checkin.id];
              const isExpanded = expandedCheckins.has(checkin.id);
              const analysis = parseAnalysis(checkin.ai_analysis);
              const hasPhotos = signed?.frente || signed?.lado || signed?.costas || signed?.single;
              
              // Calculate weight change from previous
              const prevCheckin = checkins[index + 1];
              const weightChange = checkin.peso_atual && prevCheckin?.peso_atual
                ? checkin.peso_atual - prevCheckin.peso_atual
                : null;

              return (
                <div key={checkin.id} className="relative pl-8">
                  {/* Timeline dot */}
                  <div className="absolute left-1.5 top-2 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />

                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(checkin.id)}>
                    <div className="py-2 px-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
                      {/* Header */}
                      <CollapsibleTrigger asChild>
                        <button className="w-full text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                                <span className="font-medium text-sm sm:text-base">
                                  {format(new Date(checkin.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </div>
                              {checkin.semana_numero && (
                                <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0">
                                  Sem. {checkin.semana_numero}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                              {checkin.peso_atual && (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <span className="flex items-center gap-1 text-xs sm:text-sm">
                                    <Scale className="h-3 w-3" />
                                    {checkin.peso_atual} kg
                                  </span>
                                  {weightChange !== null && weightChange !== 0 && (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-[10px] sm:text-xs px-1 ${weightChange < 0 ? "text-green-500 border-green-500/50" : "text-orange-500 border-orange-500/50"}`}
                                    >
                                      {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                            </div>
                          </div>
                          
                          {/* Quick indicators */}
                          {!isExpanded && (
                            <div className="flex items-center gap-2 mt-2">
                              {hasPhotos && (
                                <Badge variant="secondary" className="text-xs">
                                  <Camera className="h-3 w-3 mr-1" />
                                  Fotos
                                </Badge>
                              )}
                              {analysis.data && (
                                <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Análise IA
                                </Badge>
                              )}
                            </div>
                          )}
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                          {/* Photos */}
                          {hasPhotos && (
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                              {signed?.frente && (
                                <div className="relative aspect-[3/4] rounded-md sm:rounded-lg overflow-hidden bg-muted">
                                  <img src={signed.frente} alt="Evolução - Frente" className="w-full h-full object-cover" loading="lazy" />
                                  <span className="absolute bottom-0.5 left-0.5 sm:bottom-1 sm:left-1 text-[9px] sm:text-xs bg-black/70 px-1 sm:px-1.5 py-0.5 rounded">Frente</span>
                                </div>
                              )}
                              {signed?.lado && (
                                <div className="relative aspect-[3/4] rounded-md sm:rounded-lg overflow-hidden bg-muted">
                                  <img src={signed.lado} alt="Evolução - Lado" className="w-full h-full object-cover" loading="lazy" />
                                  <span className="absolute bottom-0.5 left-0.5 sm:bottom-1 sm:left-1 text-[9px] sm:text-xs bg-black/70 px-1 sm:px-1.5 py-0.5 rounded">Lado</span>
                                </div>
                              )}
                              {signed?.costas && (
                                <div className="relative aspect-[3/4] rounded-md sm:rounded-lg overflow-hidden bg-muted">
                                  <img src={signed.costas} alt="Evolução - Costas" className="w-full h-full object-cover" loading="lazy" />
                                  <span className="absolute bottom-0.5 left-0.5 sm:bottom-1 sm:left-1 text-[9px] sm:text-xs bg-black/70 px-1 sm:px-1.5 py-0.5 rounded">Costas</span>
                                </div>
                              )}
                              {signed?.single && !signed?.frente && !signed?.lado && !signed?.costas && (
                                <div className="aspect-[3/4] rounded-md sm:rounded-lg overflow-hidden bg-muted col-span-3 max-w-[200px]">
                                  <img src={signed.single} alt="Evolução" className="w-full h-full object-cover" loading="lazy" />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Notes */}
                          {checkin.notas && (
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-sm text-muted-foreground">{checkin.notas}</p>
                            </div>
                          )}

                          {/* AI Analysis */}
                          {analysis.data && (
                            <div className="border-t border-border/30 pt-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">Análise do Mentor</span>
                              </div>
                              
                              {analysis.structured ? (
                                <EvolutionAnalysisResult 
                                  analysis={analysis.data}
                                  clientName={clientName}
                                  checkinDate={new Date(checkin.created_at)}
                                  showPhotoComparison={true}
                                  photos={{
                                    initialFronte: initialPhotos?.frente,
                                    initialLado: initialPhotos?.lado,
                                    initialCostas: initialPhotos?.costas,
                                    currentFrente: signed?.frente,
                                    currentLado: signed?.lado,
                                    currentCostas: signed?.costas
                                  }}
                                />
                              ) : (
                                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                  <div
                                    className="text-sm leading-relaxed whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{
                                      __html: formatAiContent(analysis.data, "compact"),
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
