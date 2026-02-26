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
  KeyRound,
  Download,
  Unlock,
  Trash2,
  AlertTriangle,
  Mail,
  RefreshCw,
} from "lucide-react";
import { generateAnamnesePdf } from "@/lib/generateAnamnesePdf";
import { AdminEvolutionSection } from "@/components/admin/AdminEvolutionSection";
import { AdminAccessControlSection } from "@/components/admin/AdminAccessControlSection";
import { AdminRenascerSection } from "@/components/admin/AdminRenascerSection";
import { BodyAssessmentImport } from "@/components/admin/BodyAssessmentImport";
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
import { createBodyPhotosSignedUrl } from "@/lib/bodyPhotos";

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
  horario_treino: string | null;
  horario_acorda: string | null;
  horario_dorme: string | null;
}

interface Subscription {
  id: string;
  status: string;
  plan_type: string;
  current_period_start: string | null;
  current_period_end: string | null;
  access_blocked: boolean | null;
  blocked_reason: string | null;
}

const PLAN_OPTIONS = [
  { value: "gratuito", label: "Gratuito - Cortesia", days: 30 },
  { value: "elite_fundador", label: "Elite Fundador - R$49,90/mês", days: 30 },
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [unblocking, setUnblocking] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signedBodyPhotos, setSignedBodyPhotos] = useState<{ frente: string | null; lado: string | null; costas: string | null }>(
    {
      frente: null,
      lado: null,
      costas: null,
    }
  );
  const [updateEmailOpen, setUpdateEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [syncingStripe, setSyncingStripe] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;

    const signOrNull = async (value: string | null) => {
      if (!value) return null;
      try {
        return await createBodyPhotosSignedUrl(value);
      } catch (e) {
        console.warn("Não foi possível gerar URL assinada (admin):", e);
        return null;
      }
    };

    const run = async () => {
      if (!profile) return;
      const [frente, lado, costas] = await Promise.all([
        signOrNull(profile.foto_frente_url),
        signOrNull(profile.foto_lado_url),
        signOrNull(profile.foto_costas_url),
      ]);

      if (!cancelled) {
        setSignedBodyPhotos({ frente, lado, costas });
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [profile?.foto_frente_url, profile?.foto_lado_url, profile?.foto_costas_url]);

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

  const handleUnblockAccess = async () => {
    if (!id || !subscription) {
      toast.error("Nenhuma assinatura encontrada");
      return;
    }

    setUnblocking(true);
    try {
      // Update subscription to unblock
      const { error: subError } = await supabase
        .from("subscriptions")
        .update({
          access_blocked: false,
          blocked_reason: null,
          // Reset expiration to 7 more days
          invitation_expires_at: addDays(new Date(), 7).toISOString(),
        })
        .eq("id", subscription.id);

      if (subError) throw subError;

      // Update profile status to active
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ client_status: "active" })
        .eq("id", id);

      if (profileError) throw profileError;

      toast.success("Acesso desbloqueado com sucesso! O cliente tem mais 7 dias.");
      fetchSubscription();
      fetchProfile();
    } catch (error) {
      console.error("Error unblocking access:", error);
      toast.error("Erro ao desbloquear acesso");
    } finally {
      setUnblocking(false);
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

  const handleUpdateEmail = async () => {
    if (!id || !newEmail) {
      toast.error("Digite o novo email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error("Formato de email inválido");
      return;
    }

    setUpdatingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-update-email", {
        body: { userId: id, newEmail },
      });

      if (error) throw error;

      toast.success("Email atualizado com sucesso!");
      setUpdateEmailOpen(false);
      setNewEmail("");
      
      if (profile) {
        setProfile({ ...profile, email: newEmail });
      }
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast.error(error.message || "Erro ao atualizar email");
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleSyncStripe = async () => {
    if (!id) return;

    setSyncingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-stripe-subscription", {
        body: { user_id: id },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || "Assinatura sincronizada com sucesso!");
        fetchSubscription();
      } else {
        toast.error(data?.message || "Não foi possível sincronizar a assinatura");
      }
    } catch (error: any) {
      console.error("Error syncing Stripe:", error);
      toast.error(error.message || "Erro ao sincronizar com Stripe");
    } finally {
      setSyncingStripe(false);
    }
  };

  const handleDownloadAnamnesePdf = async () => {
    if (!profile) return;
    
    setGeneratingPdf(true);
    try {
      await generateAnamnesePdf(profile, signedBodyPhotos);
      toast.success("PDF da anamnese gerado com sucesso!");
    } catch (error) {
      console.error("Error generating anamnese PDF:", error);
      toast.error("Erro ao gerar PDF da anamnese");
    } finally {
      setGeneratingPdf(false);
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
          horario_treino: profile.horario_treino,
          horario_acorda: profile.horario_acorda,
          horario_dorme: profile.horario_dorme,
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

  const handleDeleteClient = async () => {
    if (!profile?.email) {
      toast.error("Email do cliente não encontrado");
      return;
    }

    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { email: profile.email },
      });

      if (error) throw error;

      toast.success(`Cliente ${profile.full_name} excluído com sucesso!`);
      setDeleteDialogOpen(false);
      navigate("/admin/clientes");
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast.error(error.message || "Erro ao excluir cliente");
    } finally {
      setDeleting(false);
    }
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
                    {subscription.access_blocked && (
                      <Badge variant="destructive">Bloqueado</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {subscription.plan_type}
                      {subscription.current_period_end && (
                        <> - Até {format(new Date(subscription.current_period_end), "dd/MM/yyyy", { locale: ptBR })}</>
                      )}
                    </span>
                  </div>
                )}

                {/* Unblock Access Button */}
                {subscription?.access_blocked && (
                  <div className="pt-2 border-t border-destructive/20">
                    <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">Acesso Bloqueado</p>
                        <p className="text-xs text-muted-foreground">
                          {subscription.blocked_reason || "Acesso expirado por inatividade"}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleUnblockAccess}
                        disabled={unblocking}
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        {unblocking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            Desbloquear
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sync Stripe Button */}
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSyncStripe}
                    disabled={syncingStripe}
                    className="w-full"
                  >
                    {syncingStripe ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    <span className="text-xs sm:text-sm">Sincronizar Stripe</span>
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Atualiza o status da assinatura diretamente do Stripe
                  </p>
                </div>
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

              {/* Update Email */}
              <div>
                <Label className="mb-2 block">Alterar Email</Label>
                <Dialog open={updateEmailOpen} onOpenChange={setUpdateEmailOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="text-xs sm:text-sm">Alterar Email do Cliente</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Alterar Email do Cliente</DialogTitle>
                      <DialogDescription>
                        Email atual: <strong>{profile.email}</strong>
                        <br />
                        Digite o novo email para {profile.full_name}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="newEmail">Novo Email</Label>
                        <Input
                          id="newEmail"
                          type="email"
                          placeholder="novo@email.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setUpdateEmailOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        variant="fire" 
                        onClick={handleUpdateEmail}
                        disabled={updatingEmail || !newEmail}
                      >
                        {updatingEmail ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Mail className="h-4 w-4 mr-2" />
                        )}
                        Atualizar Email
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <p className="text-xs text-muted-foreground mt-1">
                  Altera o email de login do cliente
                </p>
              </div>

              {/* Download Anamnese PDF */}
              <div>
                <Label className="mb-2 block">Baixar Anamnese</Label>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadAnamnesePdf} 
                  disabled={generatingPdf}
                  className="w-full"
                  size="sm"
                >
                  {generatingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  <span className="text-xs sm:text-sm">Baixar PDF da Anamnese</span>
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Gera um PDF com todas as informações e fotos do cliente
                </p>
              </div>

              {/* Access Control */}
              <AdminAccessControlSection clientId={id!} />

              {/* Delete Client */}
              <div className="pt-4 border-t border-destructive/20">
                <Label className="mb-2 block text-destructive">Zona de Perigo</Label>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="text-xs sm:text-sm">Excluir Cliente</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Excluir Cliente
                      </DialogTitle>
                      <DialogDescription>
                        Você tem certeza que deseja excluir <strong>{profile.full_name}</strong>?
                        <br /><br />
                        Esta ação é <strong>irreversível</strong> e irá remover:
                        <ul className="list-disc list-inside mt-2 text-left">
                          <li>Conta de acesso</li>
                          <li>Dados do perfil</li>
                          <li>Histórico de protocolos</li>
                          <li>Registros de check-ins</li>
                          <li>Conversas de suporte</li>
                        </ul>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteClient}
                        disabled={deleting}
                      >
                        {deleting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Sim, Excluir
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <p className="text-xs text-muted-foreground mt-1">
                  Remove permanentemente o cliente e todos os seus dados
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fotos Corporais - Upload pelo Admin */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Fotos Corporais
            </CardTitle>
            <CardDescription>
              Envie ou substitua as fotos corporais do cliente (Frente, Lado, Costas)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {([
                { key: "frente" as const, label: "Frente", field: "foto_frente_url" as const },
                { key: "lado" as const, label: "Lado", field: "foto_lado_url" as const },
                { key: "costas" as const, label: "Costas", field: "foto_costas_url" as const },
              ]).map(({ key, label, field }) => (
                <div key={key} className="space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-center">{label}</p>
                  {profile[field] && signedBodyPhotos[key] ? (
                    <a href={signedBodyPhotos[key]!} target="_blank" rel="noopener noreferrer">
                      <img
                        src={signedBodyPhotos[key]!}
                        alt={`Foto corporal - ${label}`}
                        className="aspect-[3/4] w-full object-cover rounded-lg border border-border hover:opacity-80 transition-opacity"
                        loading="lazy"
                      />
                    </a>
                  ) : profile[field] ? (
                    <div className="aspect-[3/4] rounded-lg border border-border bg-muted flex items-center justify-center">
                      <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="aspect-[3/4] rounded-lg border border-dashed border-muted-foreground/30 bg-muted/50 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <label className="block">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingPhoto !== null}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !id) return;

                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("Imagem muito grande (máx 5MB)");
                          return;
                        }

                        setUploadingPhoto(key);
                        try {
                          const ext = file.name.split(".").pop() || "jpg";
                          const path = `${id}/${key}-${Date.now()}.${ext}`;

                          const { error: uploadErr } = await supabase.storage
                            .from("body-photos")
                            .upload(path, file, { upsert: true });

                          if (uploadErr) throw uploadErr;

                          const { error: updateErr } = await supabase
                            .from("profiles")
                            .update({ [field]: path })
                            .eq("id", id);

                          if (updateErr) throw updateErr;

                          setProfile((prev) => prev ? { ...prev, [field]: path } : prev);

                          const signedUrl = await createBodyPhotosSignedUrl(path);
                          setSignedBodyPhotos((prev) => ({ ...prev, [key]: signedUrl }));

                          toast.success(`Foto ${label} enviada com sucesso!`);
                        } catch (err: any) {
                          console.error(`Erro upload ${key}:`, err);
                          toast.error(err.message || `Erro ao enviar foto ${label}`);
                        } finally {
                          setUploadingPhoto(null);
                          e.target.value = "";
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      disabled={uploadingPhoto !== null}
                      asChild
                    >
                      <span className="cursor-pointer">
                        {uploadingPhoto === key ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Camera className="h-3 w-3 mr-1" />
                        )}
                        {profile[field] ? "Substituir" : "Enviar"}
                      </span>
                    </Button>
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evolução do Cliente */}
        <AdminEvolutionSection 
          clientId={id!}
          clientName={profile.full_name}
          initialWeight={profile.weight}
          planType={subscription?.plan_type || null}
          initialPhotoPaths={{
            frente: profile.foto_frente_url,
            lado: profile.foto_lado_url,
            costas: profile.foto_costas_url,
          }}
        />

        {/* Status & Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

        {/* Rotina */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rotina</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label>Horário de Treino</Label>
              <Input 
                type="time"
                value={profile.horario_treino || ""} 
                onChange={(e) => updateField("horario_treino", e.target.value)} 
              />
            </div>
            <div>
              <Label>Horário que Acorda</Label>
              <Input 
                type="time"
                value={profile.horario_acorda || ""} 
                onChange={(e) => updateField("horario_acorda", e.target.value)} 
              />
            </div>
            <div>
              <Label>Horário que Dorme</Label>
              <Input 
                type="time"
                value={profile.horario_dorme || ""} 
                onChange={(e) => updateField("horario_dorme", e.target.value)} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Saúde */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saúde</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
            <div className="sm:col-span-2 lg:col-span-1">
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
          <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

        {/* Renascer Mode */}
        {id && <AdminRenascerSection clientId={id} />}

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

      </div>
    </ClientLayout>
  );
}
