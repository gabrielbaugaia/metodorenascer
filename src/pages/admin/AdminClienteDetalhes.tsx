import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  User, 
  FileText,
  Camera
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  weight: number | null;
  height: number | null;
  age: number | null;
  sexo: string | null;
  goals: string | null;
  injuries: string | null;
  availability: string | null;
  nivel_experiencia: string | null;
  restricoes_medicas: string | null;
  objetivos_detalhados: any;
  medidas: any;
  telefone: string | null;
  whatsapp: string | null;
  objetivo_principal: string | null;
  ja_treinou_antes: boolean | null;
  local_treino: string | null;
  dias_disponiveis: string | null;
  nivel_condicionamento: string | null;
  pratica_aerobica: boolean | null;
  escada_sem_cansar: string | null;
  condicoes_saude: string | null;
  toma_medicamentos: boolean | null;
  refeicoes_por_dia: string | null;
  bebe_agua_frequente: boolean | null;
  restricoes_alimentares: string | null;
  qualidade_sono: string | null;
  nivel_estresse: string | null;
  consome_alcool: string | null;
  fuma: string | null;
  foto_frente_url: string | null;
  foto_lado_url: string | null;
  foto_costas_url: string | null;
  observacoes_adicionais: string | null;
  client_status: "active" | "paused" | "blocked" | "canceled" | null;
  created_at: string | null;
  data_nascimento: string | null;
}

