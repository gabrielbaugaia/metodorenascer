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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Dumbbell, 
  Apple, 
  Edit,
  Loader2,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProtocolEditor } from "@/components/admin/ProtocolEditor";
import { NutritionProtocolEditor } from "@/components/admin/NutritionProtocolEditor";
import { MindsetProtocolEditor } from "@/components/admin/MindsetProtocolEditor";
import { ClientAnamneseCard } from "@/components/admin/ClientAnamneseCard";

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
  telefone?: string;
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

interface Protocol {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  conteudo: any;
  data_geracao: string;
  ativo: boolean;
  profile?: Profile;
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
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; protocol: Protocol | null }>({
    open: false,
    protocol: null,
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
            .select("full_name, email, weight, height, age, sexo, goals, injuries, availability, nivel_experiencia, restricoes_medicas, objetivos_detalhados, medidas, telefone, whatsapp, objetivo_principal, ja_treinou_antes, local_treino, dias_disponiveis, nivel_condicionamento, pratica_aerobica, escada_sem_cansar, condicoes_saude, toma_medicamentos, refeicoes_por_dia, bebe_agua_frequente, restricoes_alimentares, qualidade_sono, nivel_estresse, consome_alcool, fuma, foto_frente_url, foto_lado_url, foto_costas_url, observacoes_adicionais")
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

  const handleSaveProtocol = async (content: any) => {
    if (!editDialog.protocol) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("protocolos")
        .update({ conteudo: content })
        .eq("id", editDialog.protocol.id);

      if (error) throw error;
      
      // Update local state
      setProtocols(protocols.map(p => 
        p.id === editDialog.protocol?.id 
          ? { ...p, conteudo: content }
          : p
      ));
      
      // Update dialog protocol
      setEditDialog({
        ...editDialog,
        protocol: { ...editDialog.protocol, conteudo: content }
      });
    } catch (error) {
      console.error("Error saving protocol:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async (adjustments: string) => {
    if (!editDialog.protocol) return;
    
    setRegenerating(true);
    try {
      // Fetch user profile for context
      const { data: profile } = await supabase
        .from("profiles")
        .select("weight, height, goals, injuries, availability, nivel_experiencia, restricoes_medicas")
        .eq("id", editDialog.protocol.user_id)
        .single();

      const { data, error } = await supabase.functions.invoke("generate-protocol", {
        body: {
          tipo: editDialog.protocol.tipo,
          userId: editDialog.protocol.user_id,
          adjustments,
          userContext: profile,
        },
      });

      if (error) throw error;

      // Deactivate old protocol
      await supabase
        .from("protocolos")
        .update({ ativo: false })
        .eq("id", editDialog.protocol.id);

      toast.success("Novo protocolo gerado com sucesso!");
      setEditDialog({ open: false, protocol: null });
      fetchProtocols();
    } catch (error: any) {
      console.error("Error regenerating protocol:", error);
      toast.error(error.message || "Erro ao regenerar protocolo");
    } finally {
      setRegenerating(false);
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
  const mindsetProtocols = filteredProtocols.filter((p) => p.tipo === "mindset");

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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditDialog({ open: true, protocol })}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
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
              <TabsList className="grid w-full grid-cols-3 max-w-lg">
                <TabsTrigger value="treino" className="gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Treinos ({treinoProtocols.length})
                </TabsTrigger>
                <TabsTrigger value="nutricao" className="gap-2">
                  <Apple className="h-4 w-4" />
                  Nutrição ({nutricaoProtocols.length})
                </TabsTrigger>
                <TabsTrigger value="mindset" className="gap-2">
                  <Brain className="h-4 w-4" />
                  Mindset ({mindsetProtocols.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="treino">
                <ProtocolTable protocols={treinoProtocols} tipo="treino" />
              </TabsContent>

              <TabsContent value="nutricao">
                <ProtocolTable protocols={nutricaoProtocols} tipo="nutricao" />
              </TabsContent>

              <TabsContent value="mindset">
                <ProtocolTable protocols={mindsetProtocols} tipo="mindset" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Edit Protocol Dialog */}
        <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editDialog.protocol?.tipo === "treino" ? (
                  <Dumbbell className="h-5 w-5 text-primary" />
                ) : editDialog.protocol?.tipo === "nutricao" ? (
                  <Apple className="h-5 w-5 text-primary" />
                ) : (
                  <Brain className="h-5 w-5 text-primary" />
                )}
                Editar Protocolo
              </DialogTitle>
              <DialogDescription>
                Cliente: {editDialog.protocol?.profile?.full_name} | 
                Gerado em: {editDialog.protocol && format(new Date(editDialog.protocol.data_geracao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </DialogDescription>
            </DialogHeader>
            
            {/* Client Anamnese */}
            {editDialog.protocol?.profile && (
              <ClientAnamneseCard profile={editDialog.protocol.profile} />
            )}

            {/* Protocol Editor */}
            {editDialog.protocol && editDialog.protocol.tipo === "treino" && (
              <ProtocolEditor
                protocol={editDialog.protocol}
                onSave={handleSaveProtocol}
                onRegenerate={handleRegenerate}
                saving={saving}
                regenerating={regenerating}
              />
            )}
            
            {editDialog.protocol && editDialog.protocol.tipo === "nutricao" && (
              <NutritionProtocolEditor
                protocol={editDialog.protocol}
                onSave={handleSaveProtocol}
                onRegenerate={handleRegenerate}
                saving={saving}
                regenerating={regenerating}
              />
            )}

            {editDialog.protocol && editDialog.protocol.tipo === "mindset" && (
              <MindsetProtocolEditor
                protocol={editDialog.protocol}
                onSave={handleSaveProtocol}
                onRegenerate={handleRegenerate}
                saving={saving}
                regenerating={regenerating}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ClientLayout>
  );
}
