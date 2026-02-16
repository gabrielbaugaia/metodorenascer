import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface HealthReadinessTabProps {
  score: number;
  recommendation: string;
  hasData: boolean;
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "text-green-500" :
    score >= 60 ? "text-yellow-500" :
    score >= 40 ? "text-orange-500" :
    "text-red-500";

  const strokeColor =
    score >= 80 ? "#22c55e" :
    score >= 60 ? "#eab308" :
    score >= 40 ? "#f97316" :
    "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-40 h-40 mx-auto">
      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={strokeColor} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export function HealthReadinessTab({ score, recommendation, hasData }: HealthReadinessTabProps) {
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <Activity className="h-12 w-12 text-muted-foreground/50" />
        <div>
          <p className="font-medium">Sem dados para calcular</p>
          <p className="text-sm text-muted-foreground">Sincronize seu relógio para ver o score</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-base">Score de Prontidão</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-6">
          <ScoreCircle score={score} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recomendação do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-primary">{recommendation}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Baseado nos seus dados dos últimos 7 dias
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
