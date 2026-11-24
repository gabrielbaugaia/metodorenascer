import { useEffect } from "react";

/** Mantém a tela acesa enquanto `active` for true (Screen Wake Lock API, iOS 16.4+). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: any = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await (navigator as any).wakeLock.request("screen");
      } catch {
        /* sem suporte ou negado */
      }
      if (cancelled && lock) lock.release().catch(() => {});
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && !cancelled) request();
    };
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release?.().catch(() => {});
    };
  }, [active]);
}
