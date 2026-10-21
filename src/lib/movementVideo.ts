/** Capture a chronological sample; originals remain untouched in private storage. */
export async function sampleMovementVideo(url: string): Promise<{ image: string; second: number }[]> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  const wait = (event: string) => new Promise<void>((resolve, reject) => {
    video.addEventListener(event, () => resolve(), { once: true });
    video.addEventListener("error", () => reject(new Error("Vídeo incompatível. Envie MP4/H.264 ou fotos do movimento.")), { once: true });
  });
  let objectUrl: string | undefined;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Não foi possível abrir o vídeo privado. Atualize a página e tente novamente.");
    objectUrl = URL.createObjectURL(await response.blob());
    const loaded = wait("loadedmetadata");
    video.src = objectUrl;
    video.load();
    await loaded;
    if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error("Vídeo sem duração válida.");
    const canvas = document.createElement("canvas");
    const ratio = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * ratio));
    canvas.height = Math.max(1, Math.round(video.videoHeight * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível ler o vídeo.");
    const frames = [];
    for (let i = 0; i < 5; i++) {
      const second = Math.min(video.duration - 0.01, video.duration * (i + 0.5) / 5);
      const seeked = wait("seeked");
      video.currentTime = Math.max(0.001, second);
      await seeked;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push({ image: canvas.toDataURL("image/jpeg", 0.8), second: Math.round(second * 100) / 100 });
    }
    return frames;
  } finally {
    video.removeAttribute("src");
    video.load();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}