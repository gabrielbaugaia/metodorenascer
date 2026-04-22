/**
 * Helpers para processar vídeos de Reels no client:
 * - Extrair frames do vídeo (para enviar à IA e gerar thumbnail)
 * - Remover trilha de áudio re-encodando via MediaRecorder + canvas
 */

export const REELS_ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const REELS_MAX_SIZE = 100 * 1024 * 1024; // 100MB

export interface VideoMeta {
  duration: number;
  width: number;
  height: number;
  isVertical: boolean;
}

/** Carrega vídeo num <video> e retorna metadata + objectURL */
export function loadVideoElement(file: File): Promise<{ video: HTMLVideoElement; url: string; meta: VideoMeta }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.onloadedmetadata = () => {
      const meta: VideoMeta = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        isVertical: video.videoHeight >= video.videoWidth,
      };
      resolve({ video, url, meta });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Falha ao carregar vídeo"));
    };
  });
}

/** Captura um frame numa posição específica (em segundos) e retorna base64 JPEG */
export function captureFrameAt(video: HTMLVideoElement, timeSec: number, maxWidth = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      try {
        const ratio = video.videoWidth > 0 ? maxWidth / video.videoWidth : 1;
        const w = Math.min(video.videoWidth, maxWidth);
        const h = Math.round(video.videoHeight * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas 2D indisponível"));
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        const base64 = dataUrl.split(",")[1] ?? "";
        video.removeEventListener("seeked", onSeeked);
        resolve(base64);
      } catch (err) {
        reject(err);
      }
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = Math.max(0, Math.min(timeSec, (video.duration || 0) - 0.05));
  });
}

/** Captura 3 frames (início/meio/fim) para análise IA */
export async function captureKeyFrames(file: File): Promise<{ frames: string[]; meta: VideoMeta }> {
  const { video, url, meta } = await loadVideoElement(file);
  try {
    const dur = isFinite(video.duration) ? video.duration : 1;
    const positions = [Math.min(0.5, dur * 0.1), dur * 0.5, Math.max(0, dur - 0.5)];
    const frames: string[] = [];
    for (const t of positions) {
      // eslint-disable-next-line no-await-in-loop
      frames.push(await captureFrameAt(video, t));
    }
    return { frames, meta };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Captura único frame para usar como thumbnail (Blob JPEG) */
export async function captureThumbnailBlob(file: File, timeSec = 0.2): Promise<Blob> {
  const { video, url } = await loadVideoElement(file);
  try {
    return await new Promise<Blob>((resolve, reject) => {
      const onSeeked = () => {
        const w = video.videoWidth;
        const h = video.videoHeight;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas 2D indisponível"));
        ctx.drawImage(video, 0, 0, w, h);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar thumbnail"))),
          "image/jpeg",
          0.85
        );
      };
      video.addEventListener("seeked", onSeeked, { once: true });
      video.currentTime = Math.min(timeSec, (video.duration || 0) - 0.05);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Remove a trilha de áudio do vídeo regravando-o via MediaRecorder a partir do <video> + canvas.
 * Retorna um novo Blob webm sem áudio. Em caso de falha (browser sem suporte), retorna null.
 */
export async function stripAudio(file: File): Promise<Blob | null> {
  if (typeof MediaRecorder === "undefined") return null;

  const { video, url, meta } = await loadVideoElement(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = meta.width;
    canvas.height = meta.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // captura stream sem áudio
    const stream = (canvas as HTMLCanvasElement).captureStream(30);

    const mimeCandidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
    if (!mimeType) return null;

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const done = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      recorder.onerror = (e) => reject(e);
    });

    video.muted = true;
    video.currentTime = 0;
    await video.play();
    recorder.start();

    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      try {
        recorder.stop();
      } catch {
        /* noop */
      }
      try {
        video.pause();
      } catch {
        /* noop */
      }
    };

    video.onended = stop;

    // loop de cópia para canvas
    const draw = () => {
      if (video.paused || video.ended) {
        stop();
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(draw);
    };
    draw();

    // safety timeout: duração + 2s
    const safety = setTimeout(stop, ((meta.duration || 30) + 2) * 1000);
    const blob = await done;
    clearTimeout(safety);
    return blob;
  } catch (err) {
    console.error("stripAudio error:", err);
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
