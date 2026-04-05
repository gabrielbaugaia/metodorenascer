import { useState } from "react";
import { Footprints, Flame, Moon, HeartPulse, Activity, Watch, Timer, Route, Heart, ChevronRight, BedDouble, ArrowDownUp, Armchair } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { HealthDaily } from "@/hooks/useHealthData";
import { EcgUploadCard } from "./EcgUploadCard";
import { HealthMetricDetailDrawer, type MetricKey } from "./HealthMetricDetailDrawer";

interface HealthDashboardTabProps {
  todayData: HealthDaily | null;
  dailyData: HealthDaily[];
  formatSleep: (m: number) => string;
  onConnectClick: () => void;
}

type SourceType = "manual" | "auto" | "estimado" | "indisponivel";

function resolveSource(source: string | null | undefined): SourceType {
  if (!source) return "indisponivel";
  if (source === "manual") return "manual";
  if (source === "healthkit" || source === "health_connect" || source === "auto") return "auto";
  return "indisponivel";
}

function SourceBadge({ source, subtitle }: { source: SourceType; subtitle?: string }) {
  const labels: Record<SourceType, string> = {
    manual: "manual",
    auto: "automático",
    estimado: "estimado",
    indisponivel: "indisponível",
  };
  return (
    <div className="mt-0.5">
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground border-border/50">
        {labels[source]}
      </Badge>
      {subtitle && (
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{subtitle}</p>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit, color, source, subtitle, emptyValue, onClick }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  source?: SourceType;
  subtitle?: string;
  emptyValue?: boolean;
  onClick?: () => void;
}) {
  const isClickable = !!onClick && !emptyValue;
  return (
    <Card
      className={isClickable ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}
      onClick={isClickable ? onClick : undefined}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">
            {emptyValue ? "—" : value}
            {!emptyValue && unit && <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>}
          </p>
          {source && <SourceBadge source={source} subtitle={subtitle} />}
        </div>
        {isClickable && (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </CardContent>
    </Card>
  );
}

// Simple sparkline for cardiovascular trends
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="mt-1">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

export function HealthDashboardTab({ todayData, dailyData, formatSleep, onConnectClick }: HealthDashboardTabProps) {
  const [drawerMetric, setDrawerMetric] = useState<MetricKey | null>(null);

  if (dailyData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <Watch className="h-12 w-12 text-muted-foreground/50" />
        <div>
          <p className="font-medium">Nenhum dado encontrado</p>
          <p className="text-sm text-muted-foreground">Conecte seu relógio para começar</p>
        </div>
        <Button onClick={onConnectClick}>Conectar relógio</Button>
      </div>
    );
  }

  const hasMeaningfulData = (d: HealthDaily | null) =>
    d && ((d.steps ?? 0) > 0 || (d.active_calories ?? 0) > 0 || (d.sleep_minutes ?? 0) > 0 || d.resting_hr || d.hrv_ms);

  const displayData = hasMeaningfulData(todayData)
    ? todayData
    : dailyData.find((d) => hasMeaningfulData(d)) ?? todayData;

  const isToday = displayData === todayData || displayData?.date === todayData?.date;
  const displayLabel = isToday
    ? "Hoje"
    : displayData
      ? `Último registro: ${format(new Date(displayData.date + "T12:00:00"), "dd/MM", { locale: ptBR })}`
      : "Hoje";

  const src = resolveSource(displayData?.source);
  const isAuto = src === "auto";

  const stepsEmpty = !isAuto && (displayData?.steps === 0 || !displayData?.steps);
  const calEmpty = !isAuto && (displayData?.active_calories === 0 || !displayData?.active_calories);
  const sleepVal = displayData?.sleep_minutes ?? 0;
  const sleepSrc = sleepVal > 0 ? src : "indisponivel";

  // Cardiovascular data — split into 7d and 21d windows
  const last7 = dailyData.slice(0, 7);
  const last21 = dailyData.slice(0, 21);

  const getValues = (data: HealthDaily[], key: keyof HealthDaily) =>
    data.map(d => d[key] as number | null).filter((v): v is number => v !== null && v > 0);

  const restingHrValues = getValues(last7, "resting_hr");
  const hrvValues = getValues(last7, "hrv_ms");
  const avgHrValues = getValues(last7, "avg_hr_bpm");
  const sleepingHrValues = getValues(last7, "sleeping_hr");
  const sleepingHrvValues = getValues(last7, "sleeping_hrv");
  const minHrValues = getValues(last7, "min_hr");
  const maxHrValues = getValues(last7, "max_hr");
  const sedentaryHrValues = getValues(last7, "sedentary_hr");

  // 21-day values for averages
  const hrvValues21d = getValues(last21, "hrv_ms");
  const restingHrValues21d = getValues(last21, "resting_hr");
  const sleepingHrValues21d = getValues(last21, "sleeping_hr");
  const sleepingHrvValues21d = getValues(last21, "sleeping_hrv");
  const sedentaryHrValues21d = getValues(last21, "sedentary_hr");

  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const hasCardioData = restingHrValues.length > 0 || hrvValues.length > 0 || avgHrValues.length > 0 || sleepingHrValues.length > 0 || sleepingHrvValues.length > 0 || minHrValues.length > 0 || sedentaryHrValues.length > 0;

  return (
    <div className="space-y-6">
      {/* Cards do dia */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{displayLabel}</h3>
        {displayData ? (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={Footprints}
              label="Passos"
              value={displayData.steps.toLocaleString("pt-BR")}
              color="bg-blue-500/10 text-blue-500"
              emptyValue={stepsEmpty}
              source={stepsEmpty ? "indisponivel" : src}
              subtitle={stepsEmpty ? "Fonte: indisponível" : undefined}
              onClick={() => setDrawerMetric("steps")}
            />
            <MetricCard
              icon={Flame}
              label="Calorias Ativas"
              value={displayData.active_calories}
              unit="kcal"
              color="bg-orange-500/10 text-orange-500"
              emptyValue={calEmpty}
              source={calEmpty ? "indisponivel" : src}
              subtitle={calEmpty ? "Estimativa disponível após registrar treinos ou conectar dispositivo" : undefined}
              onClick={() => setDrawerMetric("active_calories")}
            />
            <MetricCard
              icon={Moon}
              label="Sono"
              value={formatSleep(sleepVal)}
              color="bg-indigo-500/10 text-indigo-500"
              emptyValue={sleepVal === 0}
              source={sleepSrc}
              onClick={() => setDrawerMetric("sleep_minutes")}
            />
            <MetricCard
              icon={HeartPulse}
              label="FC Repouso"
              value={displayData.resting_hr ?? "—"}
              unit="bpm"
              color="bg-red-500/10 text-red-500"
              emptyValue={!displayData.resting_hr}
              source={displayData.resting_hr ? src : "indisponivel"}
              onClick={() => setDrawerMetric("resting_hr")}
            />
            <MetricCard
              icon={Activity}
              label="VFC (HRV)"
              value={displayData.hrv_ms ? Number(displayData.hrv_ms).toFixed(0) : "—"}
              unit="ms"
              color="bg-green-500/10 text-green-500"
              emptyValue={!displayData.hrv_ms}
              source={displayData.hrv_ms ? src : "indisponivel"}
              onClick={() => setDrawerMetric("hrv_ms")}
            />
            {displayData.avg_hr_bpm != null && displayData.avg_hr_bpm > 0 && (
              <MetricCard icon={Heart} label="BPM Diário" value={displayData.avg_hr_bpm} unit="bpm" color="bg-pink-500/10 text-pink-500" source={src} onClick={() => setDrawerMetric("avg_hr_bpm")} />
            )}
            {(displayData as any).exercise_minutes != null && (displayData as any).exercise_minutes > 0 && (
              <MetricCard icon={Timer} label="Exercício" value={(displayData as any).exercise_minutes} unit="min" color="bg-emerald-500/10 text-emerald-500" source={src} onClick={() => setDrawerMetric("exercise_minutes")} />
            )}
            {(displayData as any).distance_km != null && (displayData as any).distance_km > 0 && (
              <MetricCard icon={Route} label="Distância" value={Number((displayData as any).distance_km).toFixed(1)} unit="km" color="bg-cyan-500/10 text-cyan-500" source={src} onClick={() => setDrawerMetric("distance_km")} />
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sem dados para hoje ainda.</p>
        )}
      </div>

      {/* Saúde Cardiovascular */}
      {hasCardioData && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-red-500" />
            Saúde Cardiovascular
          </h3>
          <p className="text-[10px] text-muted-foreground mb-3">Sparkline 7d · Médias 7d e 21d</p>
          <div className="grid grid-cols-1 gap-3">
            {restingHrValues.length > 0 && (
              <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setDrawerMetric("resting_hr")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">FC Repouso</p>
                      <p className="text-lg font-bold">
                        {restingHrValues[0]} <span className="text-xs font-normal text-muted-foreground">bpm</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Média: {Math.round(restingHrValues.reduce((a, b) => a + b, 0) / restingHrValues.length)} bpm
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MiniSparkline data={[...restingHrValues].reverse()} color="hsl(0, 72%, 51%)" />
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {hrvValues.length > 0 && (
              <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setDrawerMetric("hrv_ms")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">VFC (HRV)</p>
                      <p className="text-lg font-bold">
                        {hrvValues[0].toFixed(0)} <span className="text-xs font-normal text-muted-foreground">ms</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Média: {Math.round(hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length)} ms
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MiniSparkline data={[...hrvValues].reverse()} color="hsl(142, 71%, 45%)" />
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {avgHrValues.length > 0 && (
              <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setDrawerMetric("avg_hr_bpm")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">BPM Diário</p>
                      <p className="text-lg font-bold">
                        {avgHrValues[0]} <span className="text-xs font-normal text-muted-foreground">bpm</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Média: {Math.round(avgHrValues.reduce((a, b) => a + b, 0) / avgHrValues.length)} bpm
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MiniSparkline data={[...avgHrValues].reverse()} color="hsl(330, 81%, 60%)" />
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Sleeping HR */}
            {sleepingHrValues.length > 0 && (
              <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setDrawerMetric("sleeping_hr")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">FC ao Dormir</p>
                      <p className="text-lg font-bold">
                        {sleepingHrValues[0]} <span className="text-xs font-normal text-muted-foreground">bpm</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Média: {Math.round(sleepingHrValues.reduce((a, b) => a + b, 0) / sleepingHrValues.length)} bpm
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MiniSparkline data={[...sleepingHrValues].reverse()} color="hsl(262, 83%, 58%)" />
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Sleeping HRV */}
            {sleepingHrvValues.length > 0 && (
              <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setDrawerMetric("sleeping_hrv")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">VFC ao Dormir</p>
                      <p className="text-lg font-bold">
                        {sleepingHrvValues[0].toFixed(0)} <span className="text-xs font-normal text-muted-foreground">ms</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Média: {Math.round(sleepingHrvValues.reduce((a, b) => a + b, 0) / sleepingHrvValues.length)} ms
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MiniSparkline data={[...sleepingHrvValues].reverse()} color="hsl(142, 50%, 55%)" />
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Min/Max HR */}
            {(minHrValues.length > 0 || maxHrValues.length > 0) && (
              <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setDrawerMetric("min_hr")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">MinMax BPM</p>
                      <p className="text-lg font-bold">
                        {minHrValues[0] ?? "—"} / {maxHrValues[0] ?? "—"} <span className="text-xs font-normal text-muted-foreground">bpm</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {minHrValues.length > 0 && `Min média: ${Math.round(minHrValues.reduce((a, b) => a + b, 0) / minHrValues.length)}`}
                        {minHrValues.length > 0 && maxHrValues.length > 0 && " · "}
                        {maxHrValues.length > 0 && `Max média: ${Math.round(maxHrValues.reduce((a, b) => a + b, 0) / maxHrValues.length)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {minHrValues.length > 1 && <MiniSparkline data={[...minHrValues].reverse()} color="hsl(200, 70%, 50%)" />}
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Sedentary HR */}
            {sedentaryHrValues.length > 0 && (
              <Card className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setDrawerMetric("sedentary_hr")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">BPM Sedentária</p>
                      <p className="text-lg font-bold">
                        {sedentaryHrValues[0]} <span className="text-xs font-normal text-muted-foreground">bpm</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Média: {Math.round(sedentaryHrValues.reduce((a, b) => a + b, 0) / sedentaryHrValues.length)} bpm
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MiniSparkline data={[...sedentaryHrValues].reverse()} color="hsl(30, 80%, 55%)" />
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ECG */}
      <EcgUploadCard />

      {/* Últimos 7 dias */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Últimos 7 dias</h3>
        <div className="space-y-2">
          {dailyData.map((day) => (
            <Card key={day.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {format(new Date(day.date + "T12:00:00"), "EEE, dd/MM", { locale: ptBR })}
                </span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{day.steps.toLocaleString("pt-BR")} passos</span>
                  <span>{formatSleep(day.sleep_minutes)}</span>
                  <span>{day.active_calories} kcal</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detail drawer */}
      <HealthMetricDetailDrawer
        open={drawerMetric !== null}
        onClose={() => setDrawerMetric(null)}
        metric={drawerMetric ?? "steps"}
        dailyData={dailyData}
      />
    </div>
  );
}
