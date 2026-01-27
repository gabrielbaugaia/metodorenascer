import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Plus, 
  Trash2, 
  Dumbbell, 
  Video,
  MessageSquare,
  RefreshCw,
  Loader2,
  Sparkles,
  Image,
  Youtube,
  Link2Off,
  Search,
  ImageOff
} from "lucide-react";
import { toast } from "sonner";
import { GifPickerModal } from "./GifPickerModal";

interface Exercise {
  nome: string;
  series: number;
  repeticoes: string;
  descanso: string;
  video_url?: string;
  dicas?: string;
}

interface TrainingDay {
  dia: string;
  foco: string;
  exercicios: Exercise[];
}

interface TrainingWeek {
  dias: TrainingDay[];
}

// Formato legado: semanas > dias
interface TrainingContentLegacy {
  nivel?: string;
  titulo?: string;
  semanas: TrainingWeek[];
}

// Formato novo: treinos A, B, C, D
interface TrainingLetter {
  letra: string;
  foco: string;
  duracao_minutos?: number;
  exercicios: Exercise[];
}

interface TrainingContentNew {
  nivel?: string;
  titulo?: string;
  treinos: TrainingLetter[];
}

type TrainingContent = TrainingContentNew | TrainingContentLegacy;

interface ProtocolEditorProps {
  protocol: {
    id: string;
    user_id: string;
    tipo: string;
    titulo: string;
    conteudo: any;
  };
  onSave: (content: any) => Promise<void>;
  onRegenerate: (adjustments: string) => Promise<void>;
  saving: boolean;
  regenerating: boolean;
}

// Índices para formato legado
interface SelectedExerciseLegacy {
  type: 'legacy';
  weekIndex: number;
  dayIndex: number;
  exerciseIndex: number;
}

// Índices para formato novo
interface SelectedExerciseNew {
  type: 'new';
  treinoIndex: number;
  exerciseIndex: number;
}

type SelectedExerciseIndex = SelectedExerciseLegacy | SelectedExerciseNew;

// Type guards
const isNewFormat = (content: any): content is TrainingContentNew => {
  return Array.isArray(content?.treinos) && content.treinos.length > 0;
};

const isLegacyFormat = (content: any): content is TrainingContentLegacy => {
  return Array.isArray(content?.semanas) && content.semanas.length > 0;
};

export function ProtocolEditor({ 
  protocol, 
  onSave, 
  onRegenerate, 
  saving, 
  regenerating 
}: ProtocolEditorProps) {
  const [content, setContent] = useState<TrainingContent>(protocol.conteudo);
  const [adjustments, setAdjustments] = useState("");
  const [showRegenerateInput, setShowRegenerateInput] = useState(false);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<SelectedExerciseIndex | null>(null);
  const [previewGif, setPreviewGif] = useState<string | null>(null);

  const hasNewFormat = isNewFormat(content);
  const hasLegacyFormat = isLegacyFormat(content);

  // ===== Funções para formato LEGADO (semanas) =====
  const updateExerciseLegacy = (weekIndex: number, dayIndex: number, exerciseIndex: number, field: keyof Exercise, value: any) => {
    const newContent = { ...content } as TrainingContentLegacy;
    if (newContent.semanas?.[weekIndex]?.dias?.[dayIndex]?.exercicios?.[exerciseIndex]) {
      newContent.semanas[weekIndex].dias[dayIndex].exercicios[exerciseIndex] = {
        ...newContent.semanas[weekIndex].dias[dayIndex].exercicios[exerciseIndex],
        [field]: value
      };
      setContent(newContent);
    }
  };

  const addExerciseLegacy = (weekIndex: number, dayIndex: number) => {
    const newContent = { ...content } as TrainingContentLegacy;
    if (newContent.semanas?.[weekIndex]?.dias?.[dayIndex]) {
      newContent.semanas[weekIndex].dias[dayIndex].exercicios.push({
        nome: "Novo Exercício",
        series: 3,
        repeticoes: "12",
        descanso: "60s",
        video_url: "",
        dicas: ""
      });
      setContent(newContent);
    }
  };

  const removeExerciseLegacy = (weekIndex: number, dayIndex: number, exerciseIndex: number) => {
    const newContent = { ...content } as TrainingContentLegacy;
    if (newContent.semanas?.[weekIndex]?.dias?.[dayIndex]?.exercicios) {
      newContent.semanas[weekIndex].dias[dayIndex].exercicios.splice(exerciseIndex, 1);
      setContent(newContent);
    }
  };

  // ===== Funções para formato NOVO (treinos) =====
  const updateExerciseNew = (treinoIndex: number, exerciseIndex: number, field: keyof Exercise, value: any) => {
    const newContent = { ...content } as TrainingContentNew;
    if (newContent.treinos?.[treinoIndex]?.exercicios?.[exerciseIndex]) {
      newContent.treinos[treinoIndex].exercicios[exerciseIndex] = {
        ...newContent.treinos[treinoIndex].exercicios[exerciseIndex],
        [field]: value
      };
      setContent(newContent);
    }
  };

  const addExerciseNew = (treinoIndex: number) => {
    const newContent = { ...content } as TrainingContentNew;
    if (newContent.treinos?.[treinoIndex]) {
      if (!newContent.treinos[treinoIndex].exercicios) {
        newContent.treinos[treinoIndex].exercicios = [];
      }
      newContent.treinos[treinoIndex].exercicios.push({
        nome: "Novo Exercício",
        series: 3,
        repeticoes: "12",
        descanso: "60s",
        video_url: "",
        dicas: ""
      });
      setContent(newContent);
    }
  };

  const removeExerciseNew = (treinoIndex: number, exerciseIndex: number) => {
    const newContent = { ...content } as TrainingContentNew;
    if (newContent.treinos?.[treinoIndex]?.exercicios) {
      newContent.treinos[treinoIndex].exercicios.splice(exerciseIndex, 1);
      setContent(newContent);
    }
  };

  const handleSave = async () => {
    try {
      await onSave(content);
      toast.success("Protocolo salvo com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar protocolo");
    }
  };

  const handleRegenerate = async () => {
    await onRegenerate(adjustments);
    setAdjustments("");
    setShowRegenerateInput(false);
  };

  const openGifPickerLegacy = (weekIndex: number, dayIndex: number, exerciseIndex: number) => {
    setSelectedExercise({ type: 'legacy', weekIndex, dayIndex, exerciseIndex });
    setGifPickerOpen(true);
  };

  const openGifPickerNew = (treinoIndex: number, exerciseIndex: number) => {
    setSelectedExercise({ type: 'new', treinoIndex, exerciseIndex });
    setGifPickerOpen(true);
  };

  const handleGifSelect = (gifUrl: string, exerciseName: string) => {
    if (selectedExercise) {
      if (selectedExercise.type === 'legacy') {
        const { weekIndex, dayIndex, exerciseIndex } = selectedExercise;
        updateExerciseLegacy(weekIndex, dayIndex, exerciseIndex, "video_url", gifUrl);
        const currentName = (content as TrainingContentLegacy).semanas?.[weekIndex]?.dias?.[dayIndex]?.exercicios?.[exerciseIndex]?.nome;
        if (currentName === "Novo Exercício" || !currentName) {
          updateExerciseLegacy(weekIndex, dayIndex, exerciseIndex, "nome", exerciseName);
        }
      } else {
        const { treinoIndex, exerciseIndex } = selectedExercise;
        updateExerciseNew(treinoIndex, exerciseIndex, "video_url", gifUrl);
        const currentName = (content as TrainingContentNew).treinos?.[treinoIndex]?.exercicios?.[exerciseIndex]?.nome;
        if (currentName === "Novo Exercício" || !currentName) {
          updateExerciseNew(treinoIndex, exerciseIndex, "nome", exerciseName);
        }
      }
      toast.success("GIF vinculado com sucesso!");
    }
    setSelectedExercise(null);
  };

  const isGifUrl = (url: string) => {
    return url?.includes("supabase.co/storage") || url?.endsWith(".gif");
  };

  const getInitialSearchTerm = () => {
    if (!selectedExercise) return "";
    
    if (selectedExercise.type === 'legacy') {
      const { weekIndex, dayIndex, exerciseIndex } = selectedExercise;
      const exercise = (content as TrainingContentLegacy).semanas?.[weekIndex]?.dias?.[dayIndex]?.exercicios?.[exerciseIndex];
      return exercise?.nome === "Novo Exercício" ? "" : exercise?.nome || "";
    } else {
      const { treinoIndex, exerciseIndex } = selectedExercise;
      const exercise = (content as TrainingContentNew).treinos?.[treinoIndex]?.exercicios?.[exerciseIndex];
      return exercise?.nome === "Novo Exercício" ? "" : exercise?.nome || "";
    }
  };

  // Validação de estrutura
  if (!hasNewFormat && !hasLegacyFormat) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Estrutura do protocolo não reconhecida
      </div>
    );
  }

  // Componente de exercício reutilizável
  const ExerciseCard = ({ 
    exercise, 
    exerciseIndex, 
    onUpdate, 
    onRemove, 
    onOpenGifPicker 
  }: { 
    exercise: Exercise; 
    exerciseIndex: number; 
    onUpdate: (field: keyof Exercise, value: any) => void;
    onRemove: () => void;
    onOpenGifPicker: () => void;
  }) => (
    <div className="bg-background rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-medium">Exercício {exerciseIndex + 1}</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Layout with GIF preview */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* GIF Preview */}
        <div className="flex-shrink-0">
          {exercise.video_url && isGifUrl(exercise.video_url) ? (
            <button
              type="button"
              onClick={() => setPreviewGif(exercise.video_url || null)}
              className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-muted border-2 border-border hover:border-primary transition-colors group"
            >
              <img
                src={exercise.video_url}
                alt={exercise.nome}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Search className="h-5 w-5 text-white" />
              </div>
            </button>
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
              <ImageOff className="h-6 w-6 mb-1" />
              <span className="text-[10px]">Sem GIF</span>
            </div>
          )}
        </div>

        {/* Form fields */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input
              value={exercise.nome}
              onChange={(e) => onUpdate("nome", e.target.value)}
            />
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Séries</Label>
            <Input
              type="number"
              value={exercise.series}
              onChange={(e) => onUpdate("series", parseInt(e.target.value))}
            />
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Repetições</Label>
            <Input
              value={exercise.repeticoes}
              onChange={(e) => onUpdate("repeticoes", e.target.value)}
            />
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">Descanso</Label>
            <Input
              value={exercise.descanso}
              onChange={(e) => onUpdate("descanso", e.target.value)}
            />
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Video className="h-3 w-3" /> Mídia
              {exercise.video_url && (
                <>
                  {exercise.video_url.includes("supabase.co/storage") && (
                    <Badge variant="outline" className="ml-2 text-[10px] border-primary/50 text-primary">
                      <Image className="h-2.5 w-2.5 mr-1" />
                      GIF
                    </Badge>
                  )}
                  {(exercise.video_url.includes("youtube.com") || exercise.video_url.includes("youtu.be")) && (
                    <Badge variant="outline" className="ml-2 text-[10px] border-destructive/50 text-destructive">
                      <Youtube className="h-2.5 w-2.5 mr-1" />
                      YouTube
                    </Badge>
                  )}
                  {exercise.video_url && !exercise.video_url.includes("supabase.co") && !exercise.video_url.includes("youtube") && !exercise.video_url.includes("youtu.be") && (
                    <Badge variant="outline" className="ml-2 text-[10px] text-muted-foreground">
                      <Link2Off className="h-2.5 w-2.5 mr-1" />
                      Outro
                    </Badge>
                  )}
                </>
              )}
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenGifPicker}
                className="flex-1"
              >
                <Search className="h-3.5 w-3.5 mr-1.5" />
                Buscar GIF
              </Button>
              {exercise.video_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive h-9 w-9"
                  onClick={() => onUpdate("video_url", "")}
                  title="Limpar mídia"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> Observações/Dicas
            </Label>
            <Textarea
              value={exercise.dicas || ""}
              onChange={(e) => onUpdate("dicas", e.target.value)}
              placeholder="Dicas de execução, observações importantes..."
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header with actions */}
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold truncate">{content.titulo || protocol.titulo}</h3>
          {content.nivel && <Badge variant="secondary">{content.nivel}</Badge>}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => setShowRegenerateInput(!showRegenerateInput)}
            variant="outline"
            disabled={regenerating}
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="text-xs sm:text-sm">Gerar Novo Protocolo</span>
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="fire" size="sm" className="w-full sm:w-auto">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            <span className="text-xs sm:text-sm">Salvar Alterações</span>
          </Button>
        </div>
      </div>

      {/* Regenerate input */}
      {showRegenerateInput && (
        <Card className="border-primary/30">
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Ajustes para o novo protocolo</Label>
              <Textarea
                placeholder="Descreva as alterações desejadas: mais cardio, focar em pernas, reduzir volume..."
                value={adjustments}
                onChange={(e) => setAdjustments(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={handleRegenerate} disabled={regenerating} variant="fire" className="w-full">
              {regenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Novo Protocolo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* FORMATO NOVO: Treinos A, B, C, D */}
      {hasNewFormat && (
        <Accordion type="multiple" className="space-y-4">
          {(content as TrainingContentNew).treinos.map((treino, treinoIndex) => (
            <AccordionItem key={treinoIndex} value={`treino-${treinoIndex}`} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-display flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  Treino {treino.letra} - {treino.foco}
                  {treino.duracao_minutos && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      ~{treino.duracao_minutos} min
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                {treino.exercicios?.map((exercise, exerciseIndex) => (
                  <ExerciseCard
                    key={exerciseIndex}
                    exercise={exercise}
                    exerciseIndex={exerciseIndex}
                    onUpdate={(field, value) => updateExerciseNew(treinoIndex, exerciseIndex, field, value)}
                    onRemove={() => removeExerciseNew(treinoIndex, exerciseIndex)}
                    onOpenGifPicker={() => openGifPickerNew(treinoIndex, exerciseIndex)}
                  />
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addExerciseNew(treinoIndex)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Exercício
                </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* FORMATO LEGADO: Semanas > Dias */}
      {hasLegacyFormat && (
        <Accordion type="multiple" className="space-y-4">
          {(content as TrainingContentLegacy).semanas.map((week, weekIndex) => (
            <AccordionItem key={weekIndex} value={`week-${weekIndex}`} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="font-display">Semana {weekIndex + 1}</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                {week.dias?.map((day, dayIndex) => (
                  <Card key={dayIndex} className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Dumbbell className="h-4 w-4 text-primary" />
                        {day.dia} - {day.foco}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {day.exercicios?.map((exercise, exerciseIndex) => (
                        <ExerciseCard
                          key={exerciseIndex}
                          exercise={exercise}
                          exerciseIndex={exerciseIndex}
                          onUpdate={(field, value) => updateExerciseLegacy(weekIndex, dayIndex, exerciseIndex, field, value)}
                          onRemove={() => removeExerciseLegacy(weekIndex, dayIndex, exerciseIndex)}
                          onOpenGifPicker={() => openGifPickerLegacy(weekIndex, dayIndex, exerciseIndex)}
                        />
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addExerciseLegacy(weekIndex, dayIndex)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Exercício
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* GIF Picker Modal */}
      <GifPickerModal
        open={gifPickerOpen}
        onOpenChange={setGifPickerOpen}
        initialSearchTerm={getInitialSearchTerm()}
        onSelect={handleGifSelect}
      />

      {/* GIF Preview Dialog */}
      {previewGif && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewGif(null)}
        >
          <div className="relative max-w-2xl max-h-[80vh]">
            <img
              src={previewGif}
              alt="GIF Preview"
              className="max-w-full max-h-[80vh] rounded-lg"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setPreviewGif(null)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
