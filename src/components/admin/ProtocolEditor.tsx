import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  Plus, 
  Trash2, 
  Dumbbell, 
  Video,
  MessageSquare,
  RefreshCw,
  Loader2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

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

interface TrainingContent {
  nivel: string;
  titulo: string;
  semanas: TrainingWeek[];
}

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

  const updateExercise = (weekIndex: number, dayIndex: number, exerciseIndex: number, field: keyof Exercise, value: any) => {
    const newContent = { ...content };
    if (newContent.semanas?.[weekIndex]?.dias?.[dayIndex]?.exercicios?.[exerciseIndex]) {
      newContent.semanas[weekIndex].dias[dayIndex].exercicios[exerciseIndex] = {
        ...newContent.semanas[weekIndex].dias[dayIndex].exercicios[exerciseIndex],
        [field]: value
      };
      setContent(newContent);
    }
  };

  const addExercise = (weekIndex: number, dayIndex: number) => {
    const newContent = { ...content };
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

  const removeExercise = (weekIndex: number, dayIndex: number, exerciseIndex: number) => {
    const newContent = { ...content };
    if (newContent.semanas?.[weekIndex]?.dias?.[dayIndex]?.exercicios) {
      newContent.semanas[weekIndex].dias[dayIndex].exercicios.splice(exerciseIndex, 1);
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

  if (!content?.semanas) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Estrutura do protocolo não reconhecida
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header with actions */}
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold truncate">{content.titulo}</h3>
          <Badge variant="secondary">{content.nivel}</Badge>
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

      {/* Weeks accordion */}
      <Accordion type="multiple" className="space-y-4">
        {content.semanas.map((week, weekIndex) => (
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
                      <div key={exerciseIndex} className="bg-background rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">Exercício {exerciseIndex + 1}</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExercise(weekIndex, dayIndex, exerciseIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2">
                            <Label className="text-xs text-muted-foreground">Nome</Label>
                            <Input
                              value={exercise.nome}
                              onChange={(e) => updateExercise(weekIndex, dayIndex, exerciseIndex, "nome", e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Séries</Label>
                            <Input
                              type="number"
                              value={exercise.series}
                              onChange={(e) => updateExercise(weekIndex, dayIndex, exerciseIndex, "series", parseInt(e.target.value))}
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Repetições</Label>
                            <Input
                              value={exercise.repeticoes}
                              onChange={(e) => updateExercise(weekIndex, dayIndex, exerciseIndex, "repeticoes", e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">Descanso</Label>
                            <Input
                              value={exercise.descanso}
                              onChange={(e) => updateExercise(weekIndex, dayIndex, exerciseIndex, "descanso", e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Video className="h-3 w-3" /> URL do Vídeo
                            </Label>
                            <Input
                              value={exercise.video_url || ""}
                              onChange={(e) => updateExercise(weekIndex, dayIndex, exerciseIndex, "video_url", e.target.value)}
                              placeholder="https://youtube.com/..."
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" /> Observações/Dicas
                            </Label>
                            <Textarea
                              value={exercise.dicas || ""}
                              onChange={(e) => updateExercise(weekIndex, dayIndex, exerciseIndex, "dicas", e.target.value)}
                              placeholder="Dicas de execução, observações importantes..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addExercise(weekIndex, dayIndex)}
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
    </div>
  );
}
