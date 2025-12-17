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
  X
} from "lucide-react";

interface CheckIn {
  id: string;
  created_at: string;
  peso_atual: number | null;
  notas: string | null;
  foto_url: string | null;
  semana_numero: number | null;
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

interface PhotoPreviewState {
  frente: string | null;
  lado: string | null;
  costas: string | null;
}

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
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreviewState>({ frente: null, lado: null, costas: null });
  
  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
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
  }, [user]);

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
          .order("created_at", { ascending: false })
      ]);

      if (profileResult.data) {
        setProfile(profileResult.data);
        if (profileResult.data.weight) {
          setNewWeight(String(profileResult.data.weight));
        }
      }

      if (checkinsResult.data) {
        setCheckins(checkinsResult.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (type: keyof PhotoState) => (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setPhotos(prev => ({ ...prev, [type]: file }));
    setPhotoPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
  };

  const removePhoto = (type: keyof PhotoState) => {
    setPhotos(prev => ({ ...prev, [type]: null }));
    setPhotoPreviews(prev => ({ ...prev, [type]: null }));
    if (fileInputRefs[type].current) {
      fileInputRefs[type].current.value = "";
    }
  };

  const uploadPhoto = async (file: File, type: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `${user!.id}/evolucao-${type}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("body-photos")
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("body-photos")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
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
      // Upload all photos
      const uploadedUrls: { frente?: string; lado?: string; costas?: string } = {};
      
      if (photos.frente) {
        uploadedUrls.frente = await uploadPhoto(photos.frente, "frente") || undefined;
      }
      if (photos.lado) {
        uploadedUrls.lado = await uploadPhoto(photos.lado, "lado") || undefined;
      }
      if (photos.costas) {
        uploadedUrls.costas = await uploadPhoto(photos.costas, "costas") || undefined;
      }

      // Calculate week number since registration
      const registrationDate = profile?.created_at ? new Date(profile.created_at) : new Date();
      const weeksSinceStart = Math.ceil(differenceInDays(new Date(), registrationDate) / 7);

      // Store photos as JSON in foto_url field
      const photosJson = JSON.stringify(uploadedUrls);

      // Insert check-in
      const { error: insertError } = await supabase
        .from("checkins")
        .insert({
          user_id: user.id,
          peso_atual: parseFloat(newWeight),
          notas: notes || null,
          foto_url: photosJson,
          semana_numero: weeksSinceStart,
          data_checkin: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Update profile weight
      await supabase
        .from("profiles")
        .update({ weight: parseFloat(newWeight) })
        .eq("id", user.id);

      // Update user_activity
      await supabase
        .from("user_activity")
        .upsert({
          user_id: user.id,
          last_photo_submitted: new Date().toISOString(),
          last_access: new Date().toISOString()
        }, { onConflict: "user_id" });

      toast.success("Evolução enviada com sucesso!");

      // Now run AI analysis
      setAnalyzing(true);
      
      try {
        const response = await supabase.functions.invoke("analyze-evolution", {
          body: {
            anamnesePhotos: {
              frente: profile?.foto_frente_url,
              lado: profile?.foto_lado_url,
              costas: profile?.foto_costas_url,
            },
            evolutionPhotos: uploadedUrls,
            clientData: {
              name: profile?.full_name,
              initialWeight: profile?.weight,
              currentWeight: parseFloat(newWeight),
              notes: notes,
            }
          }
        });

        if (response.error) {
          console.error("AI analysis error:", response.error);
          toast.error("Não foi possível gerar a análise comparativa");
        } else if (response.data?.analysis) {
          setAiAnalysis(response.data.analysis);
          setShowAnalysis(true);
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
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold uppercase">Minha Evolução</h1>
          <p className="text-muted-foreground">Acompanhe seu progresso e envie suas fotos de evolução</p>
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
              <div className="prose prose-invert prose-sm max-w-none">
                <div 
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: aiAnalysis
                      .replace(/## /g, '<h2 class="text-lg font-bold text-primary mt-4 mb-2">')
                      .replace(/### /g, '<h3 class="text-base font-semibold mt-3 mb-1">')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/- /g, '• ')
                      .replace(/\n/g, '<br/>')
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fotos Iniciais da Anamnese */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Fotos Iniciais (Anamnese)
            </CardTitle>
            <CardDescription>
              Suas fotos de referência do início do programa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {photoTypes.map(({ key, label }) => {
                const fotoUrl = profile?.[`foto_${key}_url` as keyof Profile] as string | null;
                return (
                  <div key={key} className="relative aspect-[3/4] rounded-lg bg-muted overflow-hidden">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={`Foto ${label}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Camera className="h-8 w-8 mb-2" />
                        <span className="text-xs">{label}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-1 text-center">
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
            {profile?.created_at && (
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Registrado em {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Novo Check-in */}
        <Card className={!canSubmitNew ? "opacity-70" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Enviar Evolução
                </CardTitle>
                <CardDescription>
                  Envie suas 3 fotos (frente, lado, costas) e peso atual
                </CardDescription>
              </div>
              {lastCheckinDate && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Último envio</p>
                  <p className="text-sm font-medium">
                    {format(lastCheckinDate, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!canSubmitNew && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Aguarde para próximo envio</p>
                  <p className="text-sm text-muted-foreground">
                    Próximo check-in disponível em {30 - (daysSinceLastCheckin || 0)} dias
                  </p>
                </div>
              </div>
            )}

            {/* 3 Photo Uploads */}
            <div>
              <Label className="mb-3 block">Fotos de Evolução (mesmo padrão da anamnese)</Label>
              <div className="grid grid-cols-3 gap-4">
                {photoTypes.map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <div 
                      className={`relative aspect-[3/4] rounded-lg border-2 border-dashed border-border/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors ${!canSubmitNew ? "pointer-events-none opacity-50" : ""}`}
                      onClick={() => canSubmitNew && fileInputRefs[key].current?.click()}
                    >
                      {photoPreviews[key] ? (
                        <>
                          <img
                            src={photoPreviews[key]!}
                            alt={`Preview ${label}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePhoto(key);
                            }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <Camera className="h-8 w-8 mb-2" />
                          <p className="text-xs font-medium">{label}</p>
                          <p className="text-[10px]">Clique para adicionar</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRefs[key]}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect(key)}
                      className="hidden"
                      disabled={!canSubmitNew}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG até 10MB cada. Mantenha o mesmo padrão das fotos iniciais.
              </p>
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

        {/* Histórico de Check-ins */}
        {checkins.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Histórico de Evolução
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checkins.map((checkin) => {
                  // Parse photos if stored as JSON
                  let checkinPhotos: { frente?: string; lado?: string; costas?: string } = {};
                  try {
                    if (checkin.foto_url?.startsWith("{")) {
                      checkinPhotos = JSON.parse(checkin.foto_url);
                    }
                  } catch {}

                  return (
                    <div
                      key={checkin.id}
                      className="p-4 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-medium">
                            {format(new Date(checkin.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {checkin.peso_atual && (
                            <span className="flex items-center gap-1 text-sm">
                              <Scale className="h-3 w-3" />
                              {checkin.peso_atual} kg
                            </span>
                          )}
                          {checkin.semana_numero && (
                            <span className="text-xs text-muted-foreground">
                              Semana {checkin.semana_numero}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Display checkin photos */}
                      {(checkinPhotos.frente || checkinPhotos.lado || checkinPhotos.costas || 
                        (checkin.foto_url && !checkin.foto_url.startsWith("{"))) && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {checkinPhotos.frente && (
                            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                              <img src={checkinPhotos.frente} alt="Frente" className="w-full h-full object-cover" />
                            </div>
                          )}
                          {checkinPhotos.lado && (
                            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                              <img src={checkinPhotos.lado} alt="Lado" className="w-full h-full object-cover" />
                            </div>
                          )}
                          {checkinPhotos.costas && (
                            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                              <img src={checkinPhotos.costas} alt="Costas" className="w-full h-full object-cover" />
                            </div>
                          )}
                          {/* Fallback for old single photo format */}
                          {checkin.foto_url && !checkin.foto_url.startsWith("{") && (
                            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted col-span-3 max-w-[200px]">
                              <img src={checkin.foto_url} alt="Evolução" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      )}

                      {checkin.notas && (
                        <p className="text-sm text-muted-foreground">
                          {checkin.notas}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientLayout>
  );
}
