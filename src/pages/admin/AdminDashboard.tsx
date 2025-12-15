import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertTriangle,
  Target,
  Percent,
  Clock
} from "lucide-react";
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
  });
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([]);
  const [loading, setLoading] = useState(true);

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
          .select("status, price_cents, plan_type, created_at, updated_at");

        const activeSubs = allSubs?.filter(s => s.status === "active") || [];
        const pendingSubs = allSubs?.filter(s => s.status === "pending") || [];
        const canceledSubs = allSubs?.filter(s => s.status === "canceled") || [];
        const trialSubs = allSubs?.filter(s => s.status === "trialing") || [];

        const activeSubsCount = activeSubs.length;
        const monthlyRevenue = activeSubs.reduce((sum, s) => sum + (s.price_cents || 0), 0) / 100;
        const avgTicket = activeSubsCount > 0 ? monthlyRevenue / activeSubsCount : 0;
        
        // Churn rate (canceled / total)
        const totalSubsEver = allSubs?.length || 0;
        const churnRate = totalSubsEver > 0 ? (canceledSubs.length / totalSubsEver) * 100 : 0;
        
        // Conversion rate (active / total clients)
        const conversionRate = (clientCount || 0) > 0 ? (activeSubsCount / (clientCount || 1)) * 100 : 0;

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

          // Count active subscriptions created in this month (revenue)
          const { data: monthSubs } = await supabase
            .from("subscriptions")
            .select("price_cents")
            .eq("status", "active")
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

  if (!isAdmin) return null;

  const quickActions = [
    { title: "Novo Cliente", icon: UserPlus, url: "/admin/criar-cliente", color: "from-green-500 to-emerald-600" },
    { title: "Ver Clientes", icon: Users, url: "/admin/clientes", color: "from-blue-500 to-indigo-600" },
    { title: "Gerenciar Planos", icon: FileText, url: "/admin/planos", color: "from-purple-500 to-pink-600" },
    { title: "Banco de Vídeos", icon: Video, url: "/admin/videos", color: "from-cyan-500 to-blue-600" },
    { title: "Monitorar Suporte", icon: MessageCircle, url: "/admin/suporte", color: "from-orange-500 to-red-600" },
  ];

  return (
    <ClientLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground">Visão geral do Método Renascer</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Clientes</p>
                  <p className="text-3xl font-bold">{stats.totalClients}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                  <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Protocolos Gerados</p>
                  <p className="text-3xl font-bold">{stats.totalProtocols}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receita Mensal</p>
                  <p className="text-3xl font-bold">
                    {stats.monthlyRevenue > 0 
                      ? `R$ ${(stats.monthlyRevenue / 1000).toFixed(1)}k`
                      : "R$ 0"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                  <p className="text-xl font-bold">R$ {stats.avgTicket.toFixed(2)}</p>
                </div>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Taxa Conversão</p>
                  <p className="text-xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                </div>
                <Percent className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Taxa Churn</p>
                  <p className="text-xl font-bold text-red-400">{stats.churnRate.toFixed(1)}%</p>
                </div>
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-xl font-bold text-yellow-400">{stats.pendingSubscriptions}</p>
                </div>
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <Card 
              key={action.title}
              className="group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg overflow-hidden"
              onClick={() => navigate(action.url)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <CardContent className="p-4 flex items-center gap-3 relative">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color}`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium text-sm">{action.title}</span>
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

        {/* Plan Distribution */}
        {planDistribution.length > 0 && (
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Distribuição por Plano</CardTitle>
              <CardDescription>Análise de assinaturas ativas por tipo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {planDistribution.map((plan, idx) => {
                    const colors = ["bg-primary", "bg-green-500", "bg-blue-500", "bg-purple-500", "bg-yellow-500"];
                    return (
                      <div key={plan.plan} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
                          <span className="font-medium">{plan.plan}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{plan.count} assinantes</p>
                          <p className="text-sm text-muted-foreground">R$ {plan.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planDistribution}
                        dataKey="count"
                        nameKey="plan"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ plan, percent }) => `${plan}: ${(percent * 100).toFixed(0)}%`}
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
                          borderRadius: "8px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Receita Mensal</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
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
            <CardHeader>
              <CardTitle>Novos vs Cancelados</CardTitle>
              <CardDescription>Movimento de clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Line type="monotone" dataKey="novos" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
                    <Line type="monotone" dataKey="cancelados" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Clients */}
        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Clientes Recentes</CardTitle>
              <CardDescription>Últimos cadastros</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate("/admin/clientes")}>
              Ver Todos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">{client.full_name}</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                  <Badge variant={client.client_status === "active" ? "default" : "secondary"}>
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
