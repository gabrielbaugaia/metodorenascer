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
  DollarSign, 
  Activity,
  UserPlus,
  FileText,
  MessageCircle,
  Loader2,
  ChevronRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface Stats {
  totalClients: number;
  activeSubscriptions: number;
  totalProtocols: number;
  monthlyRevenue: number;
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

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    activeSubscriptions: 0,
    totalProtocols: 0,
    monthlyRevenue: 0,
  });
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
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

        // Active subscriptions and monthly revenue
        const { data: activeSubs } = await supabase
          .from("subscriptions")
          .select("price_cents, created_at")
          .eq("status", "active");

        const activeSubsCount = activeSubs?.length || 0;
        const monthlyRevenue = (activeSubs || []).reduce((sum, s) => sum + (s.price_cents || 0), 0) / 100;

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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
