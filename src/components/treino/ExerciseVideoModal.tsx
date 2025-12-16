import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Dumbbell, Loader2, RotateCcw } from "lucide-react";

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

    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;

      const shortsMatch = url.pathname.match(/^\/shorts\/([^/?#]+)/);
      if (shortsMatch?.[1]) return shortsMatch[1];

      const embedMatch = url.pathname.match(/^\/embed\/([^/?#]+)/);
      if (embedMatch?.[1]) return embedMatch[1];

      return null;
    }

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
  return `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0`;
}

function toYoutubeWatchUrl(rawUrl: string): string | null {
  const videoId = extractYoutubeId(rawUrl);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

// Normalize for comparison
function normalizeForSearch(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
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

  // Reset state when modal opens/closes or exercise changes
  useEffect(() => {
    if (!open || !exercise) return;
    setResolvedUrl(null);
    setResolving(false);
  }, [open, exercise?.name]);

  // Search local database for video
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
          console.error("Erro ao buscar vídeo:", exactResult.error);
          return;
        }

        let videoUrl: string | null = exactResult.data?.[0]?.video_url ?? null;

        // Try partial match if no exact match
        if (!videoUrl) {
          const normalizedName = normalizeForSearch(name);
          const words = normalizedName.split(/\s+/).filter((w) => w.length > 2);
          
          // Try with first two keywords
          if (words.length >= 2) {
            const searchPattern = words.slice(0, 2).join("%");
            const partialResult = await supabase
              .from("exercise_videos")
              .select("video_url")
              .ilike("exercise_name", `%${searchPattern}%`)
              .limit(1);

            if (!partialResult.error) {
              videoUrl = partialResult.data?.[0]?.video_url ?? null;
            }
          }
          
          // Try with first keyword only
          if (!videoUrl && words.length >= 1) {
            const partialResult = await supabase
              .from("exercise_videos")
              .select("video_url")
              .ilike("exercise_name", `%${words[0]}%`)
              .limit(1);

            if (!partialResult.error) {
              videoUrl = partialResult.data?.[0]?.video_url ?? null;
            }
          }
        }

        if (videoUrl) setResolvedUrl(videoUrl);
      } finally {
        setResolving(false);
      }
    };

    resolveFromDatabase();
  }, [open, exercise]);

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
            Demonstração do exercício {exercise.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loading state */}
          {resolving && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                Carregando demonstração...
              </div>
            </div>
          )}

          {/* YouTube Video - Inline (Desktop + Mobile) */}
          {!resolving && embedUrl && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
              <iframe
                src={embedUrl}
                title={exercise.name}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}

          {/* No media available */}
          {!resolving && !embedUrl && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Demonstração em breve</p>
            </div>
          )}

          {/* Exercise info badges */}
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

          {/* Coach tips (from protocol) */}
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
