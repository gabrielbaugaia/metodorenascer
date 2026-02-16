import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatusCardProps {
  connected: boolean;
  lastSync: string | null;
  syncResult?: { success: boolean; message: string } | null;
}

const StatusCard = ({ connected, lastSync, syncResult }: StatusCardProps) => {
  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-3">
      {/* Connection status */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div
            className={`h-3 w-3 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm font-medium text-foreground">
            {connected ? "Conectado" : "Desconectado"}
          </span>
        </CardContent>
      </Card>

      {/* Last sync */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <span className="text-muted-foreground">Última sincronização: </span>
            <span className="font-medium text-foreground">
              {lastSync ? formatTimestamp(lastSync) : "Nunca"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Sync result */}
      {syncResult && (
        <Card
          className={
            syncResult.success
              ? "border-green-500/30 bg-green-500/5"
              : "border-red-500/30 bg-red-500/5"
          }
        >
          <CardContent className="flex items-center gap-3 p-4">
            {syncResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm font-medium">{syncResult.message}</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatusCard;