export default function AdminClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!adminLoading && !isAdmin) {
      navigate("/area-cliente");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin && id) {
      fetchProfile();
    }
  }, [isAdmin, id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erro ao carregar perfil do cliente");
      navigate("/admin/clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          weight: profile.weight,
          height: profile.height,
          age: profile.age,
          sexo: profile.sexo,
          goals: profile.goals,
          injuries: profile.injuries,
          availability: profile.availability,
          nivel_experiencia: profile.nivel_experiencia,
          restricoes_medicas: profile.restricoes_medicas,
          telefone: profile.telefone,
          whatsapp: profile.whatsapp,
          objetivo_principal: profile.objetivo_principal,
          ja_treinou_antes: profile.ja_treinou_antes,
          local_treino: profile.local_treino,
          dias_disponiveis: profile.dias_disponiveis,
          nivel_condicionamento: profile.nivel_condicionamento,
          pratica_aerobica: profile.pratica_aerobica,
          escada_sem_cansar: profile.escada_sem_cansar,
          condicoes_saude: profile.condicoes_saude,
          toma_medicamentos: profile.toma_medicamentos,
          refeicoes_por_dia: profile.refeicoes_por_dia,
          bebe_agua_frequente: profile.bebe_agua_frequente,
          restricoes_alimentares: profile.restricoes_alimentares,
          qualidade_sono: profile.qualidade_sono,
          nivel_estresse: profile.nivel_estresse,
          consome_alcool: profile.consome_alcool,
          fuma: profile.fuma,
          observacoes_adicionais: profile.observacoes_adicionais,
          client_status: profile.client_status,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Profile, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  if (authLoading || adminLoading || loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  if (!isAdmin || !profile) return null;

  return (
    <ClientLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clientes")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <p className="text-muted-foreground text-sm">{profile.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/admin/planos?userId=${id}`)}>
              <FileText className="h-4 w-4 mr-2" />
              Ver Protocolos
            </Button>
            <Button variant="fire" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </div>

        {/* Status & Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Nome Completo</Label>
              <Input 
                value={profile.full_name || ""} 
                onChange={(e) => updateField("full_name", e.target.value)} 
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={profile.client_status || "active"} onValueChange={(v) => updateField("client_status", v as "active" | "paused" | "blocked" | "canceled")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input 
                value={profile.whatsapp || profile.telefone || ""} 
                onChange={(e) => updateField("whatsapp", e.target.value)} 
              />
            </div>
            <div>
              <Label>Peso (kg)</Label>
              <Input 
                type="number" 
                value={profile.weight || ""} 
                onChange={(e) => updateField("weight", parseFloat(e.target.value) || null)} 
              />
            </div>
            <div>
              <Label>Altura (cm)</Label>
              <Input 
                type="number" 
                value={profile.height || ""} 
                onChange={(e) => updateField("height", parseFloat(e.target.value) || null)} 
              />
            </div>
            <div>
              <Label>Idade</Label>
              <Input 
                type="number" 
                value={profile.age || ""} 
                onChange={(e) => updateField("age", parseInt(e.target.value) || null)} 
              />
            </div>
            <div>
              <Label>Sexo</Label>
              <Select value={profile.sexo || ""} onValueChange={(v) => updateField("sexo", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cadastrado em</Label>
              <Input 
                value={profile.created_at ? format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR }) : "—"} 
                disabled 
              />
            </div>
          </CardContent>
        </Card>

        {/* Objetivo & Treino */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Objetivo e Treino</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Objetivo Principal</Label>
              <Select value={profile.objetivo_principal || profile.goals || ""} onValueChange={(v) => updateField("objetivo_principal", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
                  <SelectItem value="Ganho de massa">Ganho de massa</SelectItem>
                  <SelectItem value="Definição">Definição</SelectItem>
                  <SelectItem value="Saúde geral">Saúde geral</SelectItem>
                  <SelectItem value="Condicionamento">Condicionamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Local de Treino</Label>
              <Select value={profile.local_treino || ""} onValueChange={(v) => updateField("local_treino", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="academia">Academia</SelectItem>
                  <SelectItem value="ar_livre">Ar livre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dias Disponíveis</Label>
              <Input 
                value={profile.dias_disponiveis || profile.availability || ""} 
                onChange={(e) => updateField("dias_disponiveis", e.target.value)} 
              />
            </div>
            <div>
              <Label>Já treinou antes?</Label>
              <div className="flex items-center gap-2 mt-2">
                <Switch 
                  checked={profile.ja_treinou_antes || false} 
                  onCheckedChange={(v) => updateField("ja_treinou_antes", v)} 
                />
                <span className="text-sm">{profile.ja_treinou_antes ? "Sim" : "Não"}</span>
              </div>
            </div>
            <div>
              <Label>Nível de Experiência</Label>
              <Select value={profile.nivel_experiencia || profile.nivel_condicionamento || ""} onValueChange={(v) => updateField("nivel_experiencia", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pratica aeróbico?</Label>
              <div className="flex items-center gap-2 mt-2">
                <Switch 
                  checked={profile.pratica_aerobica || false} 
                  onCheckedChange={(v) => updateField("pratica_aerobica", v)} 
                />
                <span className="text-sm">{profile.pratica_aerobica ? "Sim" : "Não"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saúde */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saúde</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Condições de Saúde</Label>
              <Textarea 
                value={profile.condicoes_saude || ""} 
                onChange={(e) => updateField("condicoes_saude", e.target.value)}
                placeholder="Ex: Diabetes, hipertensão..."
              />
            </div>
            <div>
              <Label>Lesões / Restrições Médicas</Label>
              <Textarea 
                value={profile.injuries || profile.restricoes_medicas || ""} 
                onChange={(e) => updateField("injuries", e.target.value)}
                placeholder="Ex: Dor no joelho, hérnia de disco..."
              />
            </div>
            <div>
              <Label>Toma medicamentos?</Label>
              <div className="flex items-center gap-2 mt-2">
                <Switch 
                  checked={profile.toma_medicamentos || false} 
                  onCheckedChange={(v) => updateField("toma_medicamentos", v)} 
                />
                <span className="text-sm">{profile.toma_medicamentos ? "Sim" : "Não"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alimentação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alimentação</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Refeições por dia</Label>
              <Select value={profile.refeicoes_por_dia || ""} onValueChange={(v) => updateField("refeicoes_por_dia", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2">1-2</SelectItem>
                  <SelectItem value="3-4">3-4</SelectItem>
                  <SelectItem value="5-6">5-6</SelectItem>
                  <SelectItem value="mais">Mais de 6</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bebe água frequentemente?</Label>
              <div className="flex items-center gap-2 mt-2">
                <Switch 
                  checked={profile.bebe_agua_frequente || false} 
                  onCheckedChange={(v) => updateField("bebe_agua_frequente", v)} 
                />
                <span className="text-sm">{profile.bebe_agua_frequente ? "Sim" : "Não"}</span>
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <Label>Restrições Alimentares</Label>
              <Textarea 
                value={profile.restricoes_alimentares || ""} 
                onChange={(e) => updateField("restricoes_alimentares", e.target.value)}
                placeholder="Ex: Vegetariano, intolerância à lactose..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Estilo de Vida */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estilo de Vida</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Qualidade do Sono</Label>
              <Select value={profile.qualidade_sono || ""} onValueChange={(v) => updateField("qualidade_sono", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ruim">Ruim</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="boa">Boa</SelectItem>
                  <SelectItem value="excelente">Excelente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nível de Estresse</Label>
              <Select value={profile.nivel_estresse || ""} onValueChange={(v) => updateField("nivel_estresse", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="muito_alto">Muito Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Consome álcool?</Label>
              <Select value={profile.consome_alcool || ""} onValueChange={(v) => updateField("consome_alcool", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="socialmente">Socialmente</SelectItem>
                  <SelectItem value="frequentemente">Frequentemente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fuma?</Label>
              <Select value={profile.fuma || ""} onValueChange={(v) => updateField("fuma", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="parou">Parou</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={profile.observacoes_adicionais || ""} 
              onChange={(e) => updateField("observacoes_adicionais", e.target.value)}
              placeholder="Observações do admin sobre o cliente..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Fotos */}
        {(profile.foto_frente_url || profile.foto_lado_url || profile.foto_costas_url) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Fotos Corporais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {profile.foto_frente_url && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground text-center">Frente</p>
                    <a href={profile.foto_frente_url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={profile.foto_frente_url} 
                        alt="Foto de frente" 
                        className="aspect-[3/4] object-cover rounded-lg border border-border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  </div>
                )}
                {profile.foto_lado_url && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground text-center">Lado</p>
                    <a href={profile.foto_lado_url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={profile.foto_lado_url} 
                        alt="Foto de lado" 
                        className="aspect-[3/4] object-cover rounded-lg border border-border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  </div>
                )}
                {profile.foto_costas_url && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground text-center">Costas</p>
                    <a href={profile.foto_costas_url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={profile.foto_costas_url} 
                        alt="Foto de costas" 
                        className="aspect-[3/4] object-cover rounded-lg border border-border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientLayout>
  );
}
