import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  AlertTriangle, 
  MessageCircle, 
  Camera, 
  Clock, 
  ChevronRight,
  UserX,
  Bell
} from "lucide-react";

interface Alert {
  id: string;
  type: "urgent_support" | "inactive_client" | "pending_checkin" | "pending_protocol";
  title: string;
  description: string;
  count: number;
  url: string;
  severity: "high" | "medium" | "low";
}

export function AdminAlertsPanel() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const alertsList: Alert[] = [];

        // 1. Check for unread support alerts
        const { data: supportAlerts, count: supportCount } = await supabase
          .from("admin_support_alerts")
          .select("*", { count: "exact" })
          .eq("is_read", false);

        if (supportCount && supportCount > 0) {
          alertsList.push({
            id: "urgent_support",
            type: "urgent_support",
            title: "Suporte Urgente",
            description: `${supportCount} mensagem(ns) aguardando atendimento`,
            count: supportCount,
            url: "/admin/suporte",
            severity: "high",
          });
        }

        // 2. Check for inactive clients (no activity in 7+ days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: inactiveClients, count: inactiveCount } = await supabase
          .from("user_activity")
          .select("*", { count: "exact" })
          .lt("last_access", sevenDaysAgo.toISOString());

        if (inactiveCount && inactiveCount > 0) {
          alertsList.push({
            id: "inactive_clients",
            type: "inactive_client",
            title: "Clientes Inativos",
            description: `${inactiveCount} cliente(s) sem acessar há 7+ dias`,
            count: inactiveCount,
            url: "/admin/clientes",
            severity: "medium",
          });
        }

        // 3. Check for clients without protocols
        const { data: clientsWithoutProtocols } = await supabase
          .from("profiles")
          .select("id")
          .eq("anamnese_completa", true);

        if (clientsWithoutProtocols) {
          const clientIds = clientsWithoutProtocols.map(c => c.id);
          
          const { data: protocolos } = await supabase
            .from("protocolos")
            .select("user_id")
            .in("user_id", clientIds);

          const clientsWithProtocols = new Set(protocolos?.map(p => p.user_id) || []);
          const pendingProtocols = clientIds.filter(id => !clientsWithProtocols.has(id)).length;

          if (pendingProtocols > 0) {
            alertsList.push({
              id: "pending_protocols",
              type: "pending_protocol",
              title: "Protocolos Pendentes",
              description: `${pendingProtocols} cliente(s) aguardando protocolo`,
              count: pendingProtocols,
              url: "/admin/planos",
              severity: "medium",
            });
          }
        }

        // 4. Check for pending check-ins (30+ days since last)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: pendingCheckinCount } = await supabase
          .from("checkins")
          .select("user_id", { count: "exact" })
          .lt("created_at", thirtyDaysAgo.toISOString());

        // This is a simplified check - in production you'd want to get unique users
        if (pendingCheckinCount && pendingCheckinCount > 0) {
          alertsList.push({
            id: "pending_checkins",
            type: "pending_checkin",
            title: "Check-ins Atrasados",
            description: `Clientes com check-in há mais de 30 dias`,
            count: pendingCheckinCount,
            url: "/admin/clientes",
            severity: "low",
          });
        }

        setAlerts(alertsList);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "urgent_support": return MessageCircle;
      case "inactive_client": return UserX;
      case "pending_checkin": return Camera;
      case "pending_protocol": return Clock;
      default: return Bell;
    }
  };

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "high": return "border-red-500/50 bg-red-500/10";
      case "medium": return "border-yellow-500/50 bg-yellow-500/10";
      case "low": return "border-blue-500/50 bg-blue-500/10";
    }
  };

  const getSeverityBadge = (severity: Alert["severity"]) => {
    switch (severity) {
      case "high": return <Badge variant="destructive">Urgente</Badge>;
      case "medium": return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">Atenção</Badge>;
      case "low": return <Badge variant="outline">Info</Badge>;
    }
  };

  if (loading || alerts.length === 0) return null;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Central de Alertas
          <Badge variant="secondary" className="ml-auto">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const Icon = getAlertIcon(alert.type);
          return (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${getSeverityColor(alert.severity)} cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => navigate(alert.url)}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{alert.title}</p>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}