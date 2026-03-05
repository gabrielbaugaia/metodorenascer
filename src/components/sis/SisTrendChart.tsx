import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

interface SisTrendChartProps {
  data: { date: string; score: number }[];
  avg7: number;
  avg14: number;
  avg30: number;
}

export function SisTrendChart({ data, avg7, avg14, avg30 }: SisTrendChartProps) {
  if (data.length < 2) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-5 text-center">
        <p className="text-xs text-muted-foreground">Dados insuficientes para tendência. Continue registrando.</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    label: format(parseISO(d.date), "dd/MM", { locale: ptBR }),
  }));

  const delta = avg7 - avg30;
  const trend: "up" | "down" | "stable" = delta > 1 ? "up" : delta < -1 ? "down" : "stable";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-muted-foreground";
  const trendText = trend === "up" ? "Sua tendência está subindo" : trend === "down" ? "Sua tendência está caindo" : "Tendência estável";

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Tendência 30 dias
        </h3>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span>7d: <strong className="text-foreground">{avg7}</strong></span>
          <span>14d: <strong className="text-foreground">{avg14}</strong></span>
          <span>30d: <strong className="text-foreground">{avg30}</strong></span>
        </div>
      </div>
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={30} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              formatter={(value: number) => [`${Math.round(value)}`, "Score"]}
            />
            <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trend indicator */}
      <div className={`flex items-center gap-2 ${trendColor}`}>
        <TrendIcon className="h-4 w-4" />
        <span className="text-xs font-medium">{trendText}</span>
      </div>

      {/* Explanatory legend */}
      <div className="space-y-2 pt-1 border-t border-border/30">
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Este gráfico mostra a evolução do seu <strong className="text-foreground">Shape Intelligence Score™</strong> nos últimos 30 dias.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
          <div className="rounded-lg bg-muted/30 p-2">
            <p className="font-semibold text-foreground">7d</p>
            <p>Média dos últimos 7 dias</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-2">
            <p className="font-semibold text-foreground">14d</p>
            <p>Média dos últimos 14 dias</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-2">
            <p className="font-semibold text-foreground">30d</p>
            <p>Média geral do mês</p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/70 italic">
          💡 Preencha seus dados diariamente para manter a precisão do gráfico.
        </p>
      </div>
    </div>
  );
}
