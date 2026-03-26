import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus, Info, Lightbulb, BookOpen, ChevronRight } from "lucide-react";
import type { HealthDaily } from "@/hooks/useHealthData";

export type MetricKey = "steps" | "active_calories" | "sleep_minutes" | "resting_hr" | "hrv_ms" | "avg_hr_bpm" | "exercise_minutes" | "distance_km";

interface MetricConfig {
  label: string;
  unit: string;
  color: string;
  chartColor: string;
  ranges: { low: number; mid: number; high: number };
  rangeLabels: { low: string; mid: string; high: string };
  invertColor?: boolean; // lower is better (e.g. resting HR)
  explanation: string;
  tips: (value: number) => string;
  formatValue?: (v: number) => string;
}

const METRIC_CONFIGS: Record<MetricKey, MetricConfig> = {
  steps: {
    label: "Passos",
    unit: "passos",
    color: "text-blue-500",
    chartColor: "hsl(217, 91%, 60%)",
    ranges: { low: 5000, mid: 8000, high: 99999 },
    rangeLabels: { low: "Abaixo do recomendado", mid: "Moderado", high: "Ideal" },
    explanation: "A OMS recomenda 8.000 a 10.000 passos diários. Estudos mostram que cada 2.000 passos adicionais reduzem o risco cardiovascular em até 8%. Manter-se ativo ao longo do dia (não apenas no treino) é fundamental para a longevidade.",
    tips: (v) =>
      v < 5000
        ? "Tente adicionar uma caminhada de 15 min após as refeições. Pequenas pausas ativas fazem diferença enorme."
        : v < 8000
          ? "Você está no caminho certo! Tente estacionar mais longe ou descer um ponto antes para alcançar 8k+."
          : "Excelente! Mantenha esse nível. Considere variar com trilhas ou caminhadas em ritmo mais acelerado.",
  },
  active_calories: {
    label: "Calorias Ativas",
    unit: "kcal",
    color: "text-orange-500",
    chartColor: "hsl(25, 95%, 53%)",
    ranges: { low: 200, mid: 400, high: 99999 },
    rangeLabels: { low: "Baixo gasto", mid: "Moderado", high: "Alto gasto" },
    explanation: "Calorias ativas representam a energia gasta em movimento (NEAT + exercício), excluindo o metabolismo basal. Um gasto ativo elevado melhora a sensibilidade à insulina, regula o apetite e acelera a composição corporal.",
    tips: (v) =>
      v < 200
        ? "Aumente o NEAT: suba escadas, fique em pé durante ligações, faça micro-caminhadas de 5min a cada hora."
        : v < 400
          ? "Bom nível! Para otimizar, adicione uma sessão de cardio leve em jejum pela manhã."
          : "Ótimo gasto calórico! Certifique-se de manter a ingestão alimentar adequada para não comprometer a recuperação.",
  },
  sleep_minutes: {
    label: "Sono",
    unit: "",
    color: "text-indigo-500",
    chartColor: "hsl(239, 84%, 67%)",
    ranges: { low: 360, mid: 420, high: 99999 },
    rangeLabels: { low: "Sono insuficiente", mid: "Moderado", high: "Ideal" },
    formatValue: (v) => {
      const h = Math.floor(v / 60);
      const m = v % 60;
      return `${h}h${m.toString().padStart(2, "0")}`;
    },
    explanation: "O sono é quando o corpo se repara, consolida memórias e regula hormônios como GH e testosterona. Menos de 6h compromete a recuperação muscular em até 40% e aumenta o cortisol, dificultando a queima de gordura.",
    tips: (v) =>
      v < 360
        ? "Priorize o sono! Desligue telas 1h antes de deitar, mantenha o quarto escuro e fresco. Tente dormir 30min mais cedo hoje."
        : v < 420
          ? "Quase lá! Tente criar uma rotina de descompressão: leitura, respiração ou alongamento antes de dormir."
          : "Sono excelente! Mantenha a regularidade de horários — dormir e acordar no mesmo horário é tão importante quanto a duração.",
  },
  resting_hr: {
    label: "FC Repouso",
    unit: "bpm",
    color: "text-red-500",
    chartColor: "hsl(0, 72%, 51%)",
    ranges: { low: 60, mid: 75, high: 99999 },
    rangeLabels: { low: "Atlético", mid: "Normal", high: "Elevado" },
    invertColor: true,
    explanation: "A frequência cardíaca de repouso reflete seu condicionamento cardiovascular. Atletas bem treinados costumam ter FC abaixo de 60 bpm. Uma tendência de queda ao longo das semanas indica que seu coração está ficando mais eficiente.",
    tips: (v) =>
      v > 75
        ? "FC elevada pode indicar estresse, má recuperação ou excesso de treino. Priorize descanso, hidratação e controle de estresse."
        : v > 60
          ? "Faixa normal! Continue treinando consistentemente. O cardio aeróbico é o melhor caminho para reduzir a FC de repouso."
          : "Nível atlético! Seu coração está eficiente. Monitore variações bruscas que podem indicar overtraining.",
  },
  hrv_ms: {
    label: "VFC (HRV)",
    unit: "ms",
    color: "text-green-500",
    chartColor: "hsl(142, 71%, 45%)",
    ranges: { low: 20, mid: 50, high: 99999 },
    rangeLabels: { low: "Baixa variabilidade", mid: "Moderada", high: "Boa variabilidade" },
    explanation: "A Variabilidade de Frequência Cardíaca (VFC/HRV) mede a capacidade do seu sistema nervoso de se adaptar. Valores altos indicam boa recuperação e equilíbrio autonômico. É considerado um dos melhores biomarcadores de prontidão para treino.",
    tips: (v) =>
      v < 20
        ? "VFC baixa sugere estresse acumulado ou má recuperação. Considere treino leve, meditação e melhorar a qualidade do sono."
        : v < 50
          ? "VFC moderada. Para melhorar: pratique respiração diafragmática, durma bem e evite álcool e estimulantes à noite."
          : "Excelente VFC! Seu corpo está bem recuperado. Dia ideal para treino intenso se os outros marcadores concordarem.",
  },
  avg_hr_bpm: {
    label: "BPM Diário",
    unit: "bpm",
    color: "text-pink-500",
    chartColor: "hsl(330, 81%, 60%)",
    ranges: { low: 70, mid: 100, high: 99999 },
    rangeLabels: { low: "Ótimo", mid: "Normal", high: "Elevado" },
    invertColor: true,
    explanation: "O BPM médio diário reflete sua frequência cardíaca ao longo de todo o dia, incluindo atividades e repouso. Valores consistentemente altos podem indicar estresse crônico, desidratação ou falta de condicionamento aeróbico.",
    tips: (v) =>
      v > 100
        ? "BPM diário elevado. Verifique hidratação, estresse e qualidade do sono. Considere incluir mais caminhadas e reduzir cafeína."
        : v > 70
          ? "Faixa normal. Mantenha hábitos saudáveis e monitore a tendência ao longo das semanas."
          : "Excelente controle cardiovascular! Seu condicionamento aeróbico está ótimo.",
  },
  exercise_minutes: {
    label: "Exercício",
    unit: "min",
    color: "text-emerald-500",
    chartColor: "hsl(160, 84%, 39%)",
    ranges: { low: 15, mid: 30, high: 99999 },
    rangeLabels: { low: "Abaixo da meta", mid: "Bom", high: "Excelente" },
    explanation: "A OMS recomenda 150 minutos de atividade moderada por semana (~22 min/dia). Exercício regular reduz risco de doenças crônicas, melhora o humor e acelera a composição corporal. Consistência importa mais que intensidade.",
    tips: (v) =>
      v < 15
        ? "Tente incluir pelo menos 20 min de atividade hoje. Pode ser uma caminhada rápida, dança ou alongamento ativo."
        : v < 30
          ? "Bom começo! Para maximizar resultados, tente chegar a 30-45 min com variação entre cardio e força."
          : "Excelente volume! Certifique-se de equilibrar com descanso adequado para evitar overtraining.",
  },
  distance_km: {
    label: "Distância",
    unit: "km",
    color: "text-cyan-500",
    chartColor: "hsl(188, 78%, 41%)",
    ranges: { low: 3, mid: 6, high: 99999 },
    rangeLabels: { low: "Curta", mid: "Moderada", high: "Longa" },
    formatValue: (v) => v.toFixed(1),
    explanation: "A distância percorrida é um indicador prático de mobilidade diária. Combinar caminhadas com treino estruturado melhora o condicionamento geral e auxilia na recuperação ativa entre sessões de musculação.",
    tips: (v) =>
      v < 3
        ? "Tente caminhar mais ao longo do dia. Caminhadas pós-refeição de 10-15 min melhoram a digestão e a glicemia."
        : v < 6
          ? "Boa distância! Para progredir, aumente gradualmente em no máximo 10% por semana para evitar lesões."
          : "Ótima mobilidade diária! Varie os terrenos e intensidades para continuar evoluindo.",
  },
};

