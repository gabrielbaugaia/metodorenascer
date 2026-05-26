import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, RotateCcw, Flame, ArrowLeft, Zap, AlertCircle } from "lucide-react";
import { useVo2MaxSession } from "@/hooks/useVo2MaxSession";
import {
  beep,
  beepDouble,
  beepFinish,
  formatClock,
  isWakeLockSupported,
  releaseWakeLock,
  requestWakeLock,
  vibrate,
} from "@/lib/vo2maxAudio";
import { cn } from "@/lib/utils";

export interface BruceLiveResult {
  total_minutes: number;
  estagio_max: number;
  pausas: number;
}

interface Props {
  onFinish: (r: BruceLiveResult) => void;
  onBack: () => void;
}

const STAGES = [
  { e: 1, v: 2.7, i: 10 },
  { e: 2, v: 4.0, i: 12 },
  { e: 3, v: 5.5, i: 14 },
  { e: 4, v: 6.8, i: 16 },
  { e: 5, v: 8.0, i: 18 },
  { e: 6, v: 8.9, i: 20 },
  { e: 7, v: 9.7, i: 22 },
];

const STAGE_DURATION = 180; // 3 minutos

const MOTIVATION = [
  "Respira fundo, você consegue.",
  "Foco no ritmo, não no relógio.",
  "Cada segundo é evolução.",
  "Aguenta firme — quase no próximo estágio!",
  "Você é mais forte do que pensa.",
];

export function Vo2MaxLiveBruce({ onFinish, onBack }: Props) {
  const session = useVo2MaxSession({ storageKey: "vo2max:bruce:live" });
  const [pulseKey, setPulseKey] = useState(0);
  const lastStageRef = useRef<number>(0);

  const elapsed = session.elapsed;
  const stageIndex = Math.min(STAGES.length - 1, Math.floor(elapsed / STAGE_DURATION));
  const stage = STAGES[stageIndex];
  const next = STAGES[stageIndex + 1];
  const elapsedInStage = elapsed - stageIndex * STAGE_DURATION;
  const stagePct = Math.min(100, (elapsedInStage / STAGE_DURATION) * 100);
  const motivation = useMemo(
    () => MOTIVATION[stageIndex % MOTIVATION.length],
    [stageIndex]
  );

  // Detecta virada de estágio → feedback
  useEffect(() => {
    if (session.status !== "running") return;
    if (stage.e !== lastStageRef.current && lastStageRef.current !== 0) {
      beepDouble();
      vibrate([200, 100, 200]);
      setPulseKey((k) => k + 1);
    }
    lastStageRef.current = stage.e;
  }, [stage.e, session.status]);

  // Wake lock + cleanup
  useEffect(() => {
    if (session.status === "running") requestWakeLock();
    else releaseWakeLock();
    return () => {
      releaseWakeLock();
    };
  }, [session.status]);

  const xp = Math.floor(elapsed / 6) + stageIndex * 50;

  const handleStart = () => {
    beep(660, 120);
    vibrate(80);
    lastStageRef.current = 1;
    session.start();
  };

  const handleFinish = () => {
    const total = session.finish();
    beepFinish();
    vibrate([300, 150, 300, 150, 500]);
    onFinish({
      total_minutes: total / 60,
      estagio_max: stage.e,
      pausas: session.pauses,
    });
  };

  // ---------- IDLE ----------
  if (session.status === "idle") {
    return (
      <Card className="p-6 space-y-5 text-center">
        <div className="space-y-2">
          <Flame className="h-12 w-12 mx-auto text-primary" />
          <h3 className="text-xl font-bold">Pronto para começar?</h3>
          <p className="text-sm text-muted-foreground">
            O app cronometra e avisa cada virada de estágio.
            <br />
            Posicione-se na esteira, ajuste a primeira velocidade (
            <strong>2.7 km/h · 10%</strong>) e toque em <strong>Iniciar</strong> ao
            começar a andar.
          </p>
        </div>

        {!isWakeLockSupported() && (
          <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-left">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Seu navegador pode apagar a tela durante o teste. Mantenha o app aberto
              ou prenda a tela ativa nas configurações do celular.
            </span>
          </div>
        )}

        <Button size="lg" className="w-full h-14 text-base" onClick={handleStart}>
          <Play className="h-5 w-5 mr-2" /> Iniciar Teste
        </Button>
        <Button variant="ghost" className="w-full" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
      </Card>
    );
  }

  // ---------- RUNNING / PAUSED ----------
  return (
    <Card className="p-5 space-y-5 overflow-hidden">
      {/* Banner do estágio */}
      <div
        key={pulseKey}
        className={cn(
          "rounded-xl bg-primary/10 border border-primary/40 p-4 text-center",
          "animate-scale-in"
        )}
      >
        <p className="text-[10px] uppercase tracking-[2px] text-primary/70 font-semibold">
          Estágio Atual
        </p>
        <p className="text-4xl font-black text-primary mt-1">
          {stage.e}
        </p>
        <p className="text-sm font-medium text-foreground mt-1">
          {stage.v.toFixed(1)} km/h · inclinação {stage.i}%
        </p>
      </div>

      {/* Cronômetro */}
      <div className="text-center space-y-2">
        <p className="text-[10px] uppercase tracking-[2px] text-muted-foreground">
          Tempo Total
        </p>
        <p className="text-6xl font-mono font-bold tabular-nums">
          {formatClock(elapsed)}
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            <Zap className="h-3 w-3 mr-1" /> {xp} XP
          </Badge>
          {session.pauses > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {session.pauses} pausa{session.pauses > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Progresso estágio atual */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Progresso do estágio {stage.e}</span>
          <span className="tabular-nums">
            {formatClock(elapsedInStage)} / 03:00
          </span>
        </div>
        <Progress value={stagePct} className="h-2" />
      </div>

      {/* Próximo estágio */}
      {next && (
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Próximo estágio
          </p>
          <p className="text-sm font-medium mt-0.5">
            {next.v.toFixed(1)} km/h · {next.i}%
          </p>
        </div>
      )}

      <p className="text-xs text-center italic text-muted-foreground">"{motivation}"</p>

      {/* Controles */}
      <div className="grid grid-cols-2 gap-2">
        {session.status === "running" ? (
          <Button variant="outline" size="lg" onClick={session.pause}>
            <Pause className="h-4 w-4 mr-2" /> Pausar
          </Button>
        ) : (
          <Button variant="outline" size="lg" onClick={session.resume}>
            <Play className="h-4 w-4 mr-2" /> Retomar
          </Button>
        )}
        <Button
          size="lg"
          variant="destructive"
          onClick={handleFinish}
          className="font-semibold"
        >
          <Square className="h-4 w-4 mr-2" /> Finalizar
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-muted-foreground"
        onClick={() => {
          if (confirm("Descartar este teste em andamento?")) {
            session.reset();
            onBack();
          }
        }}
      >
        <RotateCcw className="h-3 w-3 mr-1" /> Descartar e voltar
      </Button>
    </Card>
  );
}
