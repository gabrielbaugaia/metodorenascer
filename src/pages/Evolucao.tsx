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
  Lock
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

export default function Evolucao() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [newWeight, setNewWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmitCheckin = async () => {
    if (!user || !newWeight) {
      toast.error("Por favor, informe seu peso atual");
      return;
    }

    setSubmitting(true);

    try {
      let photoUrl = null;

      // Upload photo if selected
      if (photoFile) {
        setUploading(true);
        const fileExt = photoFile.name.split(".").pop() || "jpg";
        const filePath = `${user.id}/checkin-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("body-photos")
          .upload(filePath, photoFile, {
            contentType: photoFile.type,
            cacheControl: "3600",
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("body-photos")
          .getPublicUrl(filePath);

        photoUrl = urlData.publicUrl;
        setUploading(false);
      }

      // Calculate week number since registration
      const registrationDate = profile?.created_at ? new Date(profile.created_at) : new Date();
      const weeksSinceStart = Math.ceil(differenceInDays(new Date(), registrationDate) / 7);

      // Insert check-in
      const { error: insertError } = await supabase
        .from("checkins")
        .insert({
          user_id: user.id,
          peso_atual: parseFloat(newWeight),
          notas: notes || null,
          foto_url: photoUrl,
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

      toast.success("Check-in enviado com sucesso!");
      
      // Reset form
      setNotes("");
      setPhotoFile(null);
      setPhotoPreview(null);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Erro ao enviar check-in:", error);
      toast.error("Erro ao enviar check-in");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const getSignedUrl = async (path: string) => {
    if (!path) return null;
    try {
      const { data, error } = await supabase.storage
        .from("body-photos")
        .createSignedUrl(path, 60 * 60);
      if (error || !data) return null;
      return data.signedUrl;
    } catch {
      return null;
    }
  };

  const lastCheckinDate = checkins[0]?.created_at ? new Date(checkins[0].created_at) : null;
  const daysSinceLastCheckin = lastCheckinDate ? differenceInDays(new Date(), lastCheckinDate) : null;
  const canSubmitNew = daysSinceLastCheckin === null || daysSinceLastCheckin >= 25;

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
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold uppercase">Minha Evolução</h1>
          <p className="text-muted-foreground">Acompanhe seu progresso e envie suas fotos de evolução</p>
        </div>

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
              {["frente", "lado", "costas"].map((tipo) => {
                const fotoUrl = profile?.[`foto_${tipo}_url` as keyof Profile] as string | null;
                return (
                  <div key={tipo} className="relative aspect-[3/4] rounded-lg bg-muted overflow-hidden">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={`Foto ${tipo}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Camera className="h-8 w-8 mb-2" />
                        <span className="text-xs capitalize">{tipo}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-1 text-center">
                      <span className="text-xs font-medium capitalize">{tipo}</span>
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
                  Envie suas fotos e peso atual para acompanhamento
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo Upload */}
              <div className="space-y-4">
                <Label>Foto de Evolução</Label>
                <div 
                  className={`relative aspect-[3/4] rounded-lg border-2 border-dashed border-border/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors ${!canSubmitNew ? "pointer-events-none" : ""}`}
                  onClick={() => canSubmitNew && fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Camera className="h-12 w-12 mb-3" />
                      <p className="text-sm font-medium">Clique para adicionar</p>
                      <p className="text-xs">JPG, PNG até 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  disabled={!canSubmitNew}
                />
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
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
                    rows={4}
                    disabled={!canSubmitNew}
                  />
                </div>

                <Button
                  onClick={handleSubmitCheckin}
                  disabled={!canSubmitNew || submitting || !newWeight}
                  className="w-full"
                  variant="fire"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {uploading ? "Enviando foto..." : "Salvando..."}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar Evolução
                    </>
                  )}
                </Button>
              </div>
            </div>
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
                {checkins.map((checkin) => (
                  <div
                    key={checkin.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50"
                  >
                    {checkin.foto_url && (
                      <div className="w-16 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={checkin.foto_url}
                          alt="Check-in"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-medium">
                            {format(new Date(checkin.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        {checkin.semana_numero && (
                          <span className="text-xs text-muted-foreground">
                            Semana {checkin.semana_numero}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        {checkin.peso_atual && (
                          <span className="flex items-center gap-1">
                            <Scale className="h-3 w-3" />
                            {checkin.peso_atual} kg
                          </span>
                        )}
                      </div>
                      {checkin.notas && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {checkin.notas}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientLayout>
  );
}