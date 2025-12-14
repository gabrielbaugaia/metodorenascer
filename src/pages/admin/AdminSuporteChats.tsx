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
  Search, 
  MessageCircle, 
  Eye, 
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Mensagem {
  role: string;
  content: string;
  timestamp?: string;
}

interface Conversa {
  id: string;
  user_id: string;
  tipo: string | null;
  mensagens: Mensagem[];
  created_at: string | null;
  updated_at: string | null;
  profile?: {
    full_name: string;
    email: string | null;
  } | null;
}

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
          timestamp: new Date().toISOString()
        }
      ];

      const { error } = await supabase
        .from("conversas")
        .update({ 
          mensagens: updatedMensagens as unknown as Json,
          updated_at: new Date().toISOString()
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
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Suporte - Chats</h1>
            <p className="text-muted-foreground">Monitore e intervenha nas conversas com IA</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {conversas.length} conversas
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversas Ativas</p>
                  <p className="text-2xl font-bold">{conversas.filter(c => getMessageCount(c.mensagens) > 0).length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aguardando Resposta</p>
                  <p className="text-2xl font-bold">
                    {conversas.filter(c => {
                      const msgs = c.mensagens;
                      if (!Array.isArray(msgs) || msgs.length === 0) return false;
                      return msgs[msgs.length - 1]?.role === 'user';
                    }).length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Intervenções Admin</p>
                  <p className="text-2xl font-bold">
                    {conversas.filter(c => {
                      const msgs = c.mensagens;
                      if (!Array.isArray(msgs)) return false;
                      return msgs.some(m => m.role === 'admin');
                    }).length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card variant="glass">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Conversas dos Clientes</CardTitle>
                <CardDescription>Visualize e intervenha nos chats quando necessário</CardDescription>
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
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Última Mensagem</TableHead>
                    <TableHead>Mensagens</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversas.map((conversa) => (
                    <TableRow key={conversa.id}>
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
                        {formatDistanceToNow(new Date(conversa.updated_at), { 
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
                  ))}
                  {filteredConversas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Chat com {selectedConversa?.profile?.full_name || "Cliente"}
              </DialogTitle>
              <DialogDescription>
                {selectedConversa?.profile?.email} • {selectedConversa?.tipo || "suporte"}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {Array.isArray(selectedConversa?.mensagens) && selectedConversa.mensagens.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : msg.role === "admin"
                          ? "bg-blue-500 text-white"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {msg.role === "user" ? "Cliente" : msg.role === "admin" ? "Admin" : "IA"}
                        </Badge>
                        {msg.timestamp && (
                          <span className="text-xs opacity-70">
                            {format(new Date(msg.timestamp), "HH:mm")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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

            <div className="border-t pt-4 mt-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Intervenção do admin..."
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  className="flex-1"
                  rows={2}
                />
                <Button 
                  onClick={handleAdminIntervention}
                  disabled={!adminMessage.trim() || sending}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Suas mensagens aparecerão como "Admin" para o cliente
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ClientLayout>
  );
}
