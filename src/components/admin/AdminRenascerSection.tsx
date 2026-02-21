import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/renascer/StatusBadge";
import { TrendIndicator } from "@/components/renascer/TrendIndicator";
import { calcScore, classify, calculateTrend } from "@/lib/renascerScoreCalc";
import { format, subDays } from "date-fns";
import { Flame, Loader2 } from "lucide-react";

interface AdminRenascerSectionProps {
  clientId: string;
}

interface DayLog {
  date: string;
  sleep_hours: number | null;
  stress_level: number | null;
  energy_focus: number | null;
  trained_today: boolean | null;
  rpe: number | null;
}

export function AdminRenascerSection({ clientId }: AdminRenascerSectionProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-renascer-logs", clientId],
    queryFn: async () => {
      const fourteenDaysAgo = format(subDays(new Date(), 14), "yyyy-MM-dd");
      const { data } = await supabase
        .from("manual_day_logs")
        .select("date, sleep_hours, stress_level, energy_focus, trained_today, rpe")
        .eq("user_id", clientId)
        .gte("date", fourteenDaysAgo)
        .order("date", { ascending: true });
      return (data ?? []) as DayLog[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" /> Renascer Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const allLogs = logs ?? [];

  if (allLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" /> Renascer Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cliente ainda não registrou dados no Renascer.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate scores for each day
  const scored = allLogs.map((log, i) => {
    const prev = i > 0 ? allLogs[i - 1] : null;
    const score = calcScore(log, prev);
    const { classification, statusText } = classify(score);
    return { ...log, score, classification, statusText };
  });

  const latest = scored[scored.length - 1];
  const { trend, trendText } = calculateTrend(scored);

  // Display in descending order
  const displayLogs = [...scored].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" /> Renascer Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Atual + Tendência */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-foreground">{latest.score}</span>
            <span className="text-muted-foreground text-sm">/100</span>
          </div>
          <StatusBadge classification={latest.classification} statusText={latest.statusText} />
          <TrendIndicator trend={trend} text={trendText} />
          <span className="text-xs text-muted-foreground">Último: {latest.date}</span>
        </div>

        {/* Tabela Histórico */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Sono</TableHead>
                <TableHead>Estresse</TableHead>
                <TableHead>Energia</TableHead>
                <TableHead>Treinou</TableHead>
                <TableHead>RPE</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayLogs.map((log) => (
                <TableRow key={log.date}>
                  <TableCell className="font-mono text-xs">{log.date}</TableCell>
                  <TableCell>{log.sleep_hours ?? "—"}h</TableCell>
                  <TableCell>{log.stress_level ?? "—"}</TableCell>
                  <TableCell>{log.energy_focus ?? "—"}/5</TableCell>
                  <TableCell>{log.trained_today ? "Sim" : "Não"}</TableCell>
                  <TableCell>{log.trained_today ? (log.rpe ?? "—") : "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.score >= 85
                          ? "default"
                          : log.score >= 65
                          ? "secondary"
                          : log.score >= 40
                          ? "outline"
                          : "destructive"
                      }
                    >
                      {log.score}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
