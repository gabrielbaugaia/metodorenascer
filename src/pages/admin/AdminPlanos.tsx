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
  Dumbbell,
  Trash2,
  Sparkles,
  Apple, 
  Edit,
  Loader2,
  Brain,
  ArrowLeft,
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
  currentWeight?: number | null;
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
  const [generatingProtocol, setGeneratingProtocol] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; protocolId: string | null }>({
    open: false,
    protocolId: null,
  });
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

      // Fetch profile info and latest check-in weight for each protocol
      const protocolsWithProfiles = await Promise.all(
        (data || []).map(async (protocol) => {
          const [profileResult, checkinResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("full_name, email, weight, height, age, sexo, goals, injuries, availability, nivel_experiencia, restricoes_medicas, objetivos_detalhados, medidas, telefone, whatsapp, objetivo_principal, ja_treinou_antes, local_treino, dias_disponiveis, nivel_condicionamento, pratica_aerobica, escada_sem_cansar, condicoes_saude, toma_medicamentos, refeicoes_por_dia, bebe_agua_frequente, restricoes_alimentares, qualidade_sono, nivel_estresse, consome_alcool, fuma, foto_frente_url, foto_lado_url, foto_costas_url, observacoes_adicionais")
              .eq("id", protocol.user_id)
              .single(),
            supabase
              .from("checkins")
              .select("peso_atual")
              .eq("user_id", protocol.user_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          ]);

          return { 
            ...protocol, 
            profile: profileResult.data,
            currentWeight: checkinResult.data?.peso_atual || null
          };
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

  const handleDeleteProtocol = async () => {
    if (!deleteDialog.protocolId) return;
    
    try {
      const { error } = await supabase
        .from("protocolos")
        .delete()
        .eq("id", deleteDialog.protocolId);

      if (error) throw error;
      
      toast.success("Protocolo excluído com sucesso!");
      setDeleteDialog({ open: false, protocolId: null });
      fetchProtocols();
    } catch (error) {
      console.error("Error deleting protocol:", error);
      toast.error("Erro ao excluir protocolo");
    }
  };

  const handleGenerateProtocol = async (targetUserId: string, tipo: "treino" | "nutricao" | "mindset") => {
    if (!targetUserId) return;
    
    setGeneratingProtocol(tipo);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_type")
        .eq("user_id", targetUserId)
        .eq("status", "active")
        .maybeSingle();

      const { data, error } = await supabase.functions.invoke("generate-protocol", {
        body: {
          tipo,
          userId: targetUserId,
          userContext: profile,
          planType: subscription?.plan_type || "mensal",
        },
      });

      if (error) throw error;
      
      const tipoLabel = tipo === "treino" ? "treino" : tipo === "nutricao" ? "nutrição" : "mindset";
      toast.success(`Protocolo de ${tipoLabel} gerado com sucesso!`);
      fetchProtocols();
    } catch (error: any) {
      console.error(`Error generating ${tipo}:`, error);
      toast.error(error.message || `Erro ao gerar protocolo de ${tipo}`);
    } finally {
      setGeneratingProtocol(null);
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

  // Mobile-friendly Protocol Card
  const ProtocolCard = ({ protocol }: { protocol: Protocol }) => (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50 gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm truncate">{protocol.profile?.full_name || "—"}</p>
        <p className="text-xs text-muted-foreground truncate">{protocol.titulo}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={protocol.ativo ? "default" : "secondary"} className="text-[10px]">
            {protocol.ativo ? "Ativo" : "Inativo"}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(protocol.data_geracao), "dd/MM", { locale: ptBR })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setEditDialog({ open: true, protocol })}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteDialog({ open: true, protocolId: protocol.id })}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const ProtocolTable = ({ protocols, tipo }: { protocols: Protocol[]; tipo: string }) => (
    <>
      {/* Mobile: Card layout */}
      <div className="sm:hidden space-y-2">
        {protocols.map((protocol) => (
          <ProtocolCard key={protocol.id} protocol={protocol} />
        ))}
        {protocols.length === 0 && (
          <p className="text-center py-8 text-muted-foreground text-sm">
            Nenhum protocolo encontrado
          </p>
        )}
      </div>
      
      {/* Desktop: Table layout */}
      <div className="hidden sm:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Data Geração</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {protocols.map((protocol) => (
              <TableRow key={protocol.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="font-medium truncate max-w-[150px]">{protocol.profile?.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{protocol.profile?.email || "—"}</p>
                  </div>
                </TableCell>
                <TableCell className="max-w-[150px] truncate">{protocol.titulo}</TableCell>
                <TableCell>
                  <Badge variant={protocol.ativo ? "default" : "secondary"}>
                    {protocol.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {format(new Date(protocol.data_geracao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditDialog({ open: true, protocol })}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      <span className="hidden lg:inline">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteDialog({ open: true, protocolId: protocol.id })}
                    >
                      <Trash2 className="h-4 w-4" />
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
    </>
  );

  return (
    <ClientLayout>
      <div className="space-y-6 max-w-full overflow-hidden">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-display font-bold truncate">Gerenciar Protocolos</h1>
              <p className="text-muted-foreground text-sm truncate">
                {userId ? "Protocolos do cliente selecionado" : "Todos os protocolos gerados"}
              </p>
            </div>
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
                {userId && (
                  <div className="mb-4">
                    <Button 
                      variant="fire" 
                      onClick={() => handleGenerateProtocol(userId, "treino")}
                      disabled={generatingProtocol !== null}
                    >
                      {generatingProtocol === "treino" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      {treinoProtocols.length > 0 ? "Gerar Novo Protocolo de Treino" : "Gerar Protocolo de Treino"}
                    </Button>
                  </div>
                )}
                <ProtocolTable protocols={treinoProtocols} tipo="treino" />
              </TabsContent>

              <TabsContent value="nutricao">
                {userId && (
                  <div className="mb-4">
                    <Button 
                      variant="fire" 
                      onClick={() => handleGenerateProtocol(userId, "nutricao")}
                      disabled={generatingProtocol !== null}
                    >
                      {generatingProtocol === "nutricao" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      {nutricaoProtocols.length > 0 ? "Gerar Novo Protocolo de Nutrição" : "Gerar Protocolo de Nutrição"}
                    </Button>
                  </div>
                )}
                <ProtocolTable protocols={nutricaoProtocols} tipo="nutricao" />
              </TabsContent>

              <TabsContent value="mindset">
                {userId && (
                  <div className="mb-4">
                    <Button 
                      variant="fire" 
                      onClick={() => handleGenerateProtocol(userId, "mindset")}
                      disabled={generatingProtocol !== null}
                    >
                      {generatingProtocol === "mindset" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      {mindsetProtocols.length > 0 ? "Gerar Novo Protocolo de Mindset" : "Gerar Protocolo de Mindset"}
                    </Button>
                  </div>
                )}
                <ProtocolTable protocols={mindsetProtocols} tipo="mindset" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Delete Protocol Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Protocolo</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este protocolo? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProtocol} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
              <ClientAnamneseCard 
                profile={editDialog.protocol.profile} 
                currentWeight={editDialog.protocol.currentWeight}
              />
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
