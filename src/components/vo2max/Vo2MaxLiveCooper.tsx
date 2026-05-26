import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, Flame, ArrowLeft, Zap, AlertCircle, Timer } from "lucide-react";
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

const TOTAL = 720; // 12min
const MARKS = [180, 360, 540, 690]; // 3min, 6min, 9min, faltam 30s

const MILESTONE_TEXT: Record<number, string> = {
  180: "¼ feito! Mantém o ritmo.",
  360: "Metade! Você está indo bem.",
  540: "Reta final — não desacelera.",
  690: "Últimos 30 segundos — TUDO!",
};

interface Props {
  onFinish: (r: { distance_estimated?: number; pausas: number }) => void;
  onBack: () => void;
}

export function Vo2MaxLiveCooper({ onFinish, onBack }: Props) {
  const session = useVo2MaxSession({
    storageKey: "vo2max:cooper:live",
    countdownSeconds: TOTAL,
  });
  const [milestone, setMilestone] = useState<string | null>(null);
  const triggeredRef = useRef<Set<number>>(new Set());

  const elapsed = session.elapsed;
  const remaining = session.remaining;
  const pct = Math.min(100, (elapsed / TOTAL) * 100);

  // Marcos
  useEffect(() => {
    if (session.status !== "running") return;
    for (const m of MARKS) {
      if (elapsed >= m && !triggeredRef.current.has(m)) {
        triggeredRef.current.add(m);
        beepDouble();
        vibrate([150, 80, 150]);
        setMilestone(MILESTONE_TEXT[m]);
        setTimeout(() => setMilestone(null), 4000);
      }
    }
  }, [elapsed, session.status]);

  // Auto-finalizou (countdown chegou a 0)
  useEffect(() => {
    if (session.status === "finished") {
      beepFinish();
      vibrate([300, 150, 300, 150, 500]);
      onFinish({ pausas: session.pauses });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.status]);

  useEffect(() => {
    if (session.status === "running") requestWakeLock();
    else releaseWakeLock();
    return () => {
      releaseWakeLock();
    };
  }, [session.status]);

  const xp = Math.floor(elapsed / 4);

  const handleStart = () => {
    beep(660, 120);
    vibrate(80);
    triggeredRef.current.clear();
    session.start();
  };

  const handleStopEarly = () => {
    const total = session.finish();
    if (total < TOTAL) {
      beep(440, 200);
    }
    onFinish({ pausas: session.pauses });
  };

  if (session.status === "idle") {
    return (
      <Card className="p-6 space-y-5 text-center">
        <Flame className="h-12 w-12 mx-auto text-primary" />
        <div className="space-y-2">
          <h3 className="text-xl font-bold">12 minutos. Sua melhor distância.</h3>
          <p className="text-sm text-muted-foreground">
            O app cronometra os 12 minutos. Você corre o máximo que aguentar.
            <br />
            Ao final ou se parar antes, registramos a distância percorrida.
          </p>
        </div>

        {!isWakeLockSupported() && (
          <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-left">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Mantenha a tela ativa durante o teste.</span>
          </div>
        )}

        <Button size="lg" className="w-full h-14 text-base" onClick={handleStart}>
          <Play className="h-5 w-5 mr-2" /> Iniciar 12 min
        </Button>
        <Button variant="ghost" className="w-full" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-5">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-[2px] text-muted-foreground">
          <Timer className="h-3 w-3" /> Tempo restante
        </div>
        <p className="text-7xl font-mono font-black tabular-nums text-primary">
          {formatClock(remaining)}
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

      <Progress value={pct} className="h-3" />

      {milestone && (
        <div className="rounded-lg bg-primary/15 border border-primary/40 p-3 text-center animate-scale-in">
          <p className="text-sm font-semibold text-primary">{milestone}</p>
        </div>
      )}

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
        <Button size="lg" variant="destructive" onClick={handleStopEarly}>
          <Square className="h-4 w-4 mr-2" /> Parei aqui
        </Button>
      </div>
    </Card>
  );
}
