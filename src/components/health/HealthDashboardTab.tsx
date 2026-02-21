import { Footprints, Flame, Moon, HeartPulse, Activity, Watch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { HealthDaily } from "@/hooks/useHealthData";

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

function MetricCard({ icon: Icon, label, value, unit, color, source, subtitle, emptyValue }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  source?: SourceType;
  subtitle?: string;
  emptyValue?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">
            {emptyValue ? "—" : value}
            {!emptyValue && unit && <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>}
          </p>
          {source && <SourceBadge source={source} subtitle={subtitle} />}
        </div>
      </CardContent>
    </Card>
  );
}

export function HealthDashboardTab({ todayData, dailyData, formatSleep, onConnectClick }: HealthDashboardTabProps) {
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

  const src = resolveSource(todayData?.source);
  const isAuto = src === "auto";

  const stepsEmpty = !isAuto && (todayData?.steps === 0 || !todayData?.steps);
  const calEmpty = !isAuto && (todayData?.active_calories === 0 || !todayData?.active_calories);
  const sleepVal = todayData?.sleep_minutes ?? 0;
  const sleepSrc = sleepVal > 0 ? src : "indisponivel";

  return (
    <div className="space-y-6">
      {/* Cards do dia */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Hoje</h3>
        {todayData ? (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={Footprints}
              label="Passos"
              value={todayData.steps.toLocaleString("pt-BR")}
              color="bg-blue-500/10 text-blue-500"
              emptyValue={stepsEmpty}
              source={stepsEmpty ? "indisponivel" : src}
              subtitle={stepsEmpty ? "Fonte: indisponível" : undefined}
            />
            <MetricCard
              icon={Flame}
              label="Calorias Ativas"
              value={todayData.active_calories}
              unit="kcal"
              color="bg-orange-500/10 text-orange-500"
              emptyValue={calEmpty}
              source={calEmpty ? "indisponivel" : src}
              subtitle={calEmpty ? "Estimativa disponível após registrar treinos ou conectar dispositivo" : undefined}
            />
            <MetricCard
              icon={Moon}
              label="Sono"
              value={formatSleep(sleepVal)}
              color="bg-indigo-500/10 text-indigo-500"
              emptyValue={sleepVal === 0}
              source={sleepSrc}
            />
            {todayData.resting_hr && (
              <MetricCard icon={HeartPulse} label="FC Repouso" value={todayData.resting_hr} unit="bpm" color="bg-red-500/10 text-red-500" source={src} />
            )}
            {todayData.hrv_ms && (
              <MetricCard icon={Activity} label="HRV" value={Number(todayData.hrv_ms).toFixed(0)} unit="ms" color="bg-green-500/10 text-green-500" source={src} />
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sem dados para hoje ainda.</p>
        )}
      </div>

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
    </div>
  );
}
