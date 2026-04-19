import { useEffect, useMemo, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Loader2,
  Download,
  ArrowLeft,
  Copy,
  TrendingUp,
  Target,
  Eye,
  MousePointerClick,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type LeadStatus = "completed_quiz" | "viewed_offer" | "clicked_checkout" | "converted";

interface QuizAnswer {
  question: string;
  answer: string;
  score: number;
}

interface QuizLead {
  id: string;
  created_at: string;
  nome: string;
  email: string;
  whatsapp: string;
  quiz_answers: Record<string, QuizAnswer>;
  risk_score: number;
  status: LeadStatus;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  viewed_offer_at: string | null;
  clicked_checkout_at: string | null;
  converted_at: string | null;
  contacted_by_admin: boolean;
  contacted_at: string | null;
  contact_notes: string | null;
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  completed_quiz: "Completou Quiz",
  viewed_offer: "Viu Oferta",
  clicked_checkout: "Clicou Checkout",
  converted: "Comprou",
};

const STATUS_VARIANT: Record<LeadStatus, "secondary" | "outline" | "default"> = {
  completed_quiz: "outline",
  viewed_offer: "secondary",
  clicked_checkout: "secondary",
  converted: "default",
};

function riskBadge(score: number) {
  if (score >= 70) return { label: "Alto", className: "bg-destructive/15 text-destructive border-destructive/30" };
  if (score >= 40) return { label: "Médio", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" };
  return { label: "Baixo", className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30" };
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

function whatsappLink(phone: string, nome: string, riskScore: number) {
  const d = phone.replace(/\D/g, "");
  const num = d.startsWith("55") ? d : `55${d}`;
  const text = encodeURIComponent(
    `Olá ${nome.split(" ")[0]}, aqui é da equipe Renascer. Vi que você completou o Diagnóstico (risco ${riskScore}%) e quero te ajudar a destravar isso. Posso te explicar o próximo passo?`
  );
  return `https://wa.me/${num}?text=${text}`;
}

export default function AdminLeadsQuiz() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<QuizLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [utmFilter, setUtmFilter] = useState<string>("all");

  const [selected, setSelected] = useState<QuizLead | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!adminLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchLeads();
  }, [isAdmin]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("quiz_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      setLeads((data as unknown as QuizLead[]) || []);
    } catch (err) {
      console.error("Error loading quiz leads:", err);
      toast.error("Erro ao carregar leads do quiz");
    } finally {
      setLoading(false);
    }
  };

  const utmSources = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.utm_source) set.add(l.utm_source);
    });
    return Array.from(set).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (riskFilter === "high" && l.risk_score < 70) return false;
      if (riskFilter === "medium" && (l.risk_score < 40 || l.risk_score >= 70)) return false;
      if (riskFilter === "low" && l.risk_score >= 40) return false;
      if (utmFilter !== "all" && (l.utm_source ?? "") !== utmFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (
          !l.nome?.toLowerCase().includes(q) &&
          !l.email?.toLowerCase().includes(q) &&
          !l.whatsapp?.includes(searchTerm)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [leads, statusFilter, riskFilter, utmFilter, searchTerm]);

  const funnel = useMemo(() => {
    const completed = leads.length;
    const viewed = leads.filter((l) => ["viewed_offer", "clicked_checkout", "converted"].includes(l.status)).length;
    const clicked = leads.filter((l) => ["clicked_checkout", "converted"].includes(l.status)).length;
    const converted = leads.filter((l) => l.status === "converted").length;
    return { completed, viewed, clicked, converted };
  }, [leads]);

  const handleCopyWhats = (lead: QuizLead) => {
    navigator.clipboard.writeText(formatPhone(lead.whatsapp));
    toast.success("WhatsApp copiado!");
  };

  const openDetails = (lead: QuizLead) => {
    setSelected(lead);
    setNotesDraft(lead.contact_notes || "");
  };

  const handleSaveContact = async () => {
    if (!selected) return;
    setSavingNote(true);
    try {
      const wasContacted = selected.contacted_by_admin;
      const { error } = await supabase
        .from("quiz_leads")
        .update({
          contacted_by_admin: true,
          contacted_at: wasContacted ? selected.contacted_at : new Date().toISOString(),
          contact_notes: notesDraft,
        })
        .eq("id", selected.id);
      if (error) throw error;
      toast.success("Lead atualizado");
      await fetchLeads();
      setSelected(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar");
    } finally {
      setSavingNote(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Nome",
      "WhatsApp",
      "Email",
      "Risco %",
      "Status",
      "UTM Source",
      "UTM Campaign",
      "Contatado",
      "Data Captura",
    ];
    const rows = filtered.map((l) => [
      l.nome,
      formatPhone(l.whatsapp),
      l.email,
      String(l.risk_score),
      STATUS_LABEL[l.status],
      l.utm_source ?? "",
      l.utm_campaign ?? "",
      l.contacted_by_admin ? "Sim" : "Não",
      format(new Date(l.created_at), "dd/MM/yyyy HH:mm"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz_leads_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("CSV exportado!");
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
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold uppercase truncate">Leads do Quiz</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Reativação comercial — quem completou o quiz e ainda não comprou
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              <span className="text-xs sm:text-sm">CSV</span>
            </Button>
          </div>
        </div>

        {/* Funil */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FunnelCard
            icon={Target}
            label="Completaram Quiz"
            value={funnel.completed}
            color="text-primary"
          />
          <FunnelCard
            icon={Eye}
            label="Viram Oferta"
            value={funnel.viewed}
            pct={funnel.completed ? Math.round((funnel.viewed / funnel.completed) * 100) : 0}
            color="text-blue-500"
          />
          <FunnelCard
            icon={MousePointerClick}
            label="Clicaram Checkout"
            value={funnel.clicked}
            pct={funnel.completed ? Math.round((funnel.clicked / funnel.completed) * 100) : 0}
            color="text-yellow-500"
          />
          <FunnelCard
            icon={CheckCircle2}
            label="Converteram"
            value={funnel.converted}
            pct={funnel.completed ? Math.round((funnel.converted / funnel.completed) * 100) : 0}
            color="text-green-500"
          />
        </div>

        {/* Filtros */}
        <Card variant="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Lista de Leads</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {filtered.length} de {leads.length} leads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="relative col-span-1 md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nome, email, WhatsApp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="completed_quiz">Completou Quiz</SelectItem>
                  <SelectItem value="viewed_offer">Viu Oferta</SelectItem>
                  <SelectItem value="clicked_checkout">Clicou Checkout</SelectItem>
                  <SelectItem value="converted">Comprou</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo risco</SelectItem>
                  <SelectItem value="high">Alto (≥70%)</SelectItem>
                  <SelectItem value="medium">Médio (40-69%)</SelectItem>
                  <SelectItem value="low">Baixo (&lt;40%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {utmSources.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground">UTM:</span>
                <Button
                  variant={utmFilter === "all" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setUtmFilter("all")}
                >
                  Todas
                </Button>
                {utmSources.map((s) => (
                  <Button
                    key={s}
                    variant={utmFilter === s ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setUtmFilter(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            )}

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {filtered.map((lead) => {
                const r = riskBadge(lead.risk_score);
                return (
                  <button
                    key={lead.id}
                    onClick={() => openDetails(lead)}
                    className="w-full text-left p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{lead.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                        <p className="text-xs text-muted-foreground">{formatPhone(lead.whatsapp)}</p>
                      </div>
                      <Badge variant="outline" className={r.className}>
                        {lead.risk_score}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <Badge variant={STATUS_VARIANT[lead.status]} className="text-[10px]">
                        {STATUS_LABEL[lead.status]}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(lead.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-center py-8 text-muted-foreground text-sm">Nenhum lead encontrado</p>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>UTM</TableHead>
                    <TableHead>Captura</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => {
                    const r = riskBadge(lead.risk_score);
                    return (
                      <TableRow
                        key={lead.id}
                        className="cursor-pointer"
                        onClick={() => openDetails(lead)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate max-w-[160px]">{lead.nome}</p>
                            {lead.contacted_by_admin && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm truncate max-w-[180px]">{lead.email}</p>
                          <p className="text-xs text-muted-foreground">{formatPhone(lead.whatsapp)}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={r.className}>
                            {lead.risk_score}% · {r.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[lead.status]} className="text-xs">
                            {STATUS_LABEL[lead.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {lead.utm_source ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(lead.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleCopyWhats(lead)}
                              title="Copiar WhatsApp"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <a
                              href={whatsappLink(lead.whatsapp, lead.nome, lead.risk_score)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-7 px-2 text-xs rounded-md border border-border hover:bg-muted"
                              title="Abrir WhatsApp"
                            >
                              WhatsApp
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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

      {/* Drawer detalhes */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.nome}</SheetTitle>
                <SheetDescription>
                  Captado em {format(new Date(selected.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Email</p>
                    <p className="break-all">{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">WhatsApp</p>
                    <p>{formatPhone(selected.whatsapp)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Risco</p>
                    <Badge variant="outline" className={riskBadge(selected.risk_score).className}>
                      {selected.risk_score}% · {riskBadge(selected.risk_score).label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Status</p>
                    <Badge variant={STATUS_VARIANT[selected.status]}>
                      {STATUS_LABEL[selected.status]}
                    </Badge>
                  </div>
                  {selected.utm_source && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground uppercase">Origem</p>
                      <p className="text-xs">
                        {selected.utm_source} / {selected.utm_medium ?? "—"} / {selected.utm_campaign ?? "—"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <a
                    href={whatsappLink(selected.whatsapp, selected.nome, selected.risk_score)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
                  >
                    Abrir WhatsApp
                  </a>
                  <Button variant="outline" size="sm" onClick={() => handleCopyWhats(selected)}>
                    <Copy className="h-4 w-4 mr-1" /> Copiar
                  </Button>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-2">Respostas do Quiz</p>
                  <div className="space-y-2">
                    {Object.entries(selected.quiz_answers || {}).map(([key, a]) => (
                      <div key={key} className="border border-border rounded-md p-3 bg-card/50">
                        <p className="text-xs text-muted-foreground">{a.question}</p>
                        <p className="text-sm mt-1">
                          {a.answer}{" "}
                          <span className="text-xs text-muted-foreground">(score {a.score})</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="contacted"
                      checked={selected.contacted_by_admin}
                      onCheckedChange={(v) =>
                        setSelected({ ...selected, contacted_by_admin: !!v })
                      }
                    />
                    <label htmlFor="contacted" className="text-sm cursor-pointer">
                      Já entrei em contato com este lead
                    </label>
                  </div>
                  <Textarea
                    placeholder="Notas do contato (resposta, objeção, próximo passo...)"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={handleSaveContact} disabled={savingNote} className="w-full">
                    {savingNote ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Salvar
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </ClientLayout>
  );
}

function FunnelCard({
  icon: Icon,
  label,
  value,
  pct,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  pct?: number;
  color: string;
}) {
  return (
    <Card variant="glass">
      <CardContent className="p-3 sm:pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-muted/50">
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase truncate">
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg sm:text-2xl font-bold">{value}</p>
              {typeof pct === "number" && (
                <span className="text-[10px] sm:text-xs text-muted-foreground inline-flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  {pct}%
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
