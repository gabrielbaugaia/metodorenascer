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
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Activity,
  UserPlus,
  FileText,
  MessageCircle,
  Loader2,
  ChevronRight,
  Video,
  ImageIcon,
  AlertTriangle,
  Target,
  Percent,
  Clock,
  Mail,
  Send,
  Wallet
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
        // Total clients
        const { count: clientCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // All subscriptions for detailed analysis
        const { data: allSubs } = await supabase
          .from("subscriptions")
          .select("status, price_cents, plan_type, created_at, updated_at, stripe_subscription_id");

        const activeSubs = allSubs?.filter(s => s.status === "active") || [];
        const pendingSubs = allSubs?.filter(s => s.status === "pending") || [];
        const canceledSubs = allSubs?.filter(s => s.status === "canceled") || [];
        const trialSubs = allSubs?.filter(s => s.status === "trialing") || [];

        // Filter for REAL paying subscribers (must have stripe_subscription_id)
        const paidActiveSubs = activeSubs.filter(s => s.stripe_subscription_id != null);
        const paidAllSubs = allSubs?.filter(s => s.stripe_subscription_id != null) || [];
        const paidCanceledSubs = canceledSubs.filter(s => s.stripe_subscription_id != null);

        const activeSubsCount = activeSubs.length;
        const paidActiveSubsCount = paidActiveSubs.length;
        const monthlyRevenue = paidActiveSubs.reduce((sum, s) => sum + (s.price_cents || 0), 0) / 100;
        const avgTicket = paidActiveSubsCount > 0 ? monthlyRevenue / paidActiveSubsCount : 0;
        
        // Churn rate (canceled paid / total paid) - exclude free plans
        const totalPaidSubsEver = paidAllSubs.length;
        const churnRate = totalPaidSubsEver > 0 ? (paidCanceledSubs.length / totalPaidSubsEver) * 100 : 0;
        
        // Conversion rate (paid active / total clients minus free) - more accurate for financial analysis
        const freeSubsCount = activeSubs.filter(s => s.plan_type === "free" || (s.price_cents || 0) === 0).length;
        const paidEligibleClients = (clientCount || 0) - freeSubsCount;
        const conversionRate = paidEligibleClients > 0 ? (paidActiveSubsCount / paidEligibleClients) * 100 : 0;

        // Plan distribution
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

        // Total protocols
        const { count: protocolCount } = await supabase
          .from("protocolos")
          .select("*", { count: "exact", head: true });

        // Recent clients
        const { data: clients } = await supabase
          .from("profiles")
          .select("id, full_name, email, created_at, client_status")
          .order("created_at", { ascending: false })
          .limit(5);

        // Get data for last 6 months
        const now = new Date();
        const months: MonthlyData[] = [];
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStart = date.toISOString();
          const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();

          // Count new clients in this month
          const { count: newCount } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gte("created_at", monthStart)
            .lt("created_at", nextMonth);

          // Count active PAID subscriptions created in this month (revenue) - exclude free plans
          const { data: monthSubs } = await supabase
            .from("subscriptions")
            .select("price_cents, plan_type")
            .eq("status", "active")
            .neq("plan_type", "free")
            .gt("price_cents", 0)
            .gte("created_at", monthStart)
            .lt("created_at", nextMonth);

          const monthRevenue = (monthSubs || []).reduce((sum, s) => sum + (s.price_cents || 0), 0) / 100;

          // Count canceled in this month
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

// Calculate LTV and MRR
        const mrr = monthlyRevenue;
        const avgLifetimeMonths = churnRate > 0 ? 100 / churnRate : 12; // Average months before churn
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

  const quickActions = [
    { title: "Novo Cliente", icon: UserPlus, url: "/admin/criar-cliente", color: "from-green-500 to-emerald-600" },
    { title: "Ver Clientes", icon: Users, url: "/admin/clientes", color: "from-blue-500 to-indigo-600" },
    { title: "Protocolos", icon: FileText, url: "/admin/planos", color: "from-purple-500 to-pink-600" },
    { title: "Banco de Vídeos", icon: Video, url: "/admin/videos", color: "from-cyan-500 to-blue-600" },
    { title: "Banco de GIFs", icon: ImageIcon, url: "/admin/gifs", color: "from-teal-500 to-cyan-600" },
    { title: "Monitorar Suporte", icon: MessageCircle, url: "/admin/suporte", color: "from-orange-500 to-red-600" },
    { title: "Planos Comerciais", icon: DollarSign, url: "/admin/commercial-plans", color: "from-indigo-500 to-violet-600" },
    { title: "Campanhas Trial", icon: Activity, url: "/admin/trial-campaigns", color: "from-amber-500 to-orange-600" },
  ];

  return (
    <ClientLayout>
      <div className="space-y-6 max-w-full overflow-hidden">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">Dashboard Admin</h1>
            <p className="text-muted-foreground text-sm">Visão geral do Método Renascer</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendWeeklyReport}
            disabled={sendingReport}
            className="w-full sm:w-auto self-start"
          >
            {sendingReport ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            <span className="text-xs sm:text-sm">{sendingReport ? "Enviando..." : "Enviar Relatório Semanal"}</span>
          </Button>
        </div>

        {/* Alerts Panel */}
        <AdminAlertsPanel />

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card variant="glass">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Clientes</p>
                  <p className="text-xl sm:text-3xl font-bold">{stats.totalClients}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Assinaturas Ativas</p>
                  <p className="text-xl sm:text-3xl font-bold">{stats.activeSubscriptions}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Protocolos Gerados</p>
                  <p className="text-xl sm:text-3xl font-bold">{stats.totalProtocols}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Receita Mensal</p>
                  <p className="text-xl sm:text-3xl font-bold">
                    {stats.monthlyRevenue > 0 
                      ? `R$ ${(stats.monthlyRevenue / 1000).toFixed(1)}k`
                      : "R$ 0"}
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Metrics - Compact for mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <Card variant="glass">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Ticket Médio</p>
                  <p className="text-base sm:text-lg font-bold">R$ {stats.avgTicket.toFixed(0)}</p>
                </div>
                <Target className="h-4 w-4 text-blue-500 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Conversão</p>
                  <p className="text-base sm:text-lg font-bold">{stats.conversionRate.toFixed(1)}%</p>
                </div>
                <Percent className="h-4 w-4 text-green-500 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Churn</p>
                  <p className="text-base sm:text-lg font-bold text-red-400">{stats.churnRate.toFixed(1)}%</p>
                </div>
                <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">MRR</p>
                  <p className="text-base sm:text-lg font-bold text-green-400">R$ {stats.mrr.toFixed(0)}</p>
                </div>
                <DollarSign className="h-4 w-4 text-green-500 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">LTV</p>
                  <p className="text-base sm:text-lg font-bold text-purple-400">R$ {stats.ltv.toFixed(0)}</p>
                </div>
                <Wallet className="h-4 w-4 text-purple-500 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Pendentes</p>
                  <p className="text-base sm:text-lg font-bold text-yellow-400">{stats.pendingSubscriptions}</p>
                </div>
                <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {quickActions.map((action) => (
            <Card 
              key={action.title}
              className="group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg overflow-hidden relative"
              onClick={() => navigate(action.url)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none`} />
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 relative z-10">
                <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${action.color} shrink-0`}>
                  <action.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="font-medium text-xs sm:text-sm truncate">{action.title}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gargalos e Alertas */}
        {(stats.churnRate > 10 || stats.conversionRate < 50 || stats.pendingSubscriptions > 0) && (
          <Card variant="glass" className="border-yellow-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="h-5 w-5" />
                Gargalos Identificados
              </CardTitle>
              <CardDescription>Pontos de atenção para melhorar resultados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.churnRate > 10 && (
                  <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <TrendingDown className="h-5 w-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-400">Alta Taxa de Churn ({stats.churnRate.toFixed(1)}%)</p>
                      <p className="text-sm text-muted-foreground">Considere melhorar onboarding, aumentar engajamento com check-ins e personalizar comunicação.</p>
                    </div>
                  </div>
                )}
                {stats.conversionRate < 50 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <Target className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-400">Baixa Conversão ({stats.conversionRate.toFixed(1)}%)</p>
                      <p className="text-sm text-muted-foreground">Otimize landing page, ofereça trial gratuito ou melhore proposta de valor.</p>
                    </div>
                  </div>
                )}
                {stats.pendingSubscriptions > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <Clock className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-400">{stats.pendingSubscriptions} Assinaturas Pendentes</p>
                      <p className="text-sm text-muted-foreground">Clientes iniciaram checkout mas não finalizaram. Envie lembretes ou ofereça suporte.</p>
                    </div>
                  </div>
                )}
                {stats.canceledSubscriptions > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <Users className="h-5 w-5 text-orange-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-400">{stats.canceledSubscriptions} Cancelamentos Total</p>
                      <p className="text-sm text-muted-foreground">Analise motivos de cancelamento e implemente estratégias de retenção.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Distribution - Mobile optimized */}
        {planDistribution.length > 0 && (
          <Card variant="glass">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Distribuição por Plano</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Análise de assinaturas ativas por tipo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  {planDistribution.map((plan, idx) => {
                    const colors = ["bg-primary", "bg-green-500", "bg-blue-500", "bg-purple-500", "bg-yellow-500"];
                    return (
                      <div key={plan.plan} className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${colors[idx % colors.length]} shrink-0`} />
                          <span className="font-medium text-sm truncate">{plan.plan}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm">{plan.count}</p>
                          <p className="text-xs text-muted-foreground">R$ {plan.revenue.toFixed(0)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="h-40 sm:h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planDistribution}
                        dataKey="count"
                        nameKey="plan"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label={({ plan, percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {planDistribution.map((_, idx) => {
                          const colors = ["hsl(var(--primary))", "#22c55e", "#3b82f6", "#a855f7", "#eab308"];
                          return <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts - Stacked on mobile */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <Card variant="glass">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Receita Mensal</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px"
                      }}
                      formatter={(value) => [`R$ ${value}`, "Receita"]}
                    />
                    <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Novos vs Cancelados</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Movimento de clientes</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px"
                      }}
                    />
                    <Line type="monotone" dataKey="novos" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 3 }} />
                    <Line type="monotone" dataKey="cancelados" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Clients */}
        <Card variant="glass">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 sm:pb-4">
            <div>
              <CardTitle className="text-base sm:text-lg">Clientes Recentes</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Últimos cadastros</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/clientes")} className="self-start sm:self-auto">
              Ver Todos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {recentClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{client.full_name}</p>
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
      </div>
    </ClientLayout>
  );
}
