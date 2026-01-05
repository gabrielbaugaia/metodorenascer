import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Scale, 
  Ruler, 
  Target, 
  AlertCircle, 
  Clock, 
  Calendar,
  Heart,
  Dumbbell,
  Utensils,
  Moon,
  Cigarette,
  Wine,
  Phone,
  Camera,
  Loader2,
  TrendingUp
} from "lucide-react";
import { createBodyPhotosSignedUrl } from "@/lib/bodyPhotos";

interface Profile {
  full_name: string;
  email: string;
  weight?: number;
  height?: number;
  age?: number;
  sexo?: string;
  goals?: string;
  injuries?: string;
  availability?: string;
  nivel_experiencia?: string;
  restricoes_medicas?: string;
  objetivos_detalhados?: any;
  medidas?: any;
  data_nascimento?: string;
  telefone?: string;
  // New fields
  whatsapp?: string;
  objetivo_principal?: string;
  ja_treinou_antes?: boolean;
  local_treino?: string;
  dias_disponiveis?: string;
  nivel_condicionamento?: string;
  pratica_aerobica?: boolean;
  escada_sem_cansar?: string;
  condicoes_saude?: string;
  toma_medicamentos?: boolean;
  refeicoes_por_dia?: string;
  bebe_agua_frequente?: boolean;
  restricoes_alimentares?: string;
  qualidade_sono?: string;
  nivel_estresse?: string;
  consome_alcool?: string;
  fuma?: string;
  foto_frente_url?: string;
  foto_lado_url?: string;
  foto_costas_url?: string;
  observacoes_adicionais?: string;
}

interface ClientAnamneseCardProps {
  profile: Profile;
  currentWeight?: number | null;
}

