import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Moon, Zap, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { calcScore, classify } from "@/lib/renascerScoreCalc";

interface DayLog {
  date: string;
  sleep_hours: number | null;
  stress_level: number | null;
  energy_focus: number | null;
  trained_today: boolean | null;
  rpe: number | null;
}

export function RecentLogsHistory() {
  const { user } = useAuth();

  const { data: logs } = useQuery({
    queryKey: ["recent-logs-history", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const sevenAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const { data } = await supabase
        .from("manual_day_logs")
        .select("date, sleep_hours, stress_level, energy_focus, trained_today, rpe")
        .eq("user_id", user!.id)
        .gte("date", sevenAgo)
        .lte("date", today)
        .order("date", { ascending: false });
      return (data ?? []) as DayLog[];
    },
  });

  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">Registre seu primeiro dia</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30">
        <h3 className="text-sm font-semibold text-foreground">Últimos 7 dias</h3>
      </div>
      <div className="divide-y divide-border/30">
        {logs.map((log, i) => {
          const prev = i < logs.length - 1 ? logs[i + 1] : null;
          const dayScore = calcScore(log, prev);
          const { classification } = classify(dayScore);
          const classColors: Record<string, string> = {
            ELITE: "bg-green-500/15 text-green-400",
            ALTO: "bg-blue-500/15 text-blue-400",
            MODERADO: "bg-yellow-500/15 text-yellow-400",
            RISCO: "bg-red-500/15 text-red-400",
          };

          return (
            <Dialog key={log.date}>
              <DialogTrigger asChild>
                <button className="flex items-center justify-between w-full px-4 py-2.5 text-left hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium text-foreground w-20">
                    {format(new Date(log.date + "T12:00:00"), "EEE dd/MM", { locale: ptBR })}
                  </span>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1 text-xs">
                      <Moon className="h-3 w-3" />
                      {log.sleep_hours ?? "—"}h
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <Brain className="h-3 w-3" />
                      {log.stress_level ?? "—"}
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <Zap className="h-3 w-3" />
                      {log.energy_focus ?? "—"}
                    </span>
                  </div>
                  <Badge className={`text-[10px] px-1.5 py-0 ${classColors[classification] || ""}`}>
                    {dayScore}
                  </Badge>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-base">
                    {format(new Date(log.date + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sono</span>
                    <span className="font-medium">{log.sleep_hours ?? "—"} horas</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estresse</span>
                    <span className="font-medium">{log.stress_level ?? "—"}/100</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Energia/Foco</span>
                    <span className="font-medium">{log.energy_focus ?? "—"}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Treinou</span>
                    <span className="font-medium">{log.trained_today ? "Sim" : "Não"}</span>
                  </div>
                  {log.trained_today && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">RPE</span>
                      <span className="font-medium">{log.rpe ?? "—"}/10</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t border-border/30">
                    <span className="text-muted-foreground">Score</span>
                    <Badge className={`${classColors[classification] || ""}`}>
                      {dayScore} — {classification}
                    </Badge>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </div>
  );
}
