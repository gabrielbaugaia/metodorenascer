import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Dumbbell, 
  Apple, 
  Eye, 
  RefreshCw,
  Loader2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Protocol {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  conteudo: any;
  data_geracao: string;
  ativo: boolean;
  profile?: {
    full_name: string;
    email: string;
  };
}

export default function AdminPlanos() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [viewDialog, setViewDialog] = useState<{ open: boolean; protocol: Protocol | null }>({
    open: false,
    protocol: null,
  });
  const [regenerateDialog, setRegenerateDialog] = useState<{
    open: boolean;
    protocolId: string;
    userId: string;
    tipo: string;
    adjustments: string;
  }>({
    open: false,
    protocolId: "",
    userId: "",
    tipo: "",
    adjustments: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!adminLoading && !isAdmin) {
      navigate("/area-cliente");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    fetchProtocols();
  }, [isAdmin, userId]);

  const fetchProtocols = async () => {
    if (!isAdmin) return;

    try {
      let query = supabase
        .from("protocolos")
        .select("*")
        .order("data_geracao", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profile info for each protocol
      const protocolsWithProfiles = await Promise.all(
        (data || []).map(async (protocol) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", protocol.user_id)
            .single();

          return { ...protocol, profile };
        })
      );

      setProtocols(protocolsWithProfiles);
    } catch (error) {
      console.error("Error fetching protocols:", error);
      toast.error("Erro ao carregar protocolos");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(regenerateDialog.protocolId);
    try {
      // Fetch user profile for context
      const { data: profile } = await supabase
        .from("profiles")
        .select("weight, height, goals, injuries, availability, nivel_experiencia, restricoes_medicas")
        .eq("id", regenerateDialog.userId)
        .single();

      const { data, error } = await supabase.functions.invoke("generate-protocol", {
        body: {
          tipo: regenerateDialog.tipo,
          userId: regenerateDialog.userId,
          adjustments: regenerateDialog.adjustments,
          userContext: profile,
        },
      });

      if (error) throw error;

      // Deactivate old protocol
      await supabase
        .from("protocolos")
        .update({ ativo: false })
        .eq("id", regenerateDialog.protocolId);

      toast.success("Protocolo regenerado com sucesso!");
      fetchProtocols();
    } catch (error: any) {
      console.error("Error regenerating protocol:", error);
      toast.error(error.message || "Erro ao regenerar protocolo");
    } finally {
      setRegenerating(null);
      setRegenerateDialog({ open: false, protocolId: "", userId: "", tipo: "", adjustments: "" });
    }
  };

  const filteredProtocols = protocols.filter(
    (p) =>
      p.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const treinoProtocols = filteredProtocols.filter((p) => p.tipo === "treino");
  const nutricaoProtocols = filteredProtocols.filter((p) => p.tipo === "nutricao");

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

  const ProtocolTable = ({ protocols, tipo }: { protocols: Protocol[]; tipo: string }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Geração</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {protocols.map((protocol) => (
            <TableRow key={protocol.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{protocol.profile?.full_name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{protocol.profile?.email || "—"}</p>
                </div>
              </TableCell>
              <TableCell>{protocol.titulo}</TableCell>
              <TableCell>
                <Badge variant={protocol.ativo ? "default" : "secondary"}>
                  {protocol.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(protocol.data_geracao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewDialog({ open: true, protocol })}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setRegenerateDialog({
                        open: true,
                        protocolId: protocol.id,
                        userId: protocol.user_id,
                        tipo: protocol.tipo,
                        adjustments: "",
                      })
                    }
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {protocols.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Nenhum protocolo encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <ClientLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Gerenciar Protocolos</h1>
            <p className="text-muted-foreground">
              {userId ? "Protocolos do cliente selecionado" : "Todos os protocolos gerados"}
            </p>
          </div>
        </div>

        <Card variant="glass">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Protocolos</CardTitle>
                <CardDescription>{filteredProtocols.length} protocolos encontrados</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="treino" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="treino" className="gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Treinos ({treinoProtocols.length})
                </TabsTrigger>
                <TabsTrigger value="nutricao" className="gap-2">
                  <Apple className="h-4 w-4" />
                  Nutrição ({nutricaoProtocols.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="treino">
                <ProtocolTable protocols={treinoProtocols} tipo="treino" />
              </TabsContent>

              <TabsContent value="nutricao">
                <ProtocolTable protocols={nutricaoProtocols} tipo="nutricao" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* View Protocol Dialog */}
        <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ ...viewDialog, open })}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewDialog.protocol?.titulo}</DialogTitle>
              <DialogDescription>
                Cliente: {viewDialog.protocol?.profile?.full_name} | 
                Gerado em: {viewDialog.protocol && format(new Date(viewDialog.protocol.data_geracao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted/50 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(viewDialog.protocol?.conteudo, null, 2)}
              </pre>
            </div>
          </DialogContent>
        </Dialog>

        {/* Regenerate Protocol Dialog */}
        <Dialog
          open={regenerateDialog.open}
          onOpenChange={(open) => setRegenerateDialog({ ...regenerateDialog, open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Regenerar Protocolo</DialogTitle>
              <DialogDescription>
                Adicione ajustes ou instruções para a IA gerar um novo protocolo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ajustes/Instruções (opcional)</Label>
                <Textarea
                  placeholder="Ex: Adicionar mais exercícios de cardio, focar em hipertrofia..."
                  value={regenerateDialog.adjustments}
                  onChange={(e) =>
                    setRegenerateDialog({ ...regenerateDialog, adjustments: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRegenerateDialog({ ...regenerateDialog, open: false })}
              >
                Cancelar
              </Button>
              <Button
                variant="fire"
                onClick={handleRegenerate}
                disabled={regenerating !== null}
              >
                {regenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Regenerar com IA
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ClientLayout>
  );
}
