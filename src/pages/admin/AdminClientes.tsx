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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  Download,
  Filter,
  X,
  CalendarIcon,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PLAN_TYPES, PLAN_NAMES } from "@/lib/planConstants";

interface Client {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  client_status: string | null;
  weight: number | null;
  goals: string | null;
  age: number | null;
  sexo: string | null;
  objetivo_principal: string | null;
  lastAccess: string | null;
  protocolCount: {
    treino: number;
    nutricao: number;
    mindset: number;
  };
  subscription?: {
    status: string;
    plan_type: string;
    current_period_end: string;
    created_at: string;
  } | null;
}

interface Filters {
  planType: string;
  startDateFrom: Date | null;
  startDateTo: Date | null;
  endDateFrom: Date | null;
  endDateTo: Date | null;
  sex: string;
  goal: string;
  engagement: string;
}

const initialFilters: Filters = {
  planType: "all",
  startDateFrom: null,
  startDateTo: null,
  endDateFrom: null,
  endDateTo: null,
  sex: "all",
  goal: "all",
  engagement: "all"
};

function getInactivityLabel(lastAccess: string | null): string | null {
  if (!lastAccess) return null;
  const days = differenceInDays(new Date(), new Date(lastAccess));
  if (days >= 30) return `Inativo ${days}d`;
  if (days >= 14) return `Inativo ${days}d`;
  if (days >= 7) return `Inativo ${days}d`;
  return null;
}

function isFreeExpired30d(subscription: Client["subscription"]): boolean {
  if (!subscription) return false;
  const isFree = subscription.plan_type === PLAN_TYPES.GRATUITO || subscription.status === "free";
  if (!isFree) return false;
  const days = differenceInDays(new Date(), new Date(subscription.created_at));
  return days >= 30;
}

