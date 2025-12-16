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
import { searchExercise, getExerciseGifUrl, ExerciseDbExercise } from "@/services/exerciseDb";
import { Clock, Dumbbell, ExternalLink, Loader2, RotateCcw, Info } from "lucide-react";

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

export function ExerciseVideoModal({
  exercise,
  open,
  onOpenChange,
}: ExerciseVideoModalProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [exerciseDbData, setExerciseDbData] = useState<ExerciseDbExercise | null>(null);
  const [useExerciseDb, setUseExerciseDb] = useState(true);

  const currentUrl = resolvedUrl ?? exercise?.videoUrl ?? "";
  const embedUrl = useMemo(() => toYoutubeEmbedUrl(currentUrl), [currentUrl]);
  const watchUrl = useMemo(() => toYoutubeWatchUrl(currentUrl), [currentUrl]);

  // Reset state when modal opens/closes or exercise changes
  useEffect(() => {
    if (!open || !exercise) return;

    setResolvedUrl(null);
    setResolving(false);
    setExerciseDbData(null);
    setUseExerciseDb(true);
  }, [open, exercise?.name]);

  // Try to fetch from ExerciseDB first (for GIFs)
  useEffect(() => {
    const fetchExerciseDb = async () => {
      if (!open || !exercise || !useExerciseDb) return;

      setResolving(true);
      try {
        const dbExercise = await searchExercise(exercise.name);
        if (dbExercise) {
          setExerciseDbData(dbExercise);
        }
      } catch (error) {
        console.error("Error fetching from ExerciseDB:", error);
      } finally {
        setResolving(false);
      }
    };

    fetchExerciseDb();
  }, [open, exercise, useExerciseDb]);

  // Fallback to local database for YouTube videos
  useEffect(() => {
    const resolveFromDatabase = async () => {
      if (!open || !exercise) return;
      if (exerciseDbData) return; // Already have ExerciseDB data

      const alreadyValid = Boolean(extractYoutubeId(exercise.videoUrl ?? ""));
      if (alreadyValid) return;

      setResolving(true);
      try {
        const name = exercise.name?.trim();
        if (!name) return;

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

    // Only run if no ExerciseDB data and not still loading
    if (!exerciseDbData && !resolving) {
      resolveFromDatabase();
    }
  }, [open, exercise, exerciseDbData, resolving]);

  const handleOpenInYoutube = () => {
    if (watchUrl) {
      window.open(watchUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!exercise) return null;

  const gifUrl = exerciseDbData ? getExerciseGifUrl(exerciseDbData) : null;

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

          {/* ExerciseDB GIF - Primary display */}
          {!resolving && gifUrl && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={gifUrl}
                alt={`Demonstração: ${exercise.name}`}
                className="max-w-full max-h-full object-contain"
                loading="eager"
                onError={() => {
                  // If GIF fails, fall back to YouTube
                  setExerciseDbData(null);
                  setUseExerciseDb(false);
                }}
              />
              {/* ExerciseDB badge */}
              <div className="absolute bottom-2 right-2">
                <Badge variant="secondary" className="text-[10px] bg-black/60 text-white border-0">
                  ExerciseDB
                </Badge>
              </div>
            </div>
          )}

          {/* YouTube fallback - Desktop */}
          {!resolving && !gifUrl && embedUrl && (
            <div className="hidden sm:block">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                <iframe
                  src={embedUrl}
                  title={exercise.name}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* YouTube fallback - Mobile */}
          {!resolving && !gifUrl && watchUrl && (
            <div className="sm:hidden">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted flex flex-col items-center justify-center gap-4 p-4">
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
              </div>
            </div>
          )}

          {/* No media available */}
          {!resolving && !gifUrl && !watchUrl && !embedUrl && (
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

          {/* Target muscles from ExerciseDB */}
          {exerciseDbData && exerciseDbData.target && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                {exerciseDbData.target}
              </Badge>
              {exerciseDbData.secondaryMuscles?.map((muscle) => (
                <Badge key={muscle} variant="outline" className="text-xs">
                  {muscle}
                </Badge>
              ))}
            </div>
          )}

          {/* Instructions from ExerciseDB */}
          {exerciseDbData && exerciseDbData.instructions?.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Instruções
              </p>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                {exerciseDbData.instructions.slice(0, 4).map((instruction, idx) => (
                  <li key={idx} className="leading-relaxed">{instruction}</li>
                ))}
              </ol>
            </div>
          )}

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
