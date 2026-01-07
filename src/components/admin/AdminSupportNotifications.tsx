import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, AlertTriangle, MessageCircle, User, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SupportAlert {
  id: string;
  user_id: string;
  conversa_id: string | null;
  alert_type: string;
  urgency_level: string;
  message_preview: string | null;
  keywords_detected: string[] | null;
  is_read: boolean;
  created_at: string;
  profile?: {
    full_name: string;
    email: string | null;
  } | null;
}

export function AdminSupportNotifications() {
  const [alerts, setAlerts] = useState<SupportAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const unreadCount = alerts.filter(a => !a.is_read).length;
  const urgentCount = alerts.filter(a => !a.is_read && a.urgency_level === 'urgent').length;

  useEffect(() => {
    fetchAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-support-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_support_alerts'
        },
        async (payload) => {
          // Fetch profile for new alert
          const newAlert = payload.new as SupportAlert;
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", newAlert.user_id)
            .single();
          
          setAlerts(prev => [{ ...newAlert, profile }, ...prev]);
          
          // Play notification sound for urgent alerts
          if (newAlert.urgency_level === 'urgent') {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleC4UFIV4h');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  };

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_support_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles for each alert
      const alertsWithProfiles = await Promise.all(
        (data || []).map(async (alert) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", alert.user_id)
            .single();
          
          return { ...alert, profile } as SupportAlert;
        })
      );

      setAlerts(alertsWithProfiles);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await supabase
        .from("admin_support_alerts")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", alertId);
      
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_read: true } : a
      ));
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
      
      await supabase
        .from("admin_support_alerts")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", unreadIds);
      
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleAlertClick = (alert: SupportAlert) => {
    markAsRead(alert.id);
    setOpen(false);
    navigate("/admin/suporte-chats");
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-primary/20 text-primary';
    }
  };

  const getAlertIcon = (alert: SupportAlert) => {
    if (alert.urgency_level === 'urgent') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <MessageCircle className="h-4 w-4 text-primary" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={cn(
            "h-5 w-5",
            urgentCount > 0 && "animate-pulse text-red-500"
          )} />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold",
              urgentCount > 0 ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"
            )}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h4 className="font-semibold">Notificações de Suporte</h4>
            <p className="text-sm text-muted-foreground">
              {unreadCount} não lida{unreadCount !== 1 && 's'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                    !alert.is_read && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "rounded-full p-2 shrink-0",
                      getUrgencyColor(alert.urgency_level)
                    )}>
                      {getAlertIcon(alert)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {alert.profile?.full_name || 'Cliente'}
                        </span>
                        {alert.urgency_level === 'urgent' && (
                          <Badge variant="destructive" className="text-xs">
                            URGENTE
                          </Badge>
                        )}
                        {!alert.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {alert.message_preview || 'Nova mensagem no suporte'}
                      </p>
                      {alert.keywords_detected && alert.keywords_detected.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {alert.keywords_detected.slice(0, 3).map((keyword, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(alert.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => {
              setOpen(false);
              navigate("/admin/suporte");
            }}
          >
            Ver todos os chats
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
