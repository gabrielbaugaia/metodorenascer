import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ArrowLeft, Save, MessageSquare, Bell, Camera, UserPlus, Plus, 
  Trash2, Users, UserX, Gift, Target, Zap, Calendar, Cake, 
  BarChart, Send, Clock, Pencil, AlertTriangle
} from "lucide-react";
import { MessageMetricsPanel } from "@/components/admin/MessageMetricsPanel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TargetAudience {
  type: string;
  plan_filter?: string;
  goal?: string;
}

interface AutomatedMessage {
  id: string;
  trigger_type: string;
  message_title: string;
  message_content: string;
  is_active: boolean;
  is_custom: boolean;
  target_audience: TargetAudience;
  created_at: string;
  updated_at: string;
}

const triggerTypeLabels: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  inactivity_3_days: {
    label: "Inatividade (3 dias)",
    icon: <Bell className="h-5 w-5" />,
    description: "Enviada quando o cliente não acessa o app há 3 dias",
  },
  photo_reminder_30_days: {
    label: "Lembrete de Fotos (30 dias)",
    icon: <Camera className="h-5 w-5" />,
    description: "Enviada quando fazem 30 dias desde a última foto de progresso",
  },
  welcome: {
    label: "Boas-vindas",
    icon: <UserPlus className="h-5 w-5" />,
    description: "Enviada quando um novo cliente se cadastra",
  },
  birthday: {
    label: "Aniversário",
    icon: <Cake className="h-5 w-5" />,
    description: "Enviada no dia do aniversário do cliente",
  },
  inactive_after_signup: {
    label: "Inativo após Cadastro",
    icon: <UserX className="h-5 w-5" />,
    description: "Clientes que não acessaram após se cadastrar",
  },
  goal_weight_loss: {
    label: "Foco: Emagrecimento",
    icon: <Target className="h-5 w-5" />,
    description: "Mensagem para clientes focados em emagrecimento",
  },
  goal_hypertrophy: {
    label: "Foco: Hipertrofia",
    icon: <Zap className="h-5 w-5" />,
    description: "Mensagem para clientes focados em ganho de massa",
  },
  goal_conditioning: {
    label: "Foco: Condicionamento",
    icon: <Zap className="h-5 w-5" />,
    description: "Mensagem para clientes focados em condicionamento",
  },
  active_clients: {
    label: "Clientes Ativos",
    icon: <Users className="h-5 w-5" />,
    description: "Mensagem para todos os clientes ativos",
  },
  inactive_clients: {
    label: "Clientes Inativos",
    icon: <UserX className="h-5 w-5" />,
    description: "Mensagem para clientes inativos",
  },
  free_plan_invites: {
    label: "Convidados (Plano Free)",
    icon: <Gift className="h-5 w-5" />,
    description: "Clientes que entraram via convite gratuito",
  },
  custom: {
    label: "Personalizada",
    icon: <MessageSquare className="h-5 w-5" />,
    description: "Mensagem personalizada criada pelo admin",
  },
};

const audienceOptions = [
  { value: "all", label: "Todos os Clientes" },
  { value: "active", label: "Clientes Ativos" },
  { value: "inactive", label: "Clientes Inativos" },
  { value: "free_invites", label: "Convidados (Plano Free)" },
  { value: "inactive_after_signup", label: "Não acessaram após cadastro" },
  { value: "birthday", label: "Aniversariantes" },
  { value: "goal_emagrecimento", label: "Foco: Emagrecimento" },
  { value: "goal_hipertrofia", label: "Foco: Hipertrofia" },
  { value: "goal_condicionamento", label: "Foco: Condicionamento" },
];

