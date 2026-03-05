import { useState } from "react";
import { Dumbbell, Heart, Brain, CalendarCheck, Apple, ChevronRight, Info, Lightbulb, AlertTriangle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import type { SisScoreRow } from "@/lib/sisScoreCalc";

interface SubScore {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  key: string;
}

interface PillarInfo {
  description: string;
  howToImprove: string;
  whyFill: string;
  dataKey: string;
}

const PILLAR_INFO: Record<string, PillarInfo> = {
  treino: {
    description: "Mede o volume e a intensidade dos seus treinos registrados. Quanto mais consistente e progressivo for o seu treino, maior será este score.",
    howToImprove: "Registre séries, repetições e RPE após cada treino. Treine com progressão de carga ao longo das semanas.",
    whyFill: "Sem registros de treino, o sistema não consegue avaliar sua evolução mecânica. Dados vazios = score baixo automaticamente.",
    dataKey: "mechanical_score",
  },
  recuperacao: {
    description: "Avalia a qualidade do seu sono e o nível de estresse reportado. Um corpo bem descansado performa melhor e se recupera mais rápido.",
    howToImprove: "Registre suas horas de sono e nível de estresse todos os dias. Priorize 7-9h de sono por noite.",
    whyFill: "A recuperação é invisível mas essencial. Sem esses dados, o sistema não pode alertar quando você precisa desacelerar.",
    dataKey: "recovery_score",
  },
  cognitivo: {
    description: "Mede sua clareza mental, foco e disposição geral. O pilar cognitivo conecta corpo e mente na sua jornada de transformação.",
    howToImprove: "Faça o check-in cognitivo de 1 minuto diariamente. É rápido e faz toda a diferença no seu score.",
    whyFill: "Sua mente é o motor de tudo. Sem o check-in cognitivo, perdemos a visão completa da sua performance.",
    dataKey: "cognitive_score",
  },
  consistencia: {
    description: "Mede a frequência com que você registra dados na plataforma. Não é sobre treinar todo dia, mas sobre manter o hábito de registrar.",
    howToImprove: "Registre dados todos os dias, mesmo nos dias de descanso. Horas de sono, estresse e alimentação contam!",
    whyFill: "Consistência gera dados. Dados geram insights. Insights geram resultados. É um ciclo virtuoso.",
    dataKey: "consistency_score",
  },
  nutricao: {
    description: "Avalia a adesão ao plano alimentar e a frequência de registro das suas refeições no Diário Nutricional.",
    howToImprove: "Registre suas refeições no Diário Nutricional. Foque em manter a consistência, não a perfeição.",
    whyFill: "A nutrição é responsável por grande parte dos seus resultados. Sem registros, não podemos ajustar seu plano.",
    dataKey: "nutrition_score",
  },
};

interface SisSubScoreCardsProps {
  mechanical: number | null;
  recovery: number | null;
  cognitive: number | null;
  consistency: number | null;
  nutrition: number | null;
  scores30dFull?: SisScoreRow[];
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="w-full h-1.5 rounded-full bg-muted mt-1">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function PillarDetailDrawer({
  open,
  onClose,
  card,
  pillarInfo,
  chartData,
}: {
  open: boolean;
  onClose: () => void;
  card: SubScore;
  pillarInfo: PillarInfo;
  chartData: { value: number }[];
}) {
  const scoreColor = card.value !== null
    ? card.value >= 70 ? "text-green-400" : card.value >= 50 ? "text-yellow-400" : "text-red-400"
    : "text-muted-foreground";

  return (
    <Drawer open={open} onOpenChange={v => !v && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">{card.icon}</div>
            <div>
              <DrawerTitle className="text-base">{card.label}</DrawerTitle>
              <DrawerDescription className="text-xs">Pilar do Shape Intelligence Score™</DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4 overflow-y-auto">
          {/* Current score */}
          <div className="text-center py-3">
            <p className={`text-5xl font-bold ${scoreColor}`}>
              {card.value !== null ? Math.round(card.value) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Score atual</p>
          </div>

          {/* Mini chart */}
          {chartData.length >= 2 && (
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Últimos 30 dias</p>
              <div className="h-[80px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <YAxis domain={[0, 100]} hide />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* What it measures */}
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground">
              <Info className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold">O que este número significa</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{pillarInfo.description}</p>
          </div>

          {/* How to improve */}
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              <h4 className="text-sm font-semibold">Como melhorar</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{pillarInfo.howToImprove}</p>
          </div>

          {/* Why fill data */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold">Por que preencher?</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{pillarInfo.whyFill}</p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function SisSubScoreCards({ mechanical, recovery, cognitive, consistency, nutrition, scores30dFull = [] }: SisSubScoreCardsProps) {
  const [openPillar, setOpenPillar] = useState<string | null>(null);

  const cards: SubScore[] = [
    { label: "Treino", value: mechanical, icon: <Dumbbell className="h-4 w-4" />, key: "treino" },
    { label: "Recuperação", value: recovery, icon: <Heart className="h-4 w-4" />, key: "recuperacao" },
    { label: "Cognitivo", value: cognitive, icon: <Brain className="h-4 w-4" />, key: "cognitivo" },
    { label: "Consistência", value: consistency, icon: <CalendarCheck className="h-4 w-4" />, key: "consistencia" },
    { label: "Nutrição", value: nutrition, icon: <Apple className="h-4 w-4" />, key: "nutricao" },
  ];

  const getChartData = (key: string) => {
    const info = PILLAR_INFO[key];
    if (!info) return [];
    return scores30dFull
      .map(row => ({ value: (row as any)[info.dataKey] as number | null }))
      .filter(d => d.value !== null) as { value: number }[];
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(card => (
          <button
            key={card.key}
            onClick={() => setOpenPillar(card.key)}
            className="rounded-xl border border-border/50 bg-card p-3 space-y-1 text-left transition-colors hover:border-primary/30 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                {card.icon}
                <span className="text-[11px] font-medium uppercase tracking-wider">{card.label}</span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-bold text-foreground">
              {card.value !== null ? Math.round(card.value) : "—"}
            </p>
            {card.value !== null && <ScoreBar value={card.value} />}
          </button>
        ))}
      </div>

      {cards.map(card => (
        <PillarDetailDrawer
          key={card.key}
          open={openPillar === card.key}
          onClose={() => setOpenPillar(null)}
          card={card}
          pillarInfo={PILLAR_INFO[card.key]}
          chartData={getChartData(card.key)}
        />
      ))}
    </>
  );
}
