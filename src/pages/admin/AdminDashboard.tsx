import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminAlertsPanel } from "@/components/admin/AdminAlertsPanel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Activity,
  UserPlus,
  FileText,
  Loader2,
  ChevronDown,
  Video,
  AlertTriangle,
  Target,
  Percent,
  Clock,
  Mail,
  Wallet,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface Stats {
  totalClients: number;
  activeSubscriptions: number;
  totalProtocols: number;
  monthlyRevenue: number;
  pendingSubscriptions: number;
  canceledSubscriptions: number;
  trialSubscriptions: number;
  avgTicket: number;
  churnRate: number;
  conversionRate: number;
  ltv: number;
  mrr: number;
}

interface RecentClient {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  client_status: string | null;
}

interface MonthlyData {
  month: string;
  receita: number;
  novos: number;
  cancelados: number;
}

interface PlanDistribution {
  plan: string;
  count: number;
  revenue: number;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    activeSubscriptions: 0,
    totalProtocols: 0,
    monthlyRevenue: 0,
    pendingSubscriptions: 0,
    canceledSubscriptions: 0,
    trialSubscriptions: 0,
    avgTicket: 0,
    churnRate: 0,
    conversionRate: 0,
    ltv: 0,
    mrr: 0,
  });
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReport, setSendingReport] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!adminLoading && !isAdmin) {
      navigate("/area-cliente");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAdmin) return;

      try {
        const { count: clientCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        const { data: allSubs } = await supabase
          .from("subscriptions")
          .select("status, price_cents, plan_type, created_at, updated_at, stripe_subscription_id");

        const activeSubs = allSubs?.filter(s => s.status === "active") || [];
        const pendingSubs = allSubs?.filter(s => s.status === "pending") || [];
        const canceledSubs = allSubs?.filter(s => s.status === "canceled") || [];
        const trialSubs = allSubs?.filter(s => s.status === "trialing") || [];

        const paidActiveSubs = activeSubs.filter(s => s.stripe_subscription_id != null);
        const paidAllSubs = allSubs?.filter(s => s.stripe_subscription_id != null) || [];
        const paidCanceledSubs = canceledSubs.filter(s => s.stripe_subscription_id != null);

        const activeSubsCount = activeSubs.length;
        const paidActiveSubsCount = paidActiveSubs.length;
        const monthlyRevenue = paidActiveSubs.reduce((sum, s) => sum + (s.price_cents || 0), 0) / 100;
        const avgTicket = paidActiveSubsCount > 0 ? monthlyRevenue / paidActiveSubsCount : 0;
        
        const totalPaidSubsEver = paidAllSubs.length;
        const churnRate = totalPaidSubsEver > 0 ? (paidCanceledSubs.length / totalPaidSubsEver) * 100 : 0;
        
        const freeSubsCount = activeSubs.filter(s => s.plan_type === "free" || (s.price_cents || 0) === 0).length;
        const paidEligibleClients = (clientCount || 0) - freeSubsCount;
        const conversionRate = paidEligibleClients > 0 ? (paidActiveSubsCount / paidEligibleClients) * 100 : 0;

        const planCounts: Record<string, { count: number; revenue: number }> = {};
        activeSubs.forEach(s => {
          const plan = s.plan_type || "Desconhecido";
          if (!planCounts[plan]) {
            planCounts[plan] = { count: 0, revenue: 0 };
          }
          planCounts[plan].count++;
          planCounts[plan].revenue += (s.price_cents || 0) / 100;
        });
        
        const planDistData: PlanDistribution[] = Object.entries(planCounts).map(([plan, data]) => ({
          plan: plan.charAt(0).toUpperCase() + plan.slice(1),
          count: data.count,
          revenue: data.revenue,
        }));
        setPlanDistribution(planDistData);

        const { count: protocolCount } = await supabase
          .from("protocolos")
          .select("*", { count: "exact", head: true });

        const { data: clients } = await supabase
          .from("profiles")
          .select("id, full_name, email, created_at, client_status")
          .order("created_at", { ascending: false })
          .limit(5);

        const now = new Date();
        const months: MonthlyData[] = [];
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStart = date.toISOString();
          const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();

          const { count: newCount } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", monthStart)
            .lt("created_at", nextMonth);

          const { data: monthSubs } = await supabase
            .from("subscriptions")
            .select("price_cents, plan_type")
            .eq("status", "active")
            .neq("plan_type", "free")
            .gt("price_cents", 0)
            .gte("created_at", monthStart)
            .lt("created_at", nextMonth);

          const monthRevenue = (monthSubs || []).reduce((sum, s) => sum + (s.price_cents || 0), 0) / 100;

          const { count: canceledCount } = await supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("status", "canceled")
            .gte("updated_at", monthStart)
            .lt("updated_at", nextMonth);

          months.push({
            month: monthNames[date.getMonth()],
            receita: monthRevenue,
            novos: newCount || 0,
            cancelados: canceledCount || 0,
          });
        }

        const mrr = monthlyRevenue;
        const avgLifetimeMonths = churnRate > 0 ? 100 / churnRate : 12;
        const ltv = avgTicket * avgLifetimeMonths;

        setChartData(months);
        setStats({
          totalClients: clientCount || 0,
          activeSubscriptions: activeSubsCount,
          totalProtocols: protocolCount || 0,
          monthlyRevenue,
          pendingSubscriptions: pendingSubs.length,
          canceledSubscriptions: canceledSubs.length,
          trialSubscriptions: trialSubs.length,
          avgTicket,
          churnRate,
          conversionRate,
          ltv,
          mrr,
        });

        setRecentClients(clients || []);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin]);

  if (authLoading || adminLoading || loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  const handleSendWeeklyReport = async () => {
    setSendingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('weekly-support-report');
      if (error) throw error;
      if (data?.success) {
        toast.success("Relatório semanal enviado para seu email!");
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Error sending report:", error);
      toast.error(error.message || "Erro ao enviar relatório");
    } finally {
      setSendingReport(false);
    }
  };

  const statusCards = [
    { label: "Clientes", value: stats.totalClients, icon: Users, href: "/admin/clientes" },
    { label: "Receita", value: stats.monthlyRevenue > 0 ? `R$ ${(stats.monthlyRevenue / 1000).toFixed(1)}k` : "R$ 0", icon: DollarSign, href: "/admin/metricas" },
    { label: "Protocolos", value: stats.totalProtocols, icon: FileText, href: "/admin/planos" },
    { label: "Assinaturas", value: stats.activeSubscriptions, icon: Activity, href: "/admin/planos-venda" },
  ];

  const quickActions = [
    { title: "Novo Cliente", icon: UserPlus, url: "/admin/criar-cliente" },
    { title: "Ver Clientes", icon: Users, url: "/admin/clientes" },
    { title: "Protocolos", icon: FileText, url: "/admin/planos" },
    { title: "Banco de Vídeos", icon: Video, url: "/admin/videos" },
    { title: "Planos Comerciais", icon: DollarSign, url: "/admin/commercial-plans" },
    { title: "Campanhas Trial", icon: Zap, url: "/admin/trial-campaigns" },
    { title: "Connector Docs", icon: FileText, url: "/admin/docs/conector-mobile" },
  ];

  return (
    <ClientLayout>
      <div className="space-y-6 max-w-full overflow-hidden">
        {/* 1. Header minimalista */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendWeeklyReport}
            disabled={sendingReport}
          >
            {sendingReport ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Mail className="h-3.5 w-3.5 mr-1.5" />
            )}
            <span className="text-xs">{sendingReport ? "Enviando..." : "Relatório Semanal"}</span>
          </Button>
        </div>

        {/* 2. Executive Status Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statusCards.map((card) => (
            <div
              key={card.label}
              onClick={() => navigate(card.href)}
              className="bg-card border border-border/50 hover:border-primary/30 transition-colors cursor-pointer rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <card.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{card.value}</p>
            </div>
          ))}
        </div>

        {/* 3. Quick Actions — Operações */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Operações</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <div
                key={action.title}
                onClick={() => navigate(action.url)}
                className="bg-card border border-border/50 hover:border-primary/30 transition-colors cursor-pointer rounded-lg p-3 flex items-center gap-2.5"
              >
                <action.icon className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-foreground truncate">{action.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Insights — Colapsado por padrão */}
        <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
            <ChevronDown className={`h-4 w-4 transition-transform ${insightsOpen ? "rotate-180" : ""}`} />
            <span className="font-medium">Ver insights</span>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-6 pt-4">
            {/* Alerts */}
            <AdminAlertsPanel />

            {/* Financial mini-cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { label: "Ticket Médio", value: `R$ ${stats.avgTicket.toFixed(0)}`, icon: Target },
                { label: "Conversão", value: `${stats.conversionRate.toFixed(1)}%`, icon: Percent },
                { label: "Churn", value: `${stats.churnRate.toFixed(1)}%`, icon: TrendingDown },
                { label: "MRR", value: `R$ ${stats.mrr.toFixed(0)}`, icon: DollarSign },
                { label: "LTV", value: `R$ ${stats.ltv.toFixed(0)}`, icon: Wallet },
                { label: "Pendentes", value: stats.pendingSubscriptions, icon: Clock },
              ].map((item) => (
                <div key={item.label} className="bg-card border border-border/50 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.label}</p>
                      <p className="text-base font-semibold">{item.value}</p>
                    </div>
                    <item.icon className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  </div>
                </div>
              ))}
            </div>

            {/* Gargalos */}
            {(stats.churnRate > 10 || stats.conversionRate < 50 || stats.pendingSubscriptions > 0) && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    Gargalos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.churnRate > 10 && (
                      <div className="flex items-start gap-2.5 p-2.5 bg-muted/30 rounded-lg">
                        <TrendingDown className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
                        <div>
                          <p className="text-sm font-medium">Churn {stats.churnRate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Melhorar onboarding e engajamento.</p>
                        </div>
                      </div>
                    )}
                    {stats.conversionRate < 50 && (
                      <div className="flex items-start gap-2.5 p-2.5 bg-muted/30 rounded-lg">
                        <Target className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
                        <div>
                          <p className="text-sm font-medium">Conversão {stats.conversionRate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Otimizar proposta de valor e landing page.</p>
                        </div>
                      </div>
                    )}
                    {stats.pendingSubscriptions > 0 && (
                      <div className="flex items-start gap-2.5 p-2.5 bg-muted/30 rounded-lg">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
                        <div>
                          <p className="text-sm font-medium">{stats.pendingSubscriptions} pendentes</p>
                          <p className="text-xs text-muted-foreground">Checkout não finalizado. Enviar lembretes.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plan Distribution */}
            {planDistribution.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distribuição por Plano</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      {planDistribution.map((plan, idx) => {
                        const colors = ["bg-primary", "bg-green-500", "bg-blue-500", "bg-purple-500", "bg-yellow-500"];
                        return (
                          <div key={plan.plan} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]} shrink-0`} />
                              <span className="text-sm truncate">{plan.plan}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold">{plan.count}</p>
                              <p className="text-xs text-muted-foreground">R$ {plan.revenue.toFixed(0)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={planDistribution} dataKey="count" nameKey="plan" cx="50%" cy="50%" outerRadius={60} label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {planDistribution.map((_, idx) => {
                              const colors = ["hsl(var(--primary))", "#22c55e", "#3b82f6", "#a855f7", "#eab308"];
                              return <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />;
                            })}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Receita Mensal</CardTitle>
                  <CardDescription className="text-xs">Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => [`R$ ${value}`, "Receita"]} />
                        <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Novos vs Cancelados</CardTitle>
                  <CardDescription className="text-xs">Movimento de clientes</CardDescription>
                </CardHeader>
                <CardContent className="px-2">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                        <Line type="monotone" dataKey="novos" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 3 }} />
                        <Line type="monotone" dataKey="cancelados" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Clients */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Clientes Recentes</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin/clientes")} className="text-xs text-muted-foreground">
                  Ver todos
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentClients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg gap-2">
                      <div className="min-w-0">
                        <p className="text-sm truncate">{client.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                      </div>
                      <Badge variant={client.client_status === "active" ? "default" : "secondary"} className="shrink-0 text-xs">
                        {client.client_status || "Ativo"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </ClientLayout>
  );
}
