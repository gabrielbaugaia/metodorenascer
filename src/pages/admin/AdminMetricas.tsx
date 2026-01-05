import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Users, DollarSign, BarChart3, Activity, RefreshCw } from "lucide-react";

interface ConversionFunnel {
  landing_views: number;
  plan_views: number;
  checkout_started: number;
  checkout_completed: number;
}

interface TopPage {
  page_name: string;
  view_count: number;
  unique_visitors: number;
}

interface EngagementStatus {
  status_engagement: string;
  user_count: number;
  avg_workouts: number;
  avg_logins: number;
}

interface ChannelMetrics {
  acquisition_channel: string;
  total_users: number;
  active_subscribers: number;
  total_mrr: number;
  churned_users: number;
}

interface RetentionCohort {
  cohort_month: string;
  total_started: number;
  retained_1m: number;
  retained_3m: number;
  retained_6m: number;
}

interface MrrSummary {
  plan_name: string;
  active_subscriptions: number;
  total_mrr: number;
  avg_mrr: number;
}

export default function AdminMetricas() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [engagementStats, setEngagementStats] = useState<EngagementStatus[]>([]);
  const [channelMetrics, setChannelMetrics] = useState<ChannelMetrics[]>([]);
  const [retentionCohorts, setRetentionCohorts] = useState<RetentionCohort[]>([]);
  const [mrrSummary, setMrrSummary] = useState<MrrSummary[]>([]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Fetch all metrics in parallel
      const [funnelRes, pagesRes, engagementRes, channelRes, retentionRes, mrrRes] = await Promise.all([
        supabase.from("v_conversion_funnel").select("*").limit(1),
        supabase.from("v_top_pages").select("*").limit(20),
        supabase.from("v_engagement_by_status").select("*"),
        supabase.from("v_metrics_by_channel").select("*"),
        supabase.from("v_retention_cohorts").select("*").limit(12),
        supabase.from("v_mrr_summary").select("*"),
      ]);

      if (funnelRes.data?.[0]) setFunnel(funnelRes.data[0] as ConversionFunnel);
      if (pagesRes.data) setTopPages(pagesRes.data as TopPage[]);
      if (engagementRes.data) setEngagementStats(engagementRes.data as EngagementStatus[]);
      if (channelRes.data) setChannelMetrics(channelRes.data as ChannelMetrics[]);
      if (retentionRes.data) setRetentionCohorts(retentionRes.data as RetentionCohort[]);
      if (mrrRes.data) setMrrSummary(mrrRes.data as MrrSummary[]);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMetrics();
    }
  }, [isAdmin]);

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Exclude free plans from financial metrics
  const paidMrrSummary = mrrSummary.filter(s => s.plan_name?.toLowerCase() !== "gratuito" && s.plan_name?.toLowerCase() !== "free");
  const totalMrr = paidMrrSummary.reduce((acc, s) => acc + (Number(s.total_mrr) || 0), 0);
  const totalActiveSubscribers = paidMrrSummary.reduce((acc, s) => acc + (Number(s.active_subscriptions) || 0), 0);

  const funnelConversion = funnel ? {
    landingToPlans: funnel.landing_views > 0 ? ((funnel.plan_views / funnel.landing_views) * 100).toFixed(1) : "0",
    plansToCheckout: funnel.plan_views > 0 ? ((funnel.checkout_started / funnel.plan_views) * 100).toFixed(1) : "0",
    checkoutToComplete: funnel.checkout_started > 0 ? ((funnel.checkout_completed / funnel.checkout_started) * 100).toFixed(1) : "0",
    overallConversion: funnel.landing_views > 0 ? ((funnel.checkout_completed / funnel.landing_views) * 100).toFixed(2) : "0",
  } : null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Métricas e CRM</h1>
            <p className="text-muted-foreground">Visão completa de finanças, uso e retenção</p>
          </div>
          <Button onClick={fetchMetrics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                MRR Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                R$ {totalMrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Assinantes Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalActiveSubscribers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Conversão Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-500">{funnelConversion?.overallConversion || 0}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Em Risco de Churn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-500">
                {engagementStats.find(e => e.status_engagement === "em_risco")?.user_count || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="funnel" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="funnel">Funil</TabsTrigger>
            <TabsTrigger value="pages">Páginas</TabsTrigger>
            <TabsTrigger value="engagement">Engajamento</TabsTrigger>
            <TabsTrigger value="channels">Canais</TabsTrigger>
            <TabsTrigger value="retention">Retenção</TabsTrigger>
          </TabsList>

          <TabsContent value="funnel" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Funil de Conversão (últimos 30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {funnel && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Landing Page</p>
                        <p className="text-2xl font-bold">{funnel.landing_views}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">100%</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <div className="text-sm text-muted-foreground">↓ {funnelConversion?.landingToPlans}%</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Visualizou Planos</p>
                        <p className="text-2xl font-bold">{funnel.plan_views}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{funnelConversion?.landingToPlans}%</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="text-sm text-muted-foreground">↓ {funnelConversion?.plansToCheckout}%</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Iniciou Checkout</p>
                        <p className="text-2xl font-bold">{funnel.checkout_started}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {funnel.landing_views > 0 ? ((funnel.checkout_started / funnel.landing_views) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="text-sm text-muted-foreground">↓ {funnelConversion?.checkoutToComplete}%</div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary rounded-lg">
                      <div>
                        <p className="font-medium text-primary">Conversão Completa</p>
                        <p className="text-2xl font-bold text-primary">{funnel.checkout_completed}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-primary">{funnelConversion?.overallConversion}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Páginas Mais Acessadas (últimos 30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topPages.map((page, idx) => (
                    <div key={page.page_name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-mono text-sm w-6">{idx + 1}</span>
                        <span className="font-medium">{page.page_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{page.view_count} views</p>
                        <p className="text-xs text-muted-foreground">{page.unique_visitors} únicos</p>
                      </div>
                    </div>
                  ))}
                  {topPages.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Nenhum dado disponível ainda</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {engagementStats.map(stat => (
                <Card key={stat.status_engagement} className={
                  stat.status_engagement === "ativo" ? "border-green-500" :
                  stat.status_engagement === "em_risco" ? "border-yellow-500" : "border-red-500"
                }>
                  <CardHeader>
                    <CardTitle className="capitalize">
                      {stat.status_engagement === "ativo" ? "🟢 Ativos" :
                       stat.status_engagement === "em_risco" ? "🟡 Em Risco" : "🔴 Quase Churn"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{stat.user_count}</p>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Média treinos/30d: {Number(stat.avg_workouts || 0).toFixed(1)}</p>
                      <p>Média logins/30d: {Number(stat.avg_logins || 0).toFixed(1)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {engagementStats.length === 0 && (
                <Card className="col-span-3">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum dado de engajamento disponível ainda
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="channels" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Métricas por Canal de Aquisição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Canal</th>
                        <th className="text-right p-3">Total Usuários</th>
                        <th className="text-right p-3">Assinantes</th>
                        <th className="text-right p-3">MRR</th>
                        <th className="text-right p-3">Churned</th>
                        <th className="text-right p-3">Conversão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channelMetrics.map(ch => (
                        <tr key={ch.acquisition_channel} className="border-b">
                          <td className="p-3 font-medium">{ch.acquisition_channel}</td>
                          <td className="text-right p-3">{ch.total_users}</td>
                          <td className="text-right p-3">{ch.active_subscribers}</td>
                          <td className="text-right p-3">R$ {Number(ch.total_mrr || 0).toLocaleString("pt-BR")}</td>
                          <td className="text-right p-3 text-red-500">{ch.churned_users}</td>
                          <td className="text-right p-3">
                            {ch.total_users > 0 ? ((ch.active_subscribers / ch.total_users) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {channelMetrics.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Nenhum dado disponível ainda</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retention" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Retenção por Coorte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Mês</th>
                        <th className="text-right p-3">Total Iniciaram</th>
                        <th className="text-right p-3">Retidos 1m</th>
                        <th className="text-right p-3">Retidos 3m</th>
                        <th className="text-right p-3">Retidos 6m</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retentionCohorts.map(cohort => (
                        <tr key={cohort.cohort_month} className="border-b">
                          <td className="p-3 font-medium">
                            {new Date(cohort.cohort_month).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                          </td>
                          <td className="text-right p-3">{cohort.total_started}</td>
                          <td className="text-right p-3">
                            {cohort.retained_1m} ({cohort.total_started > 0 ? ((cohort.retained_1m / cohort.total_started) * 100).toFixed(0) : 0}%)
                          </td>
                          <td className="text-right p-3">
                            {cohort.retained_3m} ({cohort.total_started > 0 ? ((cohort.retained_3m / cohort.total_started) * 100).toFixed(0) : 0}%)
                          </td>
                          <td className="text-right p-3">
                            {cohort.retained_6m} ({cohort.total_started > 0 ? ((cohort.retained_6m / cohort.total_started) * 100).toFixed(0) : 0}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {retentionCohorts.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Nenhum dado disponível ainda</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* MRR by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>MRR por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {mrrSummary.map(plan => (
                <div key={plan.plan_name} className="p-4 bg-muted rounded-lg text-center">
                  <p className="font-medium capitalize">{plan.plan_name || "Não definido"}</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {Number(plan.total_mrr || 0).toLocaleString("pt-BR")}
                  </p>
                  <p className="text-sm text-muted-foreground">{plan.active_subscriptions} assinantes</p>
                </div>
              ))}
              {mrrSummary.length === 0 && (
                <div className="col-span-5 text-center text-muted-foreground py-8">
                  Nenhum dado de MRR disponível ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