export function ClientAnamneseCard({ profile, currentWeight }: ClientAnamneseCardProps) {
  const hasPhotos = profile.foto_frente_url || profile.foto_lado_url || profile.foto_costas_url;
  const [signedPhotos, setSignedPhotos] = useState<{ frente: string | null; lado: string | null; costas: string | null }>({
    frente: null,
    lado: null,
    costas: null,
  });
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const signOrNull = async (value: string | null | undefined): Promise<string | null> => {
      if (!value) return null;
      try {
        return await createBodyPhotosSignedUrl(value);
      } catch (e) {
        console.warn("Erro ao gerar URL assinada:", e);
        return null;
      }
    };

    const loadPhotos = async () => {
      if (!hasPhotos) {
        setLoadingPhotos(false);
        return;
      }
      
      const [frente, lado, costas] = await Promise.all([
        signOrNull(profile.foto_frente_url),
        signOrNull(profile.foto_lado_url),
        signOrNull(profile.foto_costas_url),
      ]);

      if (!cancelled) {
        setSignedPhotos({ frente, lado, costas });
        setLoadingPhotos(false);
      }
    };

    loadPhotos();
    return () => {
      cancelled = true;
    };
  }, [profile.foto_frente_url, profile.foto_lado_url, profile.foto_costas_url, hasPhotos]);

  const weightChange = currentWeight && profile.weight ? currentWeight - profile.weight : null;

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Anamnese do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Dados Pessoais</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Peso Inicial</p>
                <p className="font-medium">{profile.weight ? `${profile.weight} kg` : "—"}</p>
              </div>
            </div>
            {currentWeight && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Peso Atual</p>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-primary">{currentWeight} kg</p>
                    {weightChange !== null && weightChange !== 0 && (
                      <Badge variant="outline" className={`text-xs ${weightChange < 0 ? "text-green-500 border-green-500/50" : "text-orange-500 border-orange-500/50"}`}>
                        {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Altura</p>
                <p className="font-medium">{profile.height ? `${profile.height} cm` : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Idade</p>
                <p className="font-medium">{profile.age ? `${profile.age} anos` : "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Sexo</p>
                <p className="font-medium capitalize">{profile.sexo || "—"}</p>
              </div>
            </div>
          </div>
          {(profile.whatsapp || profile.telefone) && (
            <div className="flex items-center gap-2 mt-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="font-medium">{profile.whatsapp || profile.telefone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Objective */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Objetivo</h4>
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <Badge variant="secondary" className="mb-1">
                {profile.objetivo_principal || profile.goals || "Não informado"}
              </Badge>
              {profile.observacoes_adicionais && (
                <p className="text-sm text-muted-foreground mt-1">{profile.observacoes_adicionais}</p>
              )}
            </div>
          </div>
        </div>

        {/* Training History */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Histórico de Treino</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Já treinou antes</p>
              <p className="font-medium">{profile.ja_treinou_antes ? "Sim" : profile.ja_treinou_antes === false ? "Não" : "—"}</p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Local preferido</p>
              <p className="font-medium">{profile.local_treino || "—"}</p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Dias disponíveis</p>
              <p className="font-medium">{profile.dias_disponiveis || profile.availability || "—"}</p>
            </div>
          </div>
        </div>

        {/* Physical Conditioning */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Condicionamento Físico</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Nível</p>
              <p className="font-medium">{profile.nivel_condicionamento || profile.nivel_experiencia || "—"}</p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Pratica aeróbica</p>
              <p className="font-medium">{profile.pratica_aerobica ? "Sim" : profile.pratica_aerobica === false ? "Não" : "—"}</p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Escada sem cansar</p>
              <p className="font-medium capitalize">{profile.escada_sem_cansar || "—"}</p>
            </div>
          </div>
        </div>

        {/* Health */}
        {(profile.condicoes_saude || profile.injuries || profile.restricoes_medicas) && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Saúde</h4>
            {profile.condicoes_saude && (
              <div className="flex items-start gap-2 mb-2">
                <Heart className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Condições de saúde</p>
                  <p className="text-sm text-red-500">{profile.condicoes_saude}</p>
                </div>
              </div>
            )}
            {(profile.injuries || profile.restricoes_medicas) && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Lesões/Limitações</p>
                  <p className="text-sm text-orange-500">{profile.injuries || profile.restricoes_medicas}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Eating Habits */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Hábitos Alimentares</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Refeições/dia</p>
              <p className="font-medium">{profile.refeicoes_por_dia || "—"}</p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Bebe água</p>
              <p className="font-medium">{profile.bebe_agua_frequente ? "Frequentemente" : profile.bebe_agua_frequente === false ? "Pouco" : "—"}</p>
            </div>
            {profile.restricoes_alimentares && (
              <div className="bg-background rounded p-2 md:col-span-1">
                <p className="text-xs text-muted-foreground">Restrições</p>
                <p className="font-medium text-sm">{profile.restricoes_alimentares}</p>
              </div>
            )}
          </div>
        </div>

        {/* Lifestyle */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Estilo de Vida</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Moon className="h-3 w-3" /> Sono
              </p>
              <p className="font-medium">{profile.qualidade_sono || "—"}</p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Estresse</p>
              <p className="font-medium">{profile.nivel_estresse || "—"}</p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Wine className="h-3 w-3" /> Álcool
              </p>
              <p className="font-medium capitalize">{profile.consome_alcool || "—"}</p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Cigarette className="h-3 w-3" /> Fuma
              </p>
              <p className="font-medium capitalize">{profile.fuma || "—"}</p>
            </div>
          </div>
        </div>

        {/* Body Photos */}
        {hasPhotos && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotos Corporais
            </h4>
            {loadingPhotos ? (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-[3/4] rounded-lg border border-border bg-muted flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {signedPhotos.frente && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground text-center">Frente</p>
                    <a href={signedPhotos.frente} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={signedPhotos.frente} 
                        alt="Foto de frente" 
                        className="aspect-[3/4] object-cover rounded-lg border border-border hover:opacity-80 transition-opacity"
                        loading="lazy"
                      />
                    </a>
                  </div>
                )}
                {signedPhotos.lado && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground text-center">Lado</p>
                    <a href={signedPhotos.lado} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={signedPhotos.lado} 
                        alt="Foto de lado" 
                        className="aspect-[3/4] object-cover rounded-lg border border-border hover:opacity-80 transition-opacity"
                        loading="lazy"
                      />
                    </a>
                  </div>
                )}
                {signedPhotos.costas && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground text-center">Costas</p>
                    <a href={signedPhotos.costas} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={signedPhotos.costas} 
                        alt="Foto de costas" 
                        className="aspect-[3/4] object-cover rounded-lg border border-border hover:opacity-80 transition-opacity"
                        loading="lazy"
                      />
                    </a>
                  </div>
                )}
                {!signedPhotos.frente && !signedPhotos.lado && !signedPhotos.costas && (
                  <div className="col-span-3 text-center py-4 text-muted-foreground text-sm">
                    Erro ao carregar fotos
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Measurements */}
        {profile.medidas && Object.keys(profile.medidas).length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Medidas Corporais</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(profile.medidas).map(([key, value]) => (
                <div key={key} className="bg-background rounded p-2 text-center">
                  <p className="text-xs text-muted-foreground capitalize">{key}</p>
                  <p className="font-medium text-sm">{String(value)} cm</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
