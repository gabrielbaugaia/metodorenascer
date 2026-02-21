import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatAiContent } from "@/lib/sanitize";
import { createBodyPhotosSignedUrl } from "@/lib/bodyPhotos";
import { EvolutionAnalysisResult } from "@/components/evolution/EvolutionAnalysisResult";
import { EvolutionTimeline } from "@/components/evolution/EvolutionTimeline";
import { PhotoStandardGuide } from "@/components/anamnese/PhotoStandardGuide";
import {
  Camera,
  Loader2,
  Upload,
  Calendar,
  Scale,
  CheckCircle2,
  Clock,
  ImageIcon,
  Lock,
  Sparkles,
  X,
  AlertTriangle,
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

interface Profile {
  full_name: string;
  foto_frente_url: string | null;
  foto_lado_url: string | null;
  foto_costas_url: string | null;
  created_at: string | null;
  weight: number | null;
}

interface PhotoState {
  frente: File | null;
  lado: File | null;
  costas: File | null;
}

type PhotoKey = keyof PhotoState;

interface PhotoPreviewState {
  frente: string | null;
  lado: string | null;
  costas: string | null;
}

type SignedPhotos = Record<PhotoKey, string | null>;
type SignedCheckinPhotos = Partial<SignedPhotos> & { single?: string | null };

export default function Evolucao() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Form state
  const [newWeight, setNewWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<PhotoState>({ frente: null, lado: null, costas: null });
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreviewState>({
    frente: null,
    lado: null,
    costas: null,
  });

  // Signed URLs (private bucket)
  const [anamnesePhotoSrc, setAnamnesePhotoSrc] = useState<SignedPhotos>({
    frente: null,
    lado: null,
    costas: null,
  });
  const [checkinPhotoSrc, setCheckinPhotoSrc] = useState<Record<string, SignedCheckinPhotos>>({});

  // AI Analysis state - can be string (legacy) or structured object
  const [aiAnalysis, setAiAnalysis] = useState<unknown>(null);
  const [isStructuredAnalysis, setIsStructuredAnalysis] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [validatingPhoto, setValidatingPhoto] = useState<PhotoKey | null>(null);

  const fileInputRefs = {
    frente: useRef<HTMLInputElement>(null),
    lado: useRef<HTMLInputElement>(null),
    costas: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const signOrFallback = async (value: string | null): Promise<string | null> => {
    if (!value) return null;
    try {
      return await createBodyPhotosSignedUrl(value);
    } catch (e) {
      // If it's already a URL (e.g. public bucket in old data), keep it as a fallback
      if (value.startsWith("http")) return value;
      console.warn("Não foi possível gerar URL assinada:", e);
      return null;
    }
  };

  const hydrateAnamnesePhotos = async (p: Profile | null) => {
    if (!p) {
      setAnamnesePhotoSrc({ frente: null, lado: null, costas: null });
      return;
    }

    const [frente, lado, costas] = await Promise.all([
      signOrFallback(p.foto_frente_url),
      signOrFallback(p.foto_lado_url),
      signOrFallback(p.foto_costas_url),
    ]);

    setAnamnesePhotoSrc({ frente, lado, costas });
  };

  const hydrateCheckinPhotos = async (items: CheckIn[]) => {
    const entries = await Promise.all(
      items.map(async (checkin): Promise<[string, SignedCheckinPhotos]> => {
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
          signOrFallback(parsed?.frente ?? null),
          signOrFallback(parsed?.lado ?? null),
          signOrFallback(parsed?.costas ?? null),
        ]);

        const single = raw && !raw.trim().startsWith("{") ? await signOrFallback(raw) : null;

        return [checkin.id, { frente, lado, costas, single }];
      })
    );

    setCheckinPhotoSrc(Object.fromEntries(entries));
  };

  const fetchData = async () => {
    try {
      const [profileResult, checkinsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, foto_frente_url, foto_lado_url, foto_costas_url, created_at, weight")
          .eq("id", user!.id)
          .maybeSingle(),
        supabase
          .from("checkins")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false }),
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data);
        if (profileResult.data.weight) {
          setNewWeight(String(profileResult.data.weight));
        }
        await hydrateAnamnesePhotos(profileResult.data);
      }

      if (checkinsResult.data) {
        setCheckins(checkinsResult.data);
        await hydrateCheckinPhotos(checkinsResult.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const validatePhotoWithAI = async (base64Image: string): Promise<{ valid: boolean; reason: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke("validate-body-photo", {
        body: { imageBase64: base64Image },
      });

      if (error) {
        console.error("Validation error:", error);
        return { valid: true, reason: "OK" };
      }

      return data || { valid: true, reason: "OK" };
    } catch (err) {
      console.error("Validation failed:", err);
      return { valid: true, reason: "OK" };
    }
  };

  const handlePhotoSelect =
    (type: keyof PhotoState) => async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione uma imagem válida");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 10MB");
        return;
      }

      // Read as base64 for preview and validation
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        // Show preview
        setPhotoPreviews((prev) => ({ ...prev, [type]: base64 }));
        
        // Validate with AI
        setValidatingPhoto(type);
        const validation = await validatePhotoWithAI(base64);
        setValidatingPhoto(null);

        if (!validation.valid) {
          toast.error(validation.reason, {
            duration: 6000,
            icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
          });
          // Remove the preview since it was rejected
          setPhotoPreviews((prev) => ({ ...prev, [type]: null }));
          setPhotos((prev) => ({ ...prev, [type]: null }));
          if (fileInputRefs[type].current) {
            fileInputRefs[type].current.value = "";
          }
          return;
        }

        // Photo is valid, store it
        setPhotos((prev) => ({ ...prev, [type]: file }));
        toast.success(`Foto de ${type} aprovada!`);
      };
      reader.readAsDataURL(file);
    };

  const removePhoto = (type: keyof PhotoState) => {
    setPhotos((prev) => ({ ...prev, [type]: null }));
    setPhotoPreviews((prev) => ({ ...prev, [type]: null }));
    if (fileInputRefs[type].current) {
      fileInputRefs[type].current.value = "";
    }
  };

  const uploadPhoto = async (file: File, type: string): Promise<string> => {
    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `${user!.id}/evolucao-${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("body-photos")
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) throw uploadError;

    // Return only the storage path (bucket is private)
    return filePath;
  };

  const handleSubmitCheckin = async () => {
    if (!user || !newWeight) {
      toast.error("Por favor, informe seu peso atual");
      return;
    }

    if (!photos.frente && !photos.lado && !photos.costas) {
      toast.error("Por favor, adicione pelo menos uma foto de evolução");
      return;
    }

    setSubmitting(true);

    try {
      // Upload all photos (store paths)
      const uploadedPaths: { frente?: string; lado?: string; costas?: string } = {};

      if (photos.frente) {
        uploadedPaths.frente = (await uploadPhoto(photos.frente, "frente")) || undefined;
      }
      if (photos.lado) {
        uploadedPaths.lado = (await uploadPhoto(photos.lado, "lado")) || undefined;
      }
      if (photos.costas) {
        uploadedPaths.costas = (await uploadPhoto(photos.costas, "costas")) || undefined;
      }

      // Calculate week number since registration
      const registrationDate = profile?.created_at ? new Date(profile.created_at) : new Date();
      const weeksSinceStart = Math.ceil(differenceInDays(new Date(), registrationDate) / 7);

      // Store photos as JSON in foto_url field (paths)
      const photosJson = JSON.stringify(uploadedPaths);

      // Insert check-in and get the ID back
      const { data: checkinData, error: insertError } = await supabase
        .from("checkins")
        .insert({
          user_id: user.id,
          peso_atual: parseFloat(newWeight),
          notas: notes || null,
          foto_url: photosJson,
          semana_numero: weeksSinceStart,
          data_checkin: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const checkinId = checkinData?.id;

      // Update profile weight
      await supabase.from("profiles").update({ weight: parseFloat(newWeight) }).eq("id", user.id);

      // Update user_activity
      await supabase
        .from("user_activity")
        .upsert(
          {
            user_id: user.id,
            last_photo_submitted: new Date().toISOString(),
            last_access: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      toast.success("Evolução enviada com sucesso!");

      // Now run AI analysis (needs accessible URLs)
      setAnalyzing(true);

      try {
        const [anamneseFrente, anamneseLado, anamneseCostas] = await Promise.all([
          signOrFallback(profile?.foto_frente_url ?? null),
          signOrFallback(profile?.foto_lado_url ?? null),
          signOrFallback(profile?.foto_costas_url ?? null),
        ]);

        const [evoFrente, evoLado, evoCostas] = await Promise.all([
          signOrFallback(uploadedPaths.frente ?? null),
          signOrFallback(uploadedPaths.lado ?? null),
          signOrFallback(uploadedPaths.costas ?? null),
        ]);

        const response = await supabase.functions.invoke("analyze-evolution", {
          body: {
            anamnesePhotos: {
              frente: anamneseFrente,
              lado: anamneseLado,
              costas: anamneseCostas,
            },
            evolutionPhotos: {
              frente: evoFrente,
              lado: evoLado,
              costas: evoCostas,
            },
            clientData: {
              name: profile?.full_name,
              initialWeight: profile?.weight,
              currentWeight: parseFloat(newWeight),
              notes: notes,
            },
          },
        });

        if (response.error) {
          console.error("AI analysis error:", response.error);
          toast.error("Não foi possível gerar a análise comparativa");
        } else if (response.data?.analysis) {
          setAiAnalysis(response.data.analysis);
          setIsStructuredAnalysis(response.data.structured === true);
          setShowAnalysis(true);

          // Save the AI analysis to the checkin record (stringify if structured)
          if (checkinId) {
            const analysisToSave = response.data.structured 
              ? JSON.stringify(response.data.analysis)
              : response.data.analysis;
            await supabase.from("checkins").update({ ai_analysis: analysisToSave }).eq("id", checkinId);
          }
        }
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
      } finally {
        setAnalyzing(false);
      }

      // Reset form
      setNotes("");
      setPhotos({ frente: null, lado: null, costas: null });
      setPhotoPreviews({ frente: null, lado: null, costas: null });

      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Erro ao enviar check-in:", error);
      toast.error("Erro ao enviar check-in");
    } finally {
      setSubmitting(false);
    }
  };

  const lastCheckinDate = checkins[0]?.created_at ? new Date(checkins[0].created_at) : null;
  const daysSinceLastCheckin = lastCheckinDate ? differenceInDays(new Date(), lastCheckinDate) : null;
  const canSubmitNew = daysSinceLastCheckin === null || daysSinceLastCheckin >= 25;

  const photoTypes = [
    { key: "frente" as const, label: "Frente" },
    { key: "lado" as const, label: "Lado" },
    { key: "costas" as const, label: "Costas" },
  ];

  if (authLoading || loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-8 px-1 sm:px-0 pb-20 sm:pb-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold uppercase">Minha Evolução</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Acompanhe seu progresso e envie suas fotos</p>
        </div>

        {/* AI Analysis Modal/Card */}
        {showAnalysis && aiAnalysis && (
          <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Análise Comparativa
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowAnalysis(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Análise gerada pelo seu mentor com base nas suas fotos</CardDescription>
            </CardHeader>
            <CardContent>
              {isStructuredAnalysis && typeof aiAnalysis === 'object' ? (
                <EvolutionAnalysisResult 
                  analysis={aiAnalysis as any} 
                  clientName={profile?.full_name || "Cliente"}
                  checkinDate={new Date()}
                  showPhotoComparison={true}
                  photos={{
                    initialFronte: anamnesePhotoSrc.frente,
                    initialLado: anamnesePhotoSrc.lado,
                    initialCostas: anamnesePhotoSrc.costas,
                    currentFrente: photoPreviews.frente || undefined,
                    currentLado: photoPreviews.lado || undefined,
                    currentCostas: photoPreviews.costas || undefined
                  }}
                />
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div
                    className="whitespace-pre-wrap text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: formatAiContent(typeof aiAnalysis === 'string' ? aiAnalysis : JSON.stringify(aiAnalysis)),
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fotos Iniciais da Anamnese — Compacto */}
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6 py-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-4 w-4 text-primary" />
              Fotos Iniciais
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3">
            <div className="grid grid-cols-3 gap-2">
              {photoTypes.map(({ key, label }) => {
                const fotoSrc = anamnesePhotoSrc[key];
                return (
                  <div key={key} className="relative aspect-[3/4] rounded-md bg-muted overflow-hidden" style={{ maxHeight: 160 }}>
                    {fotoSrc ? (
                      <img
                        src={fotoSrc}
                        alt={`Foto de anamnese - ${label}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Camera className="h-4 w-4 mb-1" />
                        <span className="text-[9px]">{label}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 py-0.5 text-center">
                      <span className="text-[9px] font-medium">{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {profile?.created_at && (
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Registrado em {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Novo Check-in */}
        <Card className={!canSubmitNew ? "opacity-70" : ""}>
          <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Enviar Evolução
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">3 fotos + peso atual</CardDescription>
              </div>
              {lastCheckinDate && (
                <div className="text-left sm:text-right">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Último envio</p>
                  <p className="text-xs sm:text-sm font-medium">{format(lastCheckinDate, "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
            {!canSubmitNew && (
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-xs sm:text-sm text-foreground">Próximo check-in em breve</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground">
                    Liberado a cada 30 dias. Faltam{" "}
                    <span className="text-primary font-medium">{30 - (daysSinceLastCheckin || 0)} dias</span>.
                  </p>
                </div>
              </div>
            )}

            {/* Photo Standard Guide */}
            {canSubmitNew && (
              <PhotoStandardGuide compact />
            )}

            {/* 3 Photo Uploads */}
            <div>
              <Label className="mb-2 sm:mb-3 block text-xs sm:text-sm">Fotos de Evolução</Label>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {photoTypes.map(({ key, label }) => {
                  const isValidating = validatingPhoto === key;
                  
                  return (
                    <div key={key} className="space-y-1 sm:space-y-2">
                      <div
                        className={`relative aspect-[3/4] rounded-md sm:rounded-lg border-2 border-dashed border-border/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors ${!canSubmitNew || isValidating ? "pointer-events-none" : ""} ${!canSubmitNew ? "opacity-50" : ""}`}
                        onClick={() => canSubmitNew && !isValidating && fileInputRefs[key].current?.click()}
                      >
                        {photoPreviews[key] ? (
                          <>
                            <img
                              src={photoPreviews[key]!}
                              alt={`Preview ${label}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {isValidating && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="text-center text-white">
                                  <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin mx-auto mb-0.5 sm:mb-1" />
                                  <span className="text-[9px] sm:text-xs">Validando...</span>
                                </div>
                              </div>
                            )}
                            {!isValidating && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePhoto(key);
                                }}
                                className="absolute top-1 right-1 sm:top-2 sm:right-2 p-0.5 sm:p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            {isValidating ? (
                              <>
                                <Loader2 className="h-5 w-5 sm:h-8 sm:w-8 animate-spin text-primary mb-1 sm:mb-2" />
                                <p className="text-[9px] sm:text-xs">Validando...</p>
                              </>
                            ) : (
                              <>
                                <Camera className="h-5 w-5 sm:h-8 sm:w-8 mb-1 sm:mb-2" />
                                <p className="text-[9px] sm:text-xs font-medium">{label}</p>
                                <p className="text-[8px] sm:text-[10px] hidden sm:block">Clique para adicionar</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        ref={fileInputRefs[key]}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect(key)}
                        className="hidden"
                        disabled={!canSubmitNew || isValidating}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">JPG, PNG até 10MB cada.</p>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Peso Atual (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Ex: 75.5"
                  disabled={!canSubmitNew}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Como está se sentindo? Alguma dificuldade ou conquista?"
                  rows={3}
                  disabled={!canSubmitNew}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmitCheckin}
              disabled={!canSubmitNew || submitting || analyzing || !newWeight}
              className="w-full"
              variant="fire"
            >
              {submitting || analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {analyzing ? "Gerando análise..." : "Enviando fotos..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Evolução
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Histórico de Check-ins com Timeline */}
        <EvolutionTimeline 
          checkins={checkins} 
          checkinPhotoSrc={checkinPhotoSrc}
          initialWeight={profile?.weight}
          clientName={profile?.full_name || "Cliente"}
          initialPhotos={{
            frente: anamnesePhotoSrc.frente,
            lado: anamnesePhotoSrc.lado,
            costas: anamnesePhotoSrc.costas
          }}
        />
      </div>
    </ClientLayout>
  );
}
