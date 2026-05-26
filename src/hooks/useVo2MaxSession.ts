import { useCallback, useEffect, useRef, useState } from "react";

export type SessionStatus = "idle" | "running" | "paused" | "finished";

interface Options {
  /** Storage key para persistência entre reloads */
  storageKey: string;
  /** Modo regressivo: define duração total em segundos (Cooper = 720). Se undefined, conta progressivo. */
  countdownSeconds?: number;
  /** Callback chamado a cada tick (1s) */
  onTick?: (elapsedSec: number) => void;
}

interface Persisted {
  status: SessionStatus;
  startedAt: number; // epoch ms da última retomada
  accumulated: number; // segundos acumulados antes da retomada atual
  pauses: number;
}

export function useVo2MaxSession(opts: Options) {
  const { storageKey, countdownSeconds, onTick } = opts;

  const [status, setStatus] = useState<SessionStatus>("idle");
  const [elapsed, setElapsed] = useState(0); // segundos
  const [pauses, setPauses] = useState(0);

  const startedAtRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Restaura sessão se existir
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const p: Persisted = JSON.parse(raw);
      if (p.status === "running" || p.status === "paused") {
        accumulatedRef.current = p.accumulated;
        setPauses(p.pauses);
        if (p.status === "running") {
          startedAtRef.current = Date.now();
          setStatus("running");
        } else {
          setElapsed(p.accumulated);
          setStatus("paused");
        }
      }
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(
    (next: Partial<Persisted>) => {
      try {
        const current: Persisted = {
          status,
          startedAt: startedAtRef.current || 0,
          accumulated: accumulatedRef.current,
          pauses,
          ...next,
        };
        localStorage.setItem(storageKey, JSON.stringify(current));
      } catch {
        /* noop */
      }
    },
    [storageKey, status, pauses]
  );

  // Loop
  useEffect(() => {
    if (status !== "running") return;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const live = startedAtRef.current ? (Date.now() - startedAtRef.current) / 1000 : 0;
      const total = accumulatedRef.current + live;
      setElapsed(total);
      onTick?.(total);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, onTick]);

  // Persiste a cada 5s enquanto rodando
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => {
      persist({ status: "running" });
    }, 5000);
    return () => clearInterval(id);
  }, [status, persist]);

  // Auto-finaliza no countdown
  useEffect(() => {
    if (countdownSeconds && status === "running" && elapsed >= countdownSeconds) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, countdownSeconds, status]);

  const start = useCallback(() => {
    accumulatedRef.current = 0;
    startedAtRef.current = Date.now();
    setElapsed(0);
    setPauses(0);
    setStatus("running");
    persist({ status: "running", startedAt: Date.now(), accumulated: 0, pauses: 0 });
  }, [persist]);

  const pause = useCallback(() => {
    if (status !== "running") return;
    const live = startedAtRef.current ? (Date.now() - startedAtRef.current) / 1000 : 0;
    accumulatedRef.current += live;
    startedAtRef.current = null;
    setPauses((n) => n + 1);
    setStatus("paused");
    persist({ status: "paused", accumulated: accumulatedRef.current, pauses: pauses + 1 });
  }, [status, persist, pauses]);

  const resume = useCallback(() => {
    if (status !== "paused") return;
    startedAtRef.current = Date.now();
    setStatus("running");
    persist({ status: "running", startedAt: Date.now() });
  }, [status, persist]);

  const finish = useCallback(() => {
    const live = startedAtRef.current ? (Date.now() - startedAtRef.current) / 1000 : 0;
    const total = accumulatedRef.current + live;
    accumulatedRef.current = total;
    startedAtRef.current = null;
    setElapsed(total);
    setStatus("finished");
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* noop */
    }
    return total;
  }, [storageKey]);

  const reset = useCallback(() => {
    accumulatedRef.current = 0;
    startedAtRef.current = null;
    setElapsed(0);
    setPauses(0);
    setStatus("idle");
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* noop */
    }
  }, [storageKey]);

  const remaining = countdownSeconds ? Math.max(0, countdownSeconds - elapsed) : 0;

  return {
    status,
    elapsed,
    remaining,
    pauses,
    start,
    pause,
    resume,
    finish,
    reset,
  };
}
