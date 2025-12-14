import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal, 
  UserPlus, 
  Eye, 
  Pause, 
  Ban, 
  Play,
  FileText,
  Loader2,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  client_status: string | null;
  weight: number | null;
  goals: string | null;
  age: number | null;
  subscription?: {
    status: string;
    plan_type: string;
    current_period_end: string;
  } | null;
}

export default function AdminClientes() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: string;
    clientId: string;
    clientName: string;
  }>({ open: false, action: "", clientId: "", clientName: "" });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!adminLoading && !isAdmin) {
      navigate("/area-cliente");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    fetchClients();
  }, [isAdmin]);

  const fetchClients = async () => {
    if (!isAdmin) return;

    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch subscriptions for each client
      const clientsWithSubs = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("status, plan_type, current_period_end")
            .eq("user_id", profile.id)
            .eq("status", "active")
            .single();

          return { ...profile, subscription: sub };
        })
      );

      setClients(clientsWithSubs);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (clientId: string, newStatus: "active" | "paused" | "blocked" | "canceled") => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ client_status: newStatus })
        .eq("id", clientId);

      if (error) throw error;

      toast.success(`Status atualizado para ${newStatus}`);
      fetchClients();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
    setConfirmDialog({ open: false, action: "", clientId: "", clientName: "" });
  };

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default" as const, label: "Ativo" },
      paused: { variant: "secondary" as const, label: "Pausado" },
      blocked: { variant: "destructive" as const, label: "Bloqueado" },
      canceled: { variant: "outline", label: "Cancelado" },
    };
    const config = statusMap[status || "active"] || statusMap.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredClients = clients.filter(
    (client) =>
      client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ["Nome", "Email", "Status", "Plano", "Data Cadastro"];
    const rows = filteredClients.map((c) => [
      c.full_name,
      c.email,
      c.client_status || "active",
      c.subscription?.plan_type || "Sem plano",
      format(new Date(c.created_at), "dd/MM/yyyy"),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes.csv";
    a.click();
    toast.success("CSV exportado com sucesso!");
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
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold uppercase">Clientes</h1>
            <p className="text-muted-foreground">Gerencie todos os clientes do Método Renascer</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="fire" onClick={() => navigate("/admin/criar-cliente")}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>

        <Card variant="glass">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Lista de Clientes</CardTitle>
                <CardDescription>{filteredClients.length} clientes encontrados</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
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
                    <TableHead>Status</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.full_name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(client.client_status)}</TableCell>
                      <TableCell>
                        {client.subscription ? (
                          <Badge variant="outline">{client.subscription.plan_type}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem plano</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/clientes/${client.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/planos?userId=${client.id}`)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Ver Protocolos
                            </DropdownMenuItem>
                            {client.client_status !== "paused" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    action: "paused",
                                    clientId: client.id,
                                    clientName: client.full_name,
                                  })
                                }
                              >
                                <Pause className="h-4 w-4 mr-2" />
                                Pausar
                              </DropdownMenuItem>
                            )}
                            {client.client_status === "paused" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    action: "active",
                                    clientId: client.id,
                                    clientName: client.full_name,
                                  })
                                }
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Reativar
                              </DropdownMenuItem>
                            )}
                            {client.client_status !== "blocked" && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    action: "blocked",
                                    clientId: client.id,
                                    clientName: client.full_name,
                                  })
                                }
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Bloquear
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredClients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Ação</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja{" "}
                {confirmDialog.action === "paused"
                  ? "pausar"
                  : confirmDialog.action === "blocked"
                  ? "bloquear"
                  : "reativar"}{" "}
                o cliente <strong>{confirmDialog.clientName}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
                Cancelar
              </Button>
              <Button
                variant={confirmDialog.action === "blocked" ? "destructive" : "default"}
                onClick={() => handleStatusChange(confirmDialog.clientId, confirmDialog.action as "active" | "paused" | "blocked" | "canceled")}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ClientLayout>
  );
}
