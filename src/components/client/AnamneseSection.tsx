import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Target, Dumbbell, Heart, Apple, Moon, Camera } from "lucide-react";

interface Profile {
  full_name: string;
  email: string;
  telefone: string;
  whatsapp: string;
  sexo: string;
  data_nascimento: string;
  age: number;
  weight: number;
  height: number;
  objetivo_principal: string;
  objetivos_detalhados: any;
  ja_treinou_antes: boolean;
  nivel_experiencia: string;
  local_treino: string;
  dias_disponiveis: string;
  nivel_condicionamento: string;
  escada_sem_cansar: string;
  pratica_aerobica: boolean;
  condicoes_saude: string;
  toma_medicamentos: boolean;
  restricoes_medicas: string;
  restricoes_alimentares: string;
  refeicoes_por_dia: string;
  bebe_agua_frequente: boolean;
  qualidade_sono: string;
  nivel_estresse: string;
  consome_alcool: string;
  fuma: string;
  foto_frente_url: string;
  foto_lado_url: string;
  foto_costas_url: string;
  medidas: any;
  observacoes_adicionais: string;
  updated_at?: string;
}


export function AnamneseSection() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile(data as Profile);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma anamnese encontrada.
        </CardContent>
      </Card>
    );
  }

  const InfoItem = ({ label, value }: { label: string; value: any }) => {
    if (value === null || value === undefined || value === "") return null;
    return (
      <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="text-foreground text-sm font-medium">
          {typeof value === "boolean" ? (value ? "Sim" : "Não") : String(value)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {profile.updated_at && (
        <p className="text-xs text-muted-foreground text-right">
          Última atualização da anamnese: {new Date(profile.updated_at).toLocaleString("pt-BR")}
        </p>
      )}
      {/* Dados Pessoais */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoItem label="Nome" value={profile.full_name} />
          <InfoItem label="Email" value={profile.email} />
          <InfoItem label="Telefone" value={profile.telefone} />
          <InfoItem label="WhatsApp" value={profile.whatsapp} />
          <InfoItem label="Sexo" value={profile.sexo} />
          <InfoItem label="Idade" value={profile.age ? `${profile.age} anos` : null} />
          <InfoItem label="Peso" value={profile.weight ? `${profile.weight} kg` : null} />
          <InfoItem label="Altura" value={profile.height ? `${profile.height} cm` : null} />
        </CardContent>
      </Card>

      {/* Objetivo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Objetivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InfoItem label="Objetivo Principal" value={profile.objetivo_principal} />
        </CardContent>
      </Card>

      {/* Histórico de Treino */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Dumbbell className="h-4 w-4 text-primary" />
            Histórico de Treino
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoItem label="Já treinou antes" value={profile.ja_treinou_antes} />
          <InfoItem label="Nível de experiência" value={profile.nivel_experiencia} />
          <InfoItem label="Local de treino" value={profile.local_treino} />
          <InfoItem label="Dias disponíveis" value={profile.dias_disponiveis} />
          <InfoItem label="Nível de condicionamento" value={profile.nivel_condicionamento} />
          <InfoItem label="Pratica aeróbica" value={profile.pratica_aerobica} />
        </CardContent>
      </Card>

      {/* Saúde */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-primary" />
            Saúde
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoItem label="Condições de saúde" value={profile.condicoes_saude} />
          <InfoItem label="Toma medicamentos" value={profile.toma_medicamentos} />
          <InfoItem label="Restrições médicas" value={profile.restricoes_medicas} />
        </CardContent>
      </Card>

      {/* Alimentação */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Apple className="h-4 w-4 text-primary" />
            Alimentação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoItem label="Restrições alimentares" value={profile.restricoes_alimentares} />
          <InfoItem label="Refeições por dia" value={profile.refeicoes_por_dia} />
          <InfoItem label="Bebe água frequentemente" value={profile.bebe_agua_frequente} />
        </CardContent>
      </Card>

      {/* Estilo de Vida */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-4 w-4 text-primary" />
            Estilo de Vida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoItem label="Qualidade do sono" value={profile.qualidade_sono} />
          <InfoItem label="Nível de estresse" value={profile.nivel_estresse} />
          <InfoItem label="Consome álcool" value={profile.consome_alcool} />
          <InfoItem label="Fuma" value={profile.fuma} />
        </CardContent>
      </Card>

      {/* Fotos */}
      {(profile.foto_frente_url || profile.foto_lado_url || profile.foto_costas_url) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4 text-primary" />
              Fotos Corporais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {profile.foto_frente_url && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground text-center">Frente</p>
                  <img 
                    src={profile.foto_frente_url} 
                    alt="Foto frente" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              {profile.foto_lado_url && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground text-center">Lado</p>
                  <img 
                    src={profile.foto_lado_url} 
                    alt="Foto lado" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              {profile.foto_costas_url && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground text-center">Costas</p>
                  <img 
                    src={profile.foto_costas_url} 
                    alt="Foto costas" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      {profile.observacoes_adicionais && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Observações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{profile.observacoes_adicionais}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
