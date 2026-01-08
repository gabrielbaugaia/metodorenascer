import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Mail, MousePointerClick, Eye, TrendingUp } from "lucide-react";

interface MessageMetric {
  message_id: string;
  message_title: string;
  trigger_type: string;
  is_custom: boolean;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
}

export function MessageMetricsPanel() {
  const [metrics, setMetrics] = useState<MessageMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ sent: 0, opened: 0, clicked: 0 });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from("v_message_metrics")
        .select("*")
        .order("total_sent", { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as MessageMetric[];
      setMetrics(typedData);
      
      const totals = typedData.reduce(
        (acc, m) => ({
          sent: acc.sent + (m.total_sent || 0),
          opened: acc.opened + (m.total_opened || 0),
          clicked: acc.clicked + (m.total_clicked || 0),
        }),
        { sent: 0, opened: 0, clicked: 0 }
      );
      setTotals(totals);
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const overallOpenRate = totals.sent > 0 
    ? ((totals.opened / totals.sent) * 100).toFixed(1) 
    : "0";
  const overallClickRate = totals.opened > 0 
    ? ((totals.clicked / totals.opened) * 100).toFixed(1) 
    : "0";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.sent}</p>
                <p className="text-sm text-muted-foreground">Total Enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Eye className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.opened}</p>
                <p className="text-sm text-muted-foreground">Abertas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <MousePointerClick className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.clicked}</p>
                <p className="text-sm text-muted-foreground">Clicadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallOpenRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa Abertura</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Métricas por Mensagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma mensagem enviada ainda
            </p>
          ) : (
            <div className="space-y-4">
              {metrics.map((metric) => (
                <div
                  key={metric.message_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{metric.message_title}</p>
                      {metric.is_custom && (
                        <Badge variant="secondary" className="text-xs">
                          Personalizada
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {metric.trigger_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{metric.total_sent}</p>
                      <p className="text-muted-foreground">Enviadas</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-green-600">
                        {metric.open_rate}%
                      </p>
                      <p className="text-muted-foreground">Abertura</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-purple-600">
                        {metric.click_rate}%
                      </p>
                      <p className="text-muted-foreground">Cliques</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