export default function AdminMensagens() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [messages, setMessages] = useState<AutomatedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<AutomatedMessage | null>(null);
  
  // New message form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAudience, setNewAudience] = useState("all");
  const [newPlanFilter, setNewPlanFilter] = useState("all");
  const [newScheduledAt, setNewScheduledAt] = useState("");
  const [newRecurring, setNewRecurring] = useState("once");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchMessages();
    }
  }, [user, isAdmin]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("automated_messages")
        .select("*")
        .order("is_custom", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      const typedData = (data || []).map(msg => ({
        ...msg,
        is_custom: msg.is_custom ?? false,
        target_audience: (msg.target_audience as unknown as TargetAudience) ?? { type: "all" }
      }));
      
      setMessages(typedData);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      toast.error("Erro ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (message: AutomatedMessage) => {
    setSaving(message.id);
    try {
      const { error } = await supabase
        .from("automated_messages")
        .update({
          message_title: message.message_title,
          message_content: message.message_content,
          is_active: message.is_active,
        })
        .eq("id", message.id);

      if (error) throw error;
      toast.success("Mensagem salva com sucesso");
    } catch (error) {
      console.error("Erro ao salvar mensagem:", error);
      toast.error("Erro ao salvar mensagem");
    } finally {
      setSaving(null);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Preencha título e conteúdo");
      return;
    }

    setCreating(true);
    try {
      const triggerType = `custom_${Date.now()}`;
      const targetAudience: TargetAudience = { type: newAudience };
      
      if (newAudience === "inactive_after_signup") {
        targetAudience.plan_filter = newPlanFilter;
      }

      const { error } = await supabase
        .from("automated_messages")
        .insert([{
          trigger_type: triggerType,
          message_title: newTitle,
          message_content: newContent,
          is_active: true,
          is_custom: true,
          target_audience: JSON.parse(JSON.stringify(targetAudience)),
          scheduled_at: newScheduledAt || null,
          schedule_recurring: newRecurring,
        }]);

      if (error) throw error;
      
      toast.success("Mensagem criada com sucesso");
      setShowNewDialog(false);
      setNewTitle("");
      setNewContent("");
      setNewAudience("all");
      setNewPlanFilter("all");
      setNewScheduledAt("");
      setNewRecurring("once");
      fetchMessages();
    } catch (error) {
      console.error("Erro ao criar mensagem:", error);
      toast.error("Erro ao criar mensagem");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from("automated_messages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Mensagem excluída");
      setMessages(prev => prev.filter(msg => msg.id !== id));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Erro ao excluir mensagem:", error);
      toast.error("Erro ao excluir mensagem");
    } finally {
      setDeleting(null);
    }
  };

  const handleUpdateEditing = async () => {
    if (!editingMessage) return;
    
    setSaving(editingMessage.id);
    try {
      const { error } = await supabase
        .from("automated_messages")
        .update({
          message_title: editingMessage.message_title,
          message_content: editingMessage.message_content,
          is_active: editingMessage.is_active,
        })
        .eq("id", editingMessage.id);

      if (error) throw error;
      
      setMessages(prev =>
        prev.map(msg =>
          msg.id === editingMessage.id ? editingMessage : msg
        )
      );
      toast.success("Mensagem atualizada com sucesso");
      setEditingMessage(null);
    } catch (error) {
      console.error("Erro ao atualizar mensagem:", error);
      toast.error("Erro ao atualizar mensagem");
    } finally {
      setSaving(null);
    }
  };

  const handleSendNow = async (messageId: string) => {
    setSending(messageId);
    try {
      const { data, error } = await supabase.functions.invoke("process-automated-messages", {
        body: { messageId, sendNow: true },
      });

      if (error) throw error;
      
      toast.success(`Mensagem enviada para ${data?.totalSent || 0} clientes`);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(null);
    }
  };

  const updateMessage = (id: string, field: keyof AutomatedMessage, value: string | boolean) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === id ? { ...msg, [field]: value } : msg
      )
    );
  };

  const getAudienceLabel = (audience: TargetAudience) => {
    const option = audienceOptions.find(o => o.value === audience.type);
    return option?.label || "Todos";
  };

  if (authLoading || adminLoading || loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">Mensagens Automáticas</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Configure as mensagens enviadas automaticamente aos clientes
              </p>
            </div>
          </div>
          
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto shrink-0">
                <Plus className="h-4 w-4" />
                Nova Mensagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Mensagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Público-Alvo</Label>
                  <Select value={newAudience} onValueChange={setNewAudience}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audienceOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newAudience === "inactive_after_signup" && (
                  <div className="space-y-2">
                    <Label>Filtro de Plano</Label>
                    <Select value={newPlanFilter} onValueChange={setNewPlanFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Planos</SelectItem>
                        <SelectItem value="free">Apenas Plano Free</SelectItem>
                        <SelectItem value="paid">Apenas Planos Pagos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Lembrete Especial"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conteúdo da Mensagem</Label>
                  <Textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Digite o conteúdo da mensagem... Use {nome} para personalizar"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Agendar Envio
                    </Label>
                    <Input
                      type="datetime-local"
                      value={newScheduledAt}
                      onChange={(e) => setNewScheduledAt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Recorrência</Label>
                    <Select value={newRecurring} onValueChange={setNewRecurring}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Uma vez</SelectItem>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleCreate} 
                  disabled={creating}
                  className="w-full"
                >
                  {creating ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Criando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Criar Mensagem
                    </span>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-2">
              <BarChart className="h-4 w-4" />
              Métricas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <div className="grid gap-6">
          {messages.map((message) => {
            const config = triggerTypeLabels[message.trigger_type] || 
              (message.is_custom ? triggerTypeLabels.custom : {
                label: message.trigger_type,
                icon: <MessageSquare className="h-5 w-5" />,
                description: "",
              });

            return (
              <Card key={message.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                          {config.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base sm:text-lg">{config.label}</CardTitle>
                            {message.is_custom && (
                              <Badge variant="secondary" className="text-xs">Personalizada</Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{config.description}</p>
                          {message.target_audience && message.is_custom && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {getAudienceLabel(message.target_audience)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Toggle on right */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Label htmlFor={`active-${message.id}`} className="text-xs sm:text-sm whitespace-nowrap">
                          {message.is_active ? "Ativa" : "Inativa"}
                        </Label>
                        <Switch
                          id={`active-${message.id}`}
                          checked={message.is_active}
                          onCheckedChange={(checked) => updateMessage(message.id, "is_active", checked)}
                        />
                      </div>
                    </div>
                    
                    {/* Actions row */}
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-xs sm:text-sm"
                        onClick={() => handleSendNow(message.id)}
                        disabled={sending === message.id}
                      >
                        {sending === message.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span className="hidden xs:inline">Enviar Agora</span>
                            <span className="xs:hidden">Enviar</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setEditingMessage(message)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => setDeleteConfirmId(message.id)}
                        disabled={deleting === message.id}
                      >
                        {deleting === message.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Título</p>
                      <p className="text-sm">{message.message_title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conteúdo</p>
                      <p className="text-sm whitespace-pre-wrap line-clamp-4">{message.message_content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
            </div>
          </TabsContent>

          <TabsContent value="metrics">
            <MessageMetricsPanel />
          </TabsContent>
        </Tabs>

        {/* Dialog de Edição */}
        <Dialog open={!!editingMessage} onOpenChange={(open) => !open && setEditingMessage(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                Editar Mensagem
              </DialogTitle>
            </DialogHeader>
            {editingMessage && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Status</span>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="edit-active" className="text-sm">
                      {editingMessage.is_active ? "Ativa" : "Inativa"}
                    </Label>
                    <Switch
                      id="edit-active"
                      checked={editingMessage.is_active}
                      onCheckedChange={(checked) => 
                        setEditingMessage({ ...editingMessage, is_active: checked })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={editingMessage.message_title}
                    onChange={(e) => 
                      setEditingMessage({ ...editingMessage, message_title: e.target.value })
                    }
                    placeholder="Título da mensagem"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conteúdo da Mensagem</Label>
                  <Textarea
                    value={editingMessage.message_content}
                    onChange={(e) => 
                      setEditingMessage({ ...editingMessage, message_content: e.target.value })
                    }
                    placeholder="Conteúdo da mensagem... Use {nome} para personalizar"
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use <code className="px-1 py-0.5 rounded bg-muted">{"{nome}"}</code> para incluir o nome do cliente
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingMessage(null)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdateEditing}
                    disabled={saving === editingMessage.id}
                    className="flex-1"
                  >
                    {saving === editingMessage.id ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Salvando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta mensagem automática? 
                Esta ação não pode ser desfeita e o histórico de envios será perdido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Excluindo...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </span>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ClientLayout>
  );
}
