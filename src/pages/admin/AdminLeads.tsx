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
import { Search, Loader2, Download, Users, TrendingUp, Calendar, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  origem: string;
  converted: boolean;
  created_at: string;
}

export default function AdminLeads() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!adminLoading && !isAdmin) {
      navigate("/area-cliente");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchLeads();
    }
  }, [isAdmin]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Erro ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    }
    if (phone.length === 10) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone?.includes(searchTerm)
  );

  const exportCSV = () => {
    const headers = ["Nome", "Telefone", "Email", "Origem", "Data Captura"];
    const rows = filteredLeads.map((l) => [
      l.nome,
      formatPhone(l.telefone),
      l.email,
      l.origem || "lancamento",
      format(new Date(l.created_at), "dd/MM/yyyy HH:mm"),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("CSV exportado com sucesso!");
  };

  // Stats
  const todayLeads = leads.filter(
    (l) => format(new Date(l.created_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  ).length;

  const weekLeads = leads.filter((l) => {
    const leadDate = new Date(l.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return leadDate >= weekAgo;
  }).length;

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
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold uppercase truncate">Leads</h1>
              <p className="text-muted-foreground text-xs sm:text-sm truncate">Leads capturados na página de lançamento</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} className="self-start">
            <Download className="h-4 w-4 mr-2" />
            <span className="text-xs sm:text-sm">Exportar CSV</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card variant="glass">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-full bg-primary/10">
                  <Users className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Total</p>
                  <p className="text-lg sm:text-2xl font-bold">{leads.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-full bg-green-500/10">
                  <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-green-500" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">7 dias</p>
                  <p className="text-lg sm:text-2xl font-bold">{weekLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-full bg-blue-500/10">
                  <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">Hoje</p>
                  <p className="text-lg sm:text-2xl font-bold">{todayLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card variant="glass">
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex flex-col gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg">Lista de Leads</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{filteredLeads.length} leads encontrados</CardDescription>
              </div>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {/* Mobile: Card layout */}
            <div className="sm:hidden space-y-2 px-4">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="p-3 rounded-lg border border-border/50 bg-card/50">
                  <p className="font-medium text-sm truncate">{lead.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-[10px]">{lead.origem || "lancamento"}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(lead.created_at), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
              {filteredLeads.length === 0 && (
                <p className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum lead encontrado
                </p>
              )}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden sm:block rounded-md border mx-0 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="hidden md:table-cell">Origem</TableHead>
                    <TableHead className="hidden lg:table-cell">Data Captura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <p className="font-medium text-sm truncate max-w-[150px]">{lead.nome}</p>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm truncate max-w-[180px]">{lead.email}</p>
                          <p className="text-xs text-muted-foreground">{formatPhone(lead.telefone)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{lead.origem || "lancamento"}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLeads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum lead encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
