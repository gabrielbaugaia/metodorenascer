import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Clock, RotateCcw } from "lucide-react";

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

export function ExerciseVideoModal({
  exercise,
  open,
  onOpenChange,
}: ExerciseVideoModalProps) {
  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Dumbbell className="w-5 h-5 text-primary" />
            {exercise.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video - only show iframe for valid YouTube/Vimeo URLs */}
          {exercise.videoUrl && (exercise.videoUrl.includes('youtube.com') || exercise.videoUrl.includes('youtu.be') || exercise.videoUrl.includes('vimeo.com')) ? (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
              <iframe
                src={exercise.videoUrl}
                title={exercise.name}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Vídeo demonstrativo em breve</p>
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
