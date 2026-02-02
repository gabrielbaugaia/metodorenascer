import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { 
  Search, 
  MessageCircle, 
  Eye, 
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  MoreVertical,
  Eraser,
  AlertTriangle,
  User,
  Circle,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Mensagem {
  role: string;
  content: string;
  timestamp?: string;
  editedAt?: string;
  admin_name?: string;
}

interface Conversa {
  id: string;
  user_id: string;
  tipo: string | null;
  mensagens: Mensagem[];
  created_at: string | null;
  updated_at: string | null;
  status?: string | null;
  profile?: {
    full_name: string;
    email: string | null;
  } | null;
}

interface ConversationStatus {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  icon: typeof CheckCircle2;
}

// Helper function to calculate conversation status
const getConversationStatus = (conversa: Conversa): ConversationStatus => {
  const msgs = conversa.mensagens;
  if (!Array.isArray(msgs) || msgs.length === 0) {
    return { label: 'Vazia', color: 'gray', icon: Circle };
  }
  
  const lastMsg = msgs[msgs.length - 1];
  const lastUpdate = new Date(conversa.updated_at || conversa.created_at || Date.now());
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  if (lastMsg.role === 'admin') {
    return { label: 'Intervenção Admin', color: 'blue', icon: User };
  }
  
  if (lastMsg.role === 'assistant') {
    return { label: 'Respondido pela IA', color: 'green', icon: CheckCircle2 };
  }
  
  if (lastMsg.role === 'user') {
    if (lastUpdate < fiveMinutesAgo) {
      return { label: 'Requer Intervenção', color: 'red', icon: AlertTriangle };
    }
    return { label: 'Aguardando IA', color: 'yellow', icon: Clock };
  }
  
  return { label: 'Ativa', color: 'gray', icon: Circle };
};

// Status badge color classes
const getStatusColorClasses = (color: ConversationStatus['color']) => {
  switch (color) {
    case 'green':
      return 'bg-green-500/20 text-green-500 border-green-500/30';
    case 'yellow':
      return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    case 'red':
      return 'bg-red-500/20 text-red-500 border-red-500/30';
    case 'blue':
      return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export default function AdminSuporteChats() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversa, setSelectedConversa] = useState<Conversa | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<{ index: number; content: string } | null>(null);
  const [deletingMessageIndex, setDeletingMessageIndex] = useState<number | null>(null);
  
  // Estados para limpeza de conversas
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmClearSingle, setConfirmClearSingle] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [clearingSingle, setClearingSingle] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!adminLoading && !isAdmin) {
      navigate("/area-cliente");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchConversas();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('admin-conversas')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversas'
          },
          () => {
            fetchConversas();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  const fetchConversas = async () => {
    try {
      const { data, error } = await supabase
        .from("conversas")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each conversa
      const conversasWithProfiles = await Promise.all(
        (data || []).map(async (conversa) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", conversa.user_id)
            .single();

          // Parse mensagens as array
          const mensagens = Array.isArray(conversa.mensagens) 
            ? (conversa.mensagens as unknown as Mensagem[])
            : [];

          return { 
            ...conversa, 
            mensagens,
            profile 
          } as Conversa;
        })
      );

      setConversas(conversasWithProfiles);
    } catch (error) {
      console.error("Error fetching conversas:", error);
      toast.error("Erro ao carregar conversas");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminIntervention = async () => {
    if (!selectedConversa || !adminMessage.trim()) return;

    setSending(true);
    try {
      const mensagens = Array.isArray(selectedConversa.mensagens) 
        ? selectedConversa.mensagens 
        : [];
      
      const updatedMensagens = [
        ...mensagens,
        {
          role: "admin",
          content: adminMessage.trim(),
          timestamp: new Date().toISOString(),
          admin_name: "Gabriel Baú"
        }
      ];

      const { error } = await supabase
        .from("conversas")
        .update({ 
          mensagens: updatedMensagens as unknown as Json,
          updated_at: new Date().toISOString(),
          status: 'admin_intervention'
        })
        .eq("id", selectedConversa.id);

      if (error) throw error;

      toast.success("Mensagem enviada com sucesso!");
      setAdminMessage("");
      setSelectedConversa({
        ...selectedConversa,
        mensagens: updatedMensagens
      });
      fetchConversas();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async () => {
    if (!selectedConversa || editingMessage === null) return;

    setSending(true);
    try {
      const updatedMensagens = [...selectedConversa.mensagens];
      updatedMensagens[editingMessage.index] = {
        ...updatedMensagens[editingMessage.index],
        content: editingMessage.content,
        editedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from("conversas")
        .update({ 
          mensagens: updatedMensagens as unknown as Json,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedConversa.id);

      if (error) throw error;

      toast.success("Mensagem editada com sucesso!");
      setEditingMessage(null);
      setSelectedConversa({
        ...selectedConversa,
        mensagens: updatedMensagens
      });
      fetchConversas();
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("Erro ao editar mensagem");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedConversa || deletingMessageIndex === null) return;

    setSending(true);
    try {
      const updatedMensagens = selectedConversa.mensagens.filter((_, idx) => idx !== deletingMessageIndex);

      const { error } = await supabase
        .from("conversas")
        .update({ 
          mensagens: updatedMensagens as unknown as Json,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedConversa.id);

      if (error) throw error;

      toast.success("Mensagem excluída com sucesso!");
      setDeletingMessageIndex(null);
      setSelectedConversa({
        ...selectedConversa,
        mensagens: updatedMensagens
      });
      fetchConversas();
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Erro ao excluir mensagem");
    } finally {
      setSending(false);
    }
  };

  // Limpar todas as conversas
  const handleClearAllConversations = async () => {
    setClearingAll(true);
    try {
      const { error } = await supabase
        .from("conversas")
        .delete()
        .eq("tipo", "suporte");

      if (error) throw error;

      toast.success("Todas as conversas de suporte foram limpas");
      fetchConversas();
    } catch (error) {
      console.error("Error clearing all conversations:", error);
      toast.error("Erro ao limpar conversas");
    } finally {
      setClearingAll(false);
      setConfirmClearAll(false);
    }
  };

  // Limpar conversa individual (zerar mensagens)
  const handleClearSingleConversation = async () => {
    if (!selectedConversa) return;

    setClearingSingle(true);
    try {
      const { error } = await supabase
        .from("conversas")
        .update({ 
          mensagens: [] as unknown as Json,
          updated_at: new Date().toISOString(),
          status: 'active'
        })
        .eq("id", selectedConversa.id);

      if (error) throw error;

      toast.success("Conversa limpa com sucesso");
      setSelectedConversa({
        ...selectedConversa,
        mensagens: []
      });
      fetchConversas();
    } catch (error) {
      console.error("Error clearing conversation:", error);
      toast.error("Erro ao limpar conversa");
    } finally {
      setClearingSingle(false);
      setConfirmClearSingle(false);
    }
  };

  const getLastMessage = (mensagens: Conversa['mensagens']) => {
    if (!Array.isArray(mensagens) || mensagens.length === 0) {
      return "Sem mensagens";
    }
    const last = mensagens[mensagens.length - 1];
    return last.content?.substring(0, 50) + (last.content?.length > 50 ? "..." : "") || "Sem conteúdo";
  };

  const getMessageCount = (mensagens: Conversa['mensagens']) => {
    return Array.isArray(mensagens) ? mensagens.length : 0;
  };

  const filteredConversas = conversas.filter(
    (conversa) =>
      conversa.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversa.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate status counts
  const statusCounts = {
    active: filteredConversas.filter(c => getMessageCount(c.mensagens) > 0).length,
    awaiting: filteredConversas.filter(c => {
      const status = getConversationStatus(c);
      return status.color === 'yellow' || status.color === 'red';
    }).length,
    interventions: filteredConversas.filter(c => {
      const msgs = c.mensagens;
      if (!Array.isArray(msgs)) return false;
      return msgs.some(m => m.role === 'admin');
    }).length
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

  if (!isAdmin) return null;

  return (
    <ClientLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Suporte - Chats</h1>
            <p className="text-sm md:text-base text-muted-foreground">Monitore e intervenha nas conversas</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {conversas.length} conversas
            </Badge>
            {conversas.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setConfirmClearAll(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Limpar Todas</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card variant="glass">
            <CardContent className="p-3 md:pt-6 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Ativas</p>
                  <p className="text-xl md:text-2xl font-bold">{statusCounts.active}</p>
                </div>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-3 md:pt-6 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Aguardando</p>
                  <p className="text-xl md:text-2xl font-bold">{statusCounts.awaiting}</p>
                </div>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-3 md:pt-6 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Intervenções</p>
                  <p className="text-xl md:text-2xl font-bold">{statusCounts.interventions}</p>
                </div>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <User className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card variant="glass">
          <CardHeader className="pb-3 md:pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
              <div>
                <CardTitle className="text-lg md:text-xl">Conversas dos Clientes</CardTitle>
                <CardDescription className="text-sm">Visualize e intervenha nos chats quando necessário</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
            {/* Mobile: Cards Layout */}
            <div className="md:hidden space-y-3">
              {filteredConversas.map((conversa) => {
                const status = getConversationStatus(conversa);
                const StatusIcon = status.icon;
                return (
                  <div
                    key={conversa.id}
                    onClick={() => setSelectedConversa(conversa)}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`h-2 w-2 rounded-full ${
                            status.color === 'green' ? 'bg-green-500' :
                            status.color === 'yellow' ? 'bg-yellow-500' :
                            status.color === 'red' ? 'bg-red-500' :
                            status.color === 'blue' ? 'bg-blue-500' :
                            'bg-muted-foreground'
                          }`} />
                          <p className="font-medium truncate">{conversa.profile?.full_name || "Desconhecido"}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-2">{conversa.profile?.email}</p>
                        <Badge variant="outline" className={`text-xs mb-2 ${getStatusColorClasses(status.color)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          "{getLastMessage(conversa.mensagens)}"
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{conversa.updated_at && formatDistanceToNow(new Date(conversa.updated_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}</span>
                          <span>•</span>
                          <span>{getMessageCount(conversa.mensagens)} msgs</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })}
              {filteredConversas.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma conversa encontrada
                </div>
              )}
            </div>

            {/* Desktop: Table Layout */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Última Mensagem</TableHead>
                    <TableHead>Msgs</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversas.map((conversa) => {
                    const status = getConversationStatus(conversa);
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={conversa.id}>
                        <TableCell>
                          <Badge variant="outline" className={`${getStatusColorClasses(status.color)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{conversa.profile?.full_name || "Desconhecido"}</p>
                            <p className="text-sm text-muted-foreground">{conversa.profile?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{conversa.tipo || "suporte"}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {getLastMessage(conversa.mensagens)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getMessageCount(conversa.mensagens)}</Badge>
                        </TableCell>
                        <TableCell>
                          {conversa.updated_at && formatDistanceToNow(new Date(conversa.updated_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedConversa(conversa)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Chat
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredConversas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma conversa encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Chat View Dialog */}
        <Dialog open={!!selectedConversa} onOpenChange={(open) => !open && setSelectedConversa(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] md:max-h-[80vh] p-4 md:p-6">
            <DialogHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <DialogTitle className="text-lg">
                    Chat com {selectedConversa?.profile?.full_name || "Cliente"}
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    {selectedConversa?.profile?.email} • {selectedConversa?.tipo || "suporte"}
                  </DialogDescription>
                </div>
                {selectedConversa && getMessageCount(selectedConversa.mensagens) > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setConfirmClearSingle(true)}
                    className="text-destructive hover:text-destructive flex-shrink-0"
                  >
                    <Eraser className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Limpar</span>
                  </Button>
                )}
              </div>
            </DialogHeader>

            {/* Status Badge */}
            {selectedConversa && (
              <div className="flex items-center gap-2 py-2 border-b">
                {(() => {
                  const status = getConversationStatus(selectedConversa);
                  const StatusIcon = status.icon;
                  return (
                    <Badge variant="outline" className={`${getStatusColorClasses(status.color)}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  );
                })()}
              </div>
            )}
            
            <ScrollArea className="h-[300px] md:h-[400px] pr-4">
              <div className="space-y-4">
                {Array.isArray(selectedConversa?.mensagens) && selectedConversa.mensagens.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`group flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`relative max-w-[85%] md:max-w-[80%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : msg.role === "admin"
                          ? "bg-blue-500 text-white"
                          : "bg-muted"
                      }`}
                    >
                      {/* Menu de ações (apenas para mensagens da IA ou admin) */}
                      {(msg.role === "assistant" || msg.role === "admin") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -right-2 -top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingMessage({ index: idx, content: msg.content })}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingMessageIndex(idx)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {msg.role === "user" ? "Cliente" : msg.role === "admin" ? `Admin${msg.admin_name ? ` (${msg.admin_name})` : ''}` : "IA"}
                        </Badge>
                        {msg.timestamp && (
                          <span className="text-xs opacity-70">
                            {format(new Date(msg.timestamp), "HH:mm")}
                          </span>
                        )}
                        {(msg as any).editedAt && (
                          <span className="text-xs opacity-50">(editado)</span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {(!selectedConversa?.mensagens || !Array.isArray(selectedConversa.mensagens) || selectedConversa.mensagens.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma mensagem nesta conversa
                  </p>
                )}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 mt-2">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Responder como admin..."
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  className="flex-1 min-h-[60px]"
                  rows={2}
                />
                <Button 
                  onClick={handleAdminIntervention}
                  disabled={!adminMessage.trim() || sending}
                  className="self-end"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Suas mensagens aparecerão como "Admin (Gabriel Baú)" para o cliente
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Message Dialog */}
        <Dialog open={editingMessage !== null} onOpenChange={(open) => !open && setEditingMessage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Mensagem</DialogTitle>
              <DialogDescription>
                Edite o conteúdo da mensagem abaixo
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={editingMessage?.content || ""}
              onChange={(e) => setEditingMessage(prev => prev ? { ...prev, content: e.target.value } : null)}
              rows={5}
              className="resize-none"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMessage(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEditMessage} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Message Confirmation */}
        <AlertDialog open={deletingMessageIndex !== null} onOpenChange={(open) => !open && setDeletingMessageIndex(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir mensagem?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A mensagem será removida permanentemente do histórico.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear All Conversations Confirmation */}
        <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar todas as conversas?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todas as {conversas.length} conversas de suporte serão excluídas permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={clearingAll}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleClearAllConversations} 
                disabled={clearingAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {clearingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Excluir Todas
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear Single Conversation Confirmation */}
        <AlertDialog open={confirmClearSingle} onOpenChange={setConfirmClearSingle}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar esta conversa?</AlertDialogTitle>
              <AlertDialogDescription>
                Todas as mensagens desta conversa com {selectedConversa?.profile?.full_name || "o cliente"} serão removidas. O histórico ficará vazio, mas a conversa continuará existindo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={clearingSingle}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleClearSingleConversation} 
                disabled={clearingSingle}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {clearingSingle ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Limpar Mensagens
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ClientLayout>
  );
}
