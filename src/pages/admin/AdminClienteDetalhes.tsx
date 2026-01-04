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
  Camera,
  Sparkles,
  CreditCard,
  KeyRound
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
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

interface Subscription {
  id: string;
  status: string;
  plan_type: string;
  current_period_start: string | null;
  current_period_end: string | null;
}

const PLAN_OPTIONS = [
  { value: "free", label: "Free - Cortesia", days: 30 },
  { value: "embaixador", label: "Embaixador - R$49,90/mês", days: 30 },
  { value: "mensal", label: "Mensal - R$197/mês", days: 30 },
  { value: "trimestral", label: "Trimestral - R$497", days: 90 },
  { value: "semestral", label: "Semestral - R$697", days: 180 },
  { value: "anual", label: "Anual - R$997", days: 365 },
];

export default function AdminClienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingProtocol, setGeneratingProtocol] = useState<string | null>(null);
  const [assigningPlan, setAssigningPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

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
      fetchSubscription();
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

  const fetchSubscription = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setSubscription(data);
        setSelectedPlan(data.plan_type || "");
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const handleAssignPlan = async () => {
    if (!id || !selectedPlan) {
      toast.error("Selecione um plano");
      return;
    }

    setAssigningPlan(true);
    try {
      const planInfo = PLAN_OPTIONS.find(p => p.value === selectedPlan);
      const now = new Date();
      const periodEnd = addDays(now, planInfo?.days || 30);

      // Check if subscription exists
      if (subscription) {
        // Update existing subscription
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            plan_type: selectedPlan,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq("id", subscription.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from("subscriptions")
          .insert({
            user_id: id,
            status: "active",
            plan_type: selectedPlan,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          });

        if (error) throw error;
      }

      toast.success("Plano atribuído com sucesso!");
      fetchSubscription();
    } catch (error) {
      console.error("Error assigning plan:", error);
      toast.error("Erro ao atribuir plano");
    } finally {
      setAssigningPlan(false);
    }
  };

  const handleGenerateProtocol = async (tipo: "treino" | "nutricao" | "mindset") => {
    if (!id) return;

    setGeneratingProtocol(tipo);
    try {
      // Fetch profile for context
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      // Mark existing protocols of this type as inactive
      await supabase
        .from("protocolos")
        .update({ ativo: false })
        .eq("user_id", id)
        .eq("tipo", tipo);

      const { error } = await supabase.functions.invoke("generate-protocol", {
        body: {
          tipo,
          userId: id,
          userContext: profileData,
          planType: subscription?.plan_type || "mensal",
        },
      });

      if (error) throw error;

      const tipoLabel = tipo === "treino" ? "treino" : tipo === "nutricao" ? "nutrição" : "mindset";
      toast.success(`Protocolo de ${tipoLabel} gerado com sucesso!`);
    } catch (error: any) {
      console.error(`Error generating ${tipo} protocol:`, error);
      toast.error(error.message || `Erro ao gerar protocolo de ${tipo}`);
    } finally {
      setGeneratingProtocol(null);
    }
  };

  const handleGenerateAllProtocols = async () => {
    if (!id) return;

    setGeneratingProtocol("all");
    try {
      const types: Array<"treino" | "nutricao" | "mindset"> = ["treino", "nutricao", "mindset"];
      
      for (const tipo of types) {
        await handleGenerateProtocolSilent(tipo);
      }

      toast.success("Todos os protocolos gerados com sucesso!");
    } catch (error: any) {
      console.error("Error generating protocols:", error);
      toast.error(error.message || "Erro ao gerar protocolos");
    } finally {
      setGeneratingProtocol(null);
    }
  };

  const handleGenerateProtocolSilent = async (tipo: "treino" | "nutricao" | "mindset") => {
    // Fetch profile for context
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    // Mark existing protocols of this type as inactive
    await supabase
      .from("protocolos")
      .update({ ativo: false })
      .eq("user_id", id)
      .eq("tipo", tipo);

    const { error } = await supabase.functions.invoke("generate-protocol", {
      body: {
        tipo,
        userId: id,
        userContext: profileData,
        planType: subscription?.plan_type || "mensal",
      },
    });

    if (error) throw error;
  };

  const handleResetPassword = async () => {
    if (!id || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: { userId: id, newPassword },
      });

      if (error) throw error;

      toast.success("Senha redefinida com sucesso!");
      setResetPasswordOpen(false);
      setNewPassword("");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setResettingPassword(false);
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
      <div className="space-y-6 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clientes")} className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{profile.full_name}</h1>
                <p className="text-muted-foreground text-sm truncate">{profile.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/admin/planos?userId=${id}`)}>
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Ver Protocolos</span>
              </Button>
              <Button variant="fire" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin sm:mr-2" /> : <Save className="h-4 w-4 sm:mr-2" />}
                <span className="hidden sm:inline">Salvar</span>
              </Button>
            </div>
          </div>

          {/* Actions Card */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assign Plan */}
              <div className="space-y-3">
                <Label className="block">Atribuir Plano</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger className="w-full sm:flex-1">
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssignPlan} disabled={assigningPlan || !selectedPlan} className="w-full sm:w-auto">
                    {assigningPlan ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Atribuir
                  </Button>
                </div>
                {subscription && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                      {subscription.status === "active" ? "Ativo" : subscription.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {subscription.plan_type}
                      {subscription.current_period_end && (
                        <> - Até {format(new Date(subscription.current_period_end), "dd/MM/yyyy", { locale: ptBR })}</>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Generate Protocols */}
              <div className="space-y-3">
                <Label className="block">Gerar Protocolos</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleGenerateProtocol("treino")} 
                    disabled={generatingProtocol !== null}
                    size="sm"
                    className="w-full"
                  >
                    {generatingProtocol === "treino" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Treino
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleGenerateProtocol("nutricao")} 
                    disabled={generatingProtocol !== null}
                    size="sm"
                    className="w-full"
                  >
                    {generatingProtocol === "nutricao" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Nutrição
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleGenerateProtocol("mindset")} 
                    disabled={generatingProtocol !== null}
                    size="sm"
                    className="w-full"
                  >
                    {generatingProtocol === "mindset" ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Mindset
                  </Button>
                </div>
                <Button 
                  variant="fire" 
                  onClick={handleGenerateAllProtocols} 
                  disabled={generatingProtocol !== null}
                  className="w-full"
                  size="sm"
                >
                  {generatingProtocol === "all" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  <span className="text-xs sm:text-sm">Gerar Todos (Treino + Nutrição + Mindset)</span>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Gera protocolos baseados na anamnese do cliente
                </p>
              </div>

              {/* Reset Password */}
              <div>
                <Label className="mb-2 block">Redefinir Senha</Label>
                <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" size="sm">
                      <KeyRound className="h-4 w-4 mr-2" />
                      <span className="text-xs sm:text-sm">Definir Senha Provisória</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Redefinir Senha do Cliente</DialogTitle>
                      <DialogDescription>
                        Defina uma nova senha provisória para {profile.full_name}. 
                        O cliente poderá alterá-la depois no perfil.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <Input
                          id="newPassword"
                          type="text"
                          placeholder="Mínimo 6 caracteres"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        variant="fire" 
                        onClick={handleResetPassword}
                        disabled={resettingPassword || newPassword.length < 6}
                      >
                        {resettingPassword ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <KeyRound className="h-4 w-4 mr-2" />
                        )}
                        Redefinir Senha
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <p className="text-xs text-muted-foreground mt-1">
                  Cria uma senha provisória para o cliente acessar
                </p>
              </div>
            </CardContent>
          </Card>
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
