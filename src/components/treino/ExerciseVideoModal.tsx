import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Dumbbell, ExternalLink, Loader2, RotateCcw } from "lucide-react";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  videoUrl?: string;
  tips?: string;
}

interface ExerciseVideoModalProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function normalizeUrl(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("www.")) return `https://${trimmed}`;
  if (trimmed.startsWith("youtube.com") || trimmed.startsWith("youtu.be")) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

function extractYoutubeId(rawUrl: string): string | null {
  const normalized = normalizeUrl(rawUrl);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./, "");

    // youtube.com
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      // /watch?v=
      const v = url.searchParams.get("v");
      if (v) return v;

      // /shorts/{id}
      const shortsMatch = url.pathname.match(/^\/shorts\/([^/?#]+)/);
      if (shortsMatch?.[1]) return shortsMatch[1];

      // /embed/{id}
      const embedMatch = url.pathname.match(/^\/embed\/([^/?#]+)/);
      if (embedMatch?.[1]) return embedMatch[1];

      return null;
    }

    // youtu.be/{id}
    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "").split("/")[0];
      if (id) return id;
      return null;
    }

    return null;
  } catch {
    return null;
  }
}

function toYoutubeEmbedUrl(rawUrl: string): string | null {
  const videoId = extractYoutubeId(rawUrl);
  if (!videoId) return null;
  // Add playsinline=1 for better mobile compatibility
  return `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0`;
}

function toYoutubeWatchUrl(rawUrl: string): string | null {
  const videoId = extractYoutubeId(rawUrl);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function ExerciseVideoModal({
  exercise,
  open,
  onOpenChange,
}: ExerciseVideoModalProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const currentUrl = resolvedUrl ?? exercise?.videoUrl ?? "";
  const embedUrl = useMemo(() => toYoutubeEmbedUrl(currentUrl), [currentUrl]);
  const watchUrl = useMemo(() => toYoutubeWatchUrl(currentUrl), [currentUrl]);

  useEffect(() => {
    if (!open || !exercise) return;

    // Reset when opening/changing exercise
    setResolvedUrl(null);
    setResolving(false);
  }, [open, exercise?.name]);

  useEffect(() => {
    const resolveFromDatabase = async () => {
      if (!open || !exercise) return;

      const alreadyValid = Boolean(extractYoutubeId(exercise.videoUrl ?? ""));
      if (alreadyValid) return;

      setResolving(true);
      try {
        const name = exercise.name?.trim();
        if (!name) return;

        // Try exact match first
        const exactResult = await supabase
          .from("exercise_videos")
          .select("video_url")
          .ilike("exercise_name", name)
          .limit(1);

        if (exactResult.error) {
          console.error("Erro ao buscar vídeo do exercício:", exactResult.error);
          return;
        }

        let videoUrl: string | null = exactResult.data?.[0]?.video_url ?? null;

        // If no exact match, try partial match with first significant words
        if (!videoUrl) {
          const words = name
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 2);
          const searchPattern = words.slice(0, 2).join("%");

          if (searchPattern) {
            const partialResult = await supabase
              .from("exercise_videos")
              .select("video_url")
              .ilike("exercise_name", `%${searchPattern}%`)
              .limit(1);

            if (partialResult.error) {
              console.error("Erro ao buscar vídeo do exercício:", partialResult.error);
              return;
            }

            videoUrl = partialResult.data?.[0]?.video_url ?? null;
          }
        }

        if (videoUrl) setResolvedUrl(videoUrl);
      } finally {
        setResolving(false);
      }
    };

    resolveFromDatabase();
  }, [open, exercise]);

  const handleOpenInYoutube = () => {
    if (watchUrl) {
      window.open(watchUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-xl pr-6">
            <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            <span className="uppercase">{exercise.name}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Vídeo demonstrativo do exercício {exercise.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video - on mobile, always show button first for better UX */}
          {watchUrl ? (
            <>
              {/* Mobile: Show prominent button to open in YouTube app */}
              <div className="sm:hidden">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted flex flex-col items-center justify-center gap-4 p-4">
                  {resolving ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Buscando vídeo...
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 ml-1">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <p className="text-muted-foreground text-center text-sm">
                        Toque para assistir ao vídeo
                      </p>
                      <Button onClick={handleOpenInYoutube} size="lg" className="gap-2 bg-red-600 hover:bg-red-700">
                        <ExternalLink className="w-4 h-4" />
                        Abrir no YouTube
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Desktop: Show embedded iframe */}
              <div className="hidden sm:block">
                {embedUrl ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                    <iframe
                      src={embedUrl}
                      title={exercise.name}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                    {resolving ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Buscando vídeo...
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Vídeo demonstrativo em breve</p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              {resolving ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando vídeo...
                </div>
              ) : (
                <p className="text-muted-foreground">Vídeo demonstrativo em breve</p>
              )}
            </div>
          )}

          {/* Exercise info */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              {exercise.sets} séries
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
              <Dumbbell className="w-3.5 h-3.5" />
              {exercise.reps} reps
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
              <Clock className="w-3.5 h-3.5" />
              {exercise.rest} descanso
            </Badge>
          </div>

          {/* Tips */}
          {exercise.tips && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-medium text-primary mb-1">Dica do Coach</p>
              <p className="text-sm text-muted-foreground">{exercise.tips}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