export default function AdminClientes() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
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
      // Parallel fetches: profiles, user_activity, protocolos
      const [profilesRes, activityRes, protocolosRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*, sexo, objetivo_principal")
          .order("created_at", { ascending: false }),
        supabase
          .from("user_activity")
          .select("user_id, last_access"),
        supabase
          .from("protocolos")
          .select("user_id, tipo")
      ]);

      if (profilesRes.error) throw profilesRes.error;

      // Build lookup maps
      const activityMap = new Map<string, string | null>();
      (activityRes.data || []).forEach((a) => {
        activityMap.set(a.user_id, a.last_access);
      });

      const protocolMap = new Map<string, { treino: number; nutricao: number; mindset: number }>();
      (protocolosRes.data || []).forEach((p) => {
        const existing = protocolMap.get(p.user_id) || { treino: 0, nutricao: 0, mindset: 0 };
        if (p.tipo === "treino") existing.treino++;
        else if (p.tipo === "nutricao") existing.nutricao++;
        else if (p.tipo === "mindset") existing.mindset++;
        protocolMap.set(p.user_id, existing);
      });

      // Fetch subscriptions for each client (including pending_payment)
      const clientsWithSubs = await Promise.all(
        (profilesRes.data || []).map(async (profile) => {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("status, plan_type, current_period_end, created_at")
            .eq("user_id", profile.id)
            .in("status", ["active", "pending_payment", "free"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...profile,
            subscription: sub,
            lastAccess: activityMap.get(profile.id) ?? null,
            protocolCount: protocolMap.get(profile.id) || { treino: 0, nutricao: 0, mindset: 0 },
          };
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

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const hasActiveFilters = () => {
    return filters.planType !== "all" ||
      filters.startDateFrom !== null ||
      filters.startDateTo !== null ||
      filters.endDateFrom !== null ||
      filters.endDateTo !== null ||
      filters.sex !== "all" ||
      filters.goal !== "all" ||
      filters.engagement !== "all";
  };

  const filteredClients = clients.filter((client) => {
    // Busca por nome/email
    const matchesSearch = client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por plano
    const matchesPlan = filters.planType === "all" || 
      client.subscription?.plan_type === filters.planType;
    
    // Filtro por data de entrada
    const createdAt = new Date(client.created_at);
    const matchesStartDate = (!filters.startDateFrom || createdAt >= filters.startDateFrom) &&
      (!filters.startDateTo || createdAt <= filters.startDateTo);
    
    // Filtro por data de término
    const endDate = client.subscription?.current_period_end 
      ? new Date(client.subscription.current_period_end) 
      : null;
    const matchesEndDate = (!filters.endDateFrom || (endDate && endDate >= filters.endDateFrom)) &&
      (!filters.endDateTo || (endDate && endDate <= filters.endDateTo));
    
    // Filtro por sexo
    const matchesSex = filters.sex === "all" || 
      (client.sexo?.toLowerCase() === filters.sex.toLowerCase());
    
    // Filtro por objetivo
    const matchesGoal = filters.goal === "all" || 
      (client.objetivo_principal?.toLowerCase().includes(filters.goal.toLowerCase()));

    // Filtro por engajamento
    let matchesEngagement = true;
    if (filters.engagement !== "all") {
      const now = new Date();
      switch (filters.engagement) {
        case "never_accessed":
          matchesEngagement = client.lastAccess === null;
          break;
        case "no_protocols":
          matchesEngagement = client.protocolCount.treino === 0 && 
            client.protocolCount.nutricao === 0 && 
            client.protocolCount.mindset === 0;
          break;
        case "inactive_7d":
          matchesEngagement = client.lastAccess !== null && 
            differenceInDays(now, new Date(client.lastAccess)) >= 7;
          break;
        case "inactive_14d":
          matchesEngagement = client.lastAccess !== null && 
            differenceInDays(now, new Date(client.lastAccess)) >= 14;
          break;
        case "inactive_30d":
          matchesEngagement = client.lastAccess !== null && 
            differenceInDays(now, new Date(client.lastAccess)) >= 30;
          break;
        case "free_expired_30d":
          matchesEngagement = isFreeExpired30d(client.subscription);
          break;
      }
    }
    
    return matchesSearch && matchesPlan && matchesStartDate && matchesEndDate && matchesSex && matchesGoal && matchesEngagement;
  });

  const exportCSV = () => {
    const headers = ["Nome", "Email", "Status", "Plano", "Sexo", "Objetivo", "Último Acesso", "Data Cadastro"];
    const rows = filteredClients.map((c) => [
      c.full_name,
      c.email,
      c.client_status || "active",
      c.subscription?.plan_type || "Sem plano",
      c.sexo || "N/A",
      c.objetivo_principal || "N/A",
      c.lastAccess ? format(new Date(c.lastAccess), "dd/MM/yyyy") : "Nunca",
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

  const renderEngagementBadges = (client: Client) => {
    const badges: React.ReactNode[] = [];
    
    if (client.lastAccess === null) {
      badges.push(
        <Badge key="never" variant="destructive" className="text-[10px]">
          Nunca acessou
        </Badge>
      );
    } else {
      const inactLabel = getInactivityLabel(client.lastAccess);
      if (inactLabel) {
        badges.push(
          <Badge key="inact" variant="secondary" className="text-[10px]">
            {inactLabel}
          </Badge>
        );
      }
    }
    
    const totalProtocols = client.protocolCount.treino + client.protocolCount.nutricao + client.protocolCount.mindset;
    if (totalProtocols === 0) {
      badges.push(
        <Badge key="noproto" variant="outline" className="text-[10px] border-amber-500/50 text-amber-600">
          Sem protocolos
        </Badge>
      );
    }
    
    if (isFreeExpired30d(client.subscription)) {
      badges.push(
        <Badge key="freeexp" variant="destructive" className="text-[10px]">
          Gratuito expirado
        </Badge>
      );
    }
    
    return badges;
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
      <div className="space-y-6 max-w-full overflow-hidden">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold uppercase">Clientes</h1>
            <p className="text-muted-foreground text-sm">Gerencie todos os clientes do Método Renascer</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              <span className="text-xs sm:text-sm">Exportar CSV</span>
            </Button>
            <Button variant="fire" size="sm" onClick={() => navigate("/admin/criar-cliente")} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="text-xs sm:text-sm">Novo Cliente</span>
            </Button>
          </div>
        </div>

        <Card variant="glass">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Lista de Clientes</CardTitle>
                  <CardDescription>{filteredClients.length} clientes encontrados</CardDescription>
                </div>
                <Button 
                  variant={hasActiveFilters() ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full sm:w-auto"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      !
                    </Badge>
                  )}
                  <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", showFilters && "rotate-180")} />
                </Button>
              </div>
              
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtros Avançados */}
              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleContent>
                  <div className="border border-border rounded-lg p-4 space-y-4 bg-card/50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Filtros Avançados</h4>
                      {hasActiveFilters() && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="h-4 w-4 mr-1" />
                          Limpar
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Tipo de Plano */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Tipo de Plano</label>
                        <Select 
                          value={filters.planType} 
                          onValueChange={(value) => setFilters(prev => ({ ...prev, planType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os planos</SelectItem>
                            <SelectItem value={PLAN_TYPES.ELITE_FUNDADOR}>{PLAN_NAMES[PLAN_TYPES.ELITE_FUNDADOR]}</SelectItem>
                            <SelectItem value={PLAN_TYPES.GRATUITO}>{PLAN_NAMES[PLAN_TYPES.GRATUITO]}</SelectItem>
                            <SelectItem value={PLAN_TYPES.MENSAL}>{PLAN_NAMES[PLAN_TYPES.MENSAL]}</SelectItem>
                            <SelectItem value={PLAN_TYPES.TRIMESTRAL}>{PLAN_NAMES[PLAN_TYPES.TRIMESTRAL]}</SelectItem>
                            <SelectItem value={PLAN_TYPES.SEMESTRAL}>{PLAN_NAMES[PLAN_TYPES.SEMESTRAL]}</SelectItem>
                            <SelectItem value={PLAN_TYPES.ANUAL}>{PLAN_NAMES[PLAN_TYPES.ANUAL]}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sexo */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Sexo</label>
                        <Select 
                          value={filters.sex} 
                          onValueChange={(value) => setFilters(prev => ({ ...prev, sex: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Objetivo */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Objetivo</label>
                        <Select 
                          value={filters.goal} 
                          onValueChange={(value) => setFilters(prev => ({ ...prev, goal: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os objetivos</SelectItem>
                            <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                            <SelectItem value="massa">Ganho de Massa</SelectItem>
                            <SelectItem value="definição">Definição Muscular</SelectItem>
                            <SelectItem value="condicionamento">Condicionamento</SelectItem>
                            <SelectItem value="saúde">Saúde e Bem-estar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Engajamento */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Engajamento</label>
                        <Select 
                          value={filters.engagement} 
                          onValueChange={(value) => setFilters(prev => ({ ...prev, engagement: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="never_accessed">Nunca acessou</SelectItem>
                            <SelectItem value="no_protocols">Sem protocolos gerados</SelectItem>
                            <SelectItem value="inactive_7d">Inativo +7 dias</SelectItem>
                            <SelectItem value="inactive_14d">Inativo +14 dias</SelectItem>
                            <SelectItem value="inactive_30d">Inativo +30 dias</SelectItem>
                            <SelectItem value="free_expired_30d">Gratuito expirado (30d+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Data de Entrada - De */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Cadastro - De</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !filters.startDateFrom && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.startDateFrom ? format(filters.startDateFrom, "dd/MM/yyyy") : "Selecionar"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={filters.startDateFrom || undefined}
                              onSelect={(date) => setFilters(prev => ({ ...prev, startDateFrom: date || null }))}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Data de Entrada - Até */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Cadastro - Até</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !filters.startDateTo && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.startDateTo ? format(filters.startDateTo, "dd/MM/yyyy") : "Selecionar"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={filters.startDateTo || undefined}
                              onSelect={(date) => setFilters(prev => ({ ...prev, startDateTo: date || null }))}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Data de Término - De */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Término Plano - De</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !filters.endDateFrom && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.endDateFrom ? format(filters.endDateFrom, "dd/MM/yyyy") : "Selecionar"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={filters.endDateFrom || undefined}
                              onSelect={(date) => setFilters(prev => ({ ...prev, endDateFrom: date || null }))}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {/* Mobile: Card layout */}
            <div className="sm:hidden space-y-3 px-4">
              {filteredClients.map((client) => (
                <div 
                  key={client.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{client.full_name}</p>
                      {client.subscription?.status === "pending_payment" && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-600 border-amber-500/30 shrink-0">
                          Pgto Pendente
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {client.subscription?.plan_type && (
                        <Badge variant="outline" className="text-[10px]">
                          {PLAN_NAMES[client.subscription.plan_type] || client.subscription.plan_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0 ml-2">
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
                </div>
              ))}
              {filteredClients.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum cliente encontrado
                </p>
              )}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Plano</TableHead>
                    <TableHead className="hidden lg:table-cell">Último Acesso</TableHead>
                    <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate max-w-[200px]">{client.full_name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{client.email}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {renderEngagementBadges(client)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(client.client_status)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          {client.subscription ? (
                            <>
                              <Badge variant="outline" className="text-xs w-fit">
                                {PLAN_NAMES[client.subscription.plan_type] || client.subscription.plan_type}
                              </Badge>
                              {client.subscription.status === "pending_payment" && (
                                <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 border-amber-500/30 w-fit">
                                  Aguardando Pagamento
                                </Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground text-xs">Sem plano</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">
                        {client.lastAccess ? (
                          format(new Date(client.lastAccess), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">Nunca acessou</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">
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
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
