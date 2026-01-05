import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EvolutionAnalysisResult } from "@/components/evolution/EvolutionAnalysisResult";
import { createBodyPhotosSignedUrl } from "@/lib/bodyPhotos";
import { generateEvolutionPdf } from "@/lib/generateEvolutionPdf";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Scale,
  Loader2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Camera,
  Dumbbell,
  Utensils,
  FileDown,
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

interface AdminEvolutionSectionProps {
  clientId: string;
  clientName: string;
  initialWeight: number | null;
  planType: string | null;
  initialPhotoPaths?: {
    frente: string | null;
    lado: string | null;
    costas: string | null;
  };
  onProtocolsGenerated?: () => void;
}

function parseAnalysis(analysisStr: string | null): { structured: boolean; data: any } {
  if (!analysisStr) return { structured: false, data: null };
  
  try {
    const parsed = JSON.parse(analysisStr);
    if (parsed.resumoGeral || parsed.mudancasObservadas || parsed.ajustesTreino) {
      return { structured: true, data: parsed };
    }
    return { structured: false, data: analysisStr };
  } catch {
    return { structured: false, data: analysisStr };
  }
}

export function AdminEvolutionSection({ 
  clientId, 
  clientName, 
  initialWeight,
  planType,
  initialPhotoPaths,
  onProtocolsGenerated 
}: AdminEvolutionSectionProps) {
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinPhotoSrc, setCheckinPhotoSrc] = useState<Record<string, SignedPhotos>>({});
  const [initialPhotosSigned, setInitialPhotosSigned] = useState<InitialPhotos>({});
  const [expandedCheckin, setExpandedCheckin] = useState<string | null>(null);
  const [generatingProtocols, setGeneratingProtocols] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    fetchCheckins();
    fetchInitialPhotos();
  }, [clientId]);

  const signOrNull = async (value: string | null) => {
    if (!value) return null;
    try {
      return await createBodyPhotosSignedUrl(value);
    } catch (e) {
      console.warn("Não foi possível gerar URL assinada:", e);
      return null;
    }
  };

  const fetchInitialPhotos = async () => {
    if (!initialPhotoPaths) return;
    
    const [frente, lado, costas] = await Promise.all([
      signOrNull(initialPhotoPaths.frente),
      signOrNull(initialPhotoPaths.lado),
      signOrNull(initialPhotoPaths.costas),
    ]);
    
    setInitialPhotosSigned({ frente, lado, costas });
  };

  const fetchCheckins = async () => {
    try {
      const { data, error } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCheckins(data || []);

      // Hydrate photos
      if (data && data.length > 0) {
        const entries = await Promise.all(
          data.map(async (checkin): Promise<[string, SignedPhotos]> => {
            const raw = checkin.foto_url;
            let parsed: { frente?: string; lado?: string; costas?: string } | null = null;
            
            if (raw && raw.trim().startsWith("{")) {
              try {
                parsed = JSON.parse(raw);
              } catch {
                parsed = null;
              }
            }

            const [frente, lado, costas] = await Promise.all([
              signOrNull(parsed?.frente ?? null),
              signOrNull(parsed?.lado ?? null),
              signOrNull(parsed?.costas ?? null),
            ]);

            const single = raw && !raw.trim().startsWith("{") ? await signOrNull(raw) : null;

            return [checkin.id, { frente, lado, costas, single }];
          })
        );
        setCheckinPhotoSrc(Object.fromEntries(entries));
      }
    } catch (error) {
      console.error("Error fetching checkins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAdjustedProtocols = async (checkin: CheckIn) => {
    const analysis = parseAnalysis(checkin.ai_analysis);
    if (!analysis.structured || !analysis.data) {
      toast.error("Análise estruturada não disponível para gerar ajustes");
      return;
    }

    setGeneratingProtocols(true);
    try {
      // Fetch current profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", clientId)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Deactivate existing protocols
      await Promise.all([
        supabase.from("protocolos").update({ ativo: false }).eq("user_id", clientId).eq("tipo", "treino"),
        supabase.from("protocolos").update({ ativo: false }).eq("user_id", clientId).eq("tipo", "nutricao"),
      ]);

      // Generate new protocols with evolution context
      const evolutionContext = {
        ...profile,
        evolutionAnalysis: analysis.data,
        adjustments: {
          treino: analysis.data.ajustesTreino,
          dieta: analysis.data.ajustesDieta,
          metas: analysis.data.metasProximos30Dias,
        },
        weightChange: analysis.data.analisePeso?.variacao,
        compositionChanges: analysis.data.mudancasObservadas?.composicaoCorporal,
      };

      // Generate treino with adjustments
      const { error: treinoError } = await supabase.functions.invoke("generate-protocol", {
        body: {
          tipo: "treino",
          userId: clientId,
          userContext: evolutionContext,
          planType: planType || "mensal",
          evolutionAdjustments: analysis.data.ajustesTreino,
        },
      });

      if (treinoError) throw treinoError;

      // Generate nutricao with adjustments
      const { error: nutricaoError } = await supabase.functions.invoke("generate-protocol", {
        body: {
          tipo: "nutricao",
          userId: clientId,
          userContext: evolutionContext,
          planType: planType || "mensal",
          evolutionAdjustments: analysis.data.ajustesDieta,
        },
      });

      if (nutricaoError) throw nutricaoError;

      toast.success("Protocolos ajustados gerados com sucesso!");
      onProtocolsGenerated?.();
    } catch (error: any) {
      console.error("Error generating adjusted protocols:", error);
      toast.error(error.message || "Erro ao gerar protocolos ajustados");
    } finally {
      setGeneratingProtocols(false);
    }
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      await generateEvolutionPdf({
        clientName,
        initialWeight,
        checkins,
        signedPhotos: checkinPhotoSrc,
        initialPhotos: initialPhotosSigned,
      });
      toast.success("PDF de evolução gerado com sucesso!");
    } catch (error: any) {
      console.error("Error generating evolution PDF:", error);
      toast.error("Erro ao gerar PDF de evolução");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (checkins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Evolução do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum check-in de evolução registrado</p>
            <p className="text-sm mt-1">Os check-ins aparecerão aqui quando o cliente enviar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get most recent checkin with structured analysis
  const latestWithAnalysis = checkins.find(c => {
    const analysis = parseAnalysis(c.ai_analysis);
    return analysis.structured;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Evolução do Cliente
            </CardTitle>
            <CardDescription>
              {checkins.length} check-in{checkins.length > 1 ? "s" : ""} registrado{checkins.length > 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
            >
              {generatingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Baixar PDF
            </Button>
            {latestWithAnalysis && (
              <Button
                variant="fire"
                size="sm"
                onClick={() => handleGenerateAdjustedProtocols(latestWithAnalysis)}
                disabled={generatingProtocols}
              >
                {generatingProtocols ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Ajustar Protocolos
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {checkins.map((checkin) => {
          const signed = checkinPhotoSrc[checkin.id];
          const isExpanded = expandedCheckin === checkin.id;
          const analysis = parseAnalysis(checkin.ai_analysis);
          const hasPhotos = signed?.frente || signed?.lado || signed?.costas || signed?.single;

          return (
            <Collapsible 
              key={checkin.id} 
              open={isExpanded} 
              onOpenChange={() => setExpandedCheckin(isExpanded ? null : checkin.id)}
            >
              <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {format(new Date(checkin.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {checkin.semana_numero && (
                          <Badge variant="outline" className="text-xs">
                            Semana {checkin.semana_numero}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {checkin.peso_atual && (
                          <div className="flex items-center gap-1 text-sm">
                            <Scale className="h-3 w-3" />
                            {checkin.peso_atual} kg
                          </div>
                        )}
                        <div className="flex gap-1">
                          {hasPhotos && (
                            <Badge variant="secondary" className="text-xs">
                              <Camera className="h-3 w-3" />
                            </Badge>
                          )}
                          {analysis.data && (
                            <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                              <Sparkles className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-4 space-y-4">
                    {/* Photos */}
                    {hasPhotos && (
                      <div className="grid grid-cols-3 gap-2">
                        {signed?.frente && (
                          <a href={signed.frente} target="_blank" rel="noopener noreferrer">
                            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted hover:opacity-80">
                              <img src={signed.frente} alt="Frente" className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 left-1 text-xs bg-black/70 px-1.5 py-0.5 rounded">Frente</span>
                            </div>
                          </a>
                        )}
                        {signed?.lado && (
                          <a href={signed.lado} target="_blank" rel="noopener noreferrer">
                            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted hover:opacity-80">
                              <img src={signed.lado} alt="Lado" className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 left-1 text-xs bg-black/70 px-1.5 py-0.5 rounded">Lado</span>
                            </div>
                          </a>
                        )}
                        {signed?.costas && (
                          <a href={signed.costas} target="_blank" rel="noopener noreferrer">
                            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted hover:opacity-80">
                              <img src={signed.costas} alt="Costas" className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 left-1 text-xs bg-black/70 px-1.5 py-0.5 rounded">Costas</span>
                            </div>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {checkin.notas && (
                      <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">{checkin.notas}</p>
                    )}

                    {/* AI Analysis */}
                    {analysis.data && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">Análise Comparativa</span>
                          </div>
                          {analysis.structured && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateAdjustedProtocols(checkin)}
                              disabled={generatingProtocols}
                            >
                              {generatingProtocols ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <>
                                  <Dumbbell className="h-3 w-3 mr-1" />
                                  <Utensils className="h-3 w-3 mr-1" />
                                </>
                              )}
                              Gerar Ajustes
                            </Button>
                          )}
                        </div>
                        
                        {analysis.structured ? (
                          <EvolutionAnalysisResult analysis={analysis.data} />
                        ) : (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <pre className="text-xs whitespace-pre-wrap">{analysis.data}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