function getStatusColor(metric: MetricKey, value: number): string {
  const cfg = METRIC_CONFIGS[metric];
  if (cfg.invertColor) {
    if (value <= cfg.ranges.low) return "text-green-400";
    if (value <= cfg.ranges.mid) return "text-yellow-400";
    return "text-red-400";
  }
  if (value < cfg.ranges.low) return "text-red-400";
  if (value < cfg.ranges.mid) return "text-yellow-400";
  return "text-green-400";
}

function getStatusLabel(metric: MetricKey, value: number): string {
  const cfg = METRIC_CONFIGS[metric];
  if (cfg.invertColor) {
    if (value <= cfg.ranges.low) return cfg.rangeLabels.low;
    if (value <= cfg.ranges.mid) return cfg.rangeLabels.mid;
    return cfg.rangeLabels.high;
  }
  if (value < cfg.ranges.low) return cfg.rangeLabels.low;
  if (value < cfg.ranges.mid) return cfg.rangeLabels.mid;
  return cfg.rangeLabels.high;
}

interface Props {
  open: boolean;
  onClose: () => void;
  metric: MetricKey;
  dailyData: HealthDaily[];
}

export function HealthMetricDetailDrawer({ open, onClose, metric, dailyData }: Props) {
  const cfg = METRIC_CONFIGS[metric];
  if (!cfg) return null;

  const series = dailyData
    .map((d) => {
      const raw = (d as any)[metric];
      return raw != null && raw > 0 ? { date: d.date, value: Number(raw) } : null;
    })
    .filter(Boolean) as { date: string; value: number }[];

  const reversed = [...series].reverse();
  const chartData = reversed.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "dd/MM", { locale: ptBR }),
  }));

  const currentValue = series.length > 0 ? series[0].value : null;

  // Trend: avg last 3 vs avg previous
  const last3 = series.slice(0, 3).map((s) => s.value);
  const prev = series.slice(3).map((s) => s.value);
  const avgLast3 = last3.length > 0 ? last3.reduce((a, b) => a + b, 0) / last3.length : 0;
  const avgPrev = prev.length > 0 ? prev.reduce((a, b) => a + b, 0) / prev.length : 0;

  let trendDirection: "up" | "down" | "stable" = "stable";
  if (prev.length > 0) {
    const delta = ((avgLast3 - avgPrev) / avgPrev) * 100;
    if (delta > 5) trendDirection = "up";
    else if (delta < -5) trendDirection = "down";
  }

  // For inverted metrics (lower is better), interpret trend differently
  const isPositiveTrend = cfg.invertColor
    ? trendDirection === "down"
    : trendDirection === "up";
  const isNegativeTrend = cfg.invertColor
    ? trendDirection === "up"
    : trendDirection === "down";

  const TrendIcon = trendDirection === "up" ? TrendingUp : trendDirection === "down" ? TrendingDown : Minus;
  const trendColor = isPositiveTrend ? "text-green-400" : isNegativeTrend ? "text-red-400" : "text-muted-foreground";
  const trendText = isPositiveTrend ? "Melhorando" : isNegativeTrend ? "Em queda" : "Estável";

  const displayValue = currentValue != null
    ? cfg.formatValue
      ? cfg.formatValue(currentValue)
      : metric === "steps"
        ? currentValue.toLocaleString("pt-BR")
        : String(currentValue)
    : "—";

  const avg = series.length > 0
    ? Math.round(series.reduce((a, b) => a + b.value, 0) / series.length)
    : 0;

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto px-5 pb-6">
          <DrawerHeader className="px-0 pt-2 pb-4">
            <DrawerTitle className="text-base font-semibold">{cfg.label}</DrawerTitle>
          </DrawerHeader>

          {/* Big value */}
          <div className="text-center mb-5">
            <p className={`text-5xl font-black ${currentValue != null ? getStatusColor(metric, currentValue) : "text-muted-foreground"}`}>
              {displayValue}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {cfg.unit && <span>{cfg.unit} · </span>}
              {currentValue != null ? getStatusLabel(metric, currentValue) : "Sem dados"}
            </p>
            {series.length > 1 && (
              <div className={`flex items-center justify-center gap-1.5 mt-2 ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                <span className="text-xs font-medium">{trendText}</span>
              </div>
            )}
          </div>

          {/* Chart */}
          {chartData.length >= 2 && (
            <div className="rounded-xl border border-border/50 bg-card p-4 mb-4">
              <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Evolução 7 dias</p>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={35} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                      formatter={(value: number) => [cfg.formatValue ? cfg.formatValue(value) : value, cfg.label]}
                    />
                    <ReferenceLine y={avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <Line type="monotone" dataKey="value" stroke={cfg.chartColor} strokeWidth={2.5} dot={{ r: 3, fill: cfg.chartColor }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Média: <strong className="text-foreground">{cfg.formatValue ? cfg.formatValue(avg) : avg}</strong> {cfg.unit}
              </p>
            </div>
          )}

          {/* Scientific explanation */}
          <div className="rounded-xl border border-border/50 bg-card p-4 mb-3">
            <div className="flex items-start gap-3">
              <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">O que significa</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{cfg.explanation}</p>
              </div>
            </div>
          </div>

          {/* Actionable tip */}
          {currentValue != null && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">Orientação para amanhã</p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{cfg.tips(currentValue)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
