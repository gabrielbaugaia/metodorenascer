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
import { toast } from "sonner";
import { ArrowLeft, Save, MessageSquare, Bell, Camera, UserPlus } from "lucide-react";

interface AutomatedMessage {
  id: string;
  trigger_type: string;
  message_title: string;
  message_content: string;
  is_active: boolean;
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
};

export default function AdminMensagens() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [messages, setMessages] = useState<AutomatedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

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
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
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

  const updateMessage = (id: string, field: keyof AutomatedMessage, value: string | boolean) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === id ? { ...msg, [field]: value } : msg
      )
    );
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Mensagens Automáticas</h1>
            <p className="text-muted-foreground">
              Configure as mensagens enviadas automaticamente aos clientes
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {messages.map((message) => {
            const config = triggerTypeLabels[message.trigger_type] || {
              label: message.trigger_type,
              icon: <MessageSquare className="h-5 w-5" />,
              description: "",
            };

            return (
              <Card key={message.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {config.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{config.label}</CardTitle>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${message.id}`} className="text-sm">
                        {message.is_active ? "Ativa" : "Inativa"}
                      </Label>
                      <Switch
                        id={`active-${message.id}`}
                        checked={message.is_active}
                        onCheckedChange={(checked) => updateMessage(message.id, "is_active", checked)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${message.id}`}>Título</Label>
                    <Input
                      id={`title-${message.id}`}
                      value={message.message_title}
                      onChange={(e) => updateMessage(message.id, "message_title", e.target.value)}
                      placeholder="Título da mensagem"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`content-${message.id}`}>Conteúdo da Mensagem</Label>
                    <Textarea
                      id={`content-${message.id}`}
                      value={message.message_content}
                      onChange={(e) => updateMessage(message.id, "message_content", e.target.value)}
                      placeholder="Conteúdo da mensagem automática"
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={() => handleSave(message)}
                    disabled={saving === message.id}
                    className="w-full"
                  >
                    {saving === message.id ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Salvando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Salvar Mensagem
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </ClientLayout>
  );
}
