import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    </div>
  );
}
