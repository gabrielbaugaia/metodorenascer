import { AlertTriangle, Info } from "lucide-react";
import type { SisAlert } from "@/lib/sisScoreCalc";

interface SisAlertsProps {
  alerts: SisAlert[];
}

export function SisAlerts({ alerts }: SisAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        Alertas
      </h3>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`rounded-lg p-3 text-xs space-y-1 ${
              alert.priority === "alta"
                ? "bg-red-500/10 border border-red-500/20"
                : "bg-yellow-500/10 border border-yellow-500/20"
            }`}
          >
            <p className="font-medium text-foreground">{alert.message}</p>
            <p className="text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              {alert.action}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
