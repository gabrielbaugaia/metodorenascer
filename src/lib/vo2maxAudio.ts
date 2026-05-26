// Helpers de áudio, vibração e wake lock para o teste ao vivo de VO2 Máx.
// Sem dependências externas; tudo via Web APIs nativas.

let _ctx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  try {
    const C = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    _ctx = new C();
    return _ctx;
  } catch {
    return null;
  }
}

/** Toca um beep curto. Chamar de dentro de um handler de clique do usuário ao menos 1x antes pra liberar áudio. */
export function beep(freq = 880, durationMs = 180, volume = 0.25) {
  const c = ctx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + durationMs / 1000);
    osc.stop(c.currentTime + durationMs / 1000);
  } catch {
    /* noop */
  }
}

/** Beep duplo — usar para virada de estágio. */
export function beepDouble() {
  beep(880, 150);
  setTimeout(() => beep(1175, 200), 200);
}

/** Beep triplo crescente — usar no fim do teste. */
export function beepFinish() {
  beep(660, 150);
  setTimeout(() => beep(880, 150), 200);
  setTimeout(() => beep(1320, 350), 400);
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined") return;
  try {
    (navigator as any).vibrate?.(pattern);
  } catch {
    /* noop */
  }
}

let _wake: any = null;
export async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      _wake = await (navigator as any).wakeLock.request("screen");
    }
  } catch {
    /* noop — fallback será aviso visual */
  }
}
export async function releaseWakeLock() {
  try {
    await _wake?.release?.();
    _wake = null;
  } catch {
    /* noop */
  }
}

export function isWakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

/** Formata segundos em mm:ss */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
