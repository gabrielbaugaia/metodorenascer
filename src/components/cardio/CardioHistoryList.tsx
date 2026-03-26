import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, MapPin, Flame, Heart, Moon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CARDIO_LABELS: Record<string, string> = {
  bike: "Bike",
  esteira: "Esteira",
  rua: "Corrida / Rua",
  eliptico: "Elíptico",
  natacao: "Natação",
  caminhada: "Caminhada",
  outro: "Outro",
};

interface CardioSession {
  id: string;
  session_date: string;
  cardio_type: string;
  duration_minutes: number | null;
  distance_km: number | null;
  calories_burned: number | null;
  avg_hr_bpm: number | null;
  max_hr_bpm: number | null;
  fasting: boolean;
  notes: string | null;
}

interface Props {
  sessions: CardioSession[];
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function CardioHistoryList({ sessions, onDelete, isDeleting }: Props) {
  if (sessions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhuma sessão de aeróbico registrada ainda.</p>
        <p className="text-sm text-muted-foreground mt-1">Registre sua primeira sessão acima!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <Card key={s.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">
                  {CARDIO_LABELS[s.cardio_type] || s.cardio_type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(s.session_date + "T12:00:00"), "dd MMM yyyy", { locale: ptBR })}
                </span>
                {s.fasting && (
                  <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600">
                    <Moon className="h-3 w-3 mr-1" /> Jejum
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {s.duration_minutes != null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {s.duration_minutes} min
                  </span>
                )}
                {s.distance_km != null && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {Number(s.distance_km).toFixed(1)} km
                  </span>
                )}
                {s.calories_burned != null && (
                  <span className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5" /> {s.calories_burned} kcal
                  </span>
                )}
                {s.avg_hr_bpm != null && (
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" /> {s.avg_hr_bpm} bpm
                  </span>
                )}
              </div>
              {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(s.id)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
