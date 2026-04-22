import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trash2, Loader2, Volume2, VolumeX, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { MUSCLE_GROUPS } from "@/lib/muscleGroups";
import { MuscleGroupMultiSelect } from "./MuscleGroupMultiSelect";

export type ReelCategory = "execucao" | "dica" | "explicativo";

export interface ReelDraft {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  description: string;
  showDescription: boolean;
  category: ReelCategory;
  muscleGroups: string[];
  audioRemoved: boolean;
  isVertical: boolean;
  duration: number;
  status: "idle" | "suggesting" | "describing" | "stripping" | "uploading" | "done" | "error";
  progress?: number;
  error?: string;
}

interface ReelCardProps {
  draft: ReelDraft;
  onChange: (patch: Partial<ReelDraft>) => void;
  onRemove: () => void;
  onSuggestTitle: () => void;
  onGenerateDescription: () => void;
  onStripAudio: () => void;
}

const CATEGORY_LABEL: Record<ReelCategory, string> = {
  execucao: "Execução",
  dica: "Dica",
  explicativo: "Explicativo",
};

export function ReelCard({ draft, onChange, onRemove, onSuggestTitle, onGenerateDescription, onStripAudio }: ReelCardProps) {
  const isBusy = ["suggesting", "describing", "stripping", "uploading"].includes(draft.status);
  return (
    <Card className="overflow-hidden border-border bg-card">
      <div className="flex flex-col md:flex-row gap-4 p-4">
        {/* Preview vertical 9:16 */}
        <div className="relative w-full md:w-[180px] shrink-0">
          <div className="relative aspect-[9/16] rounded-md overflow-hidden bg-muted">
            <video
              src={draft.previewUrl}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
              loop
              onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
              onMouseLeave={(e) => e.currentTarget.pause()}
            />
            {!draft.isVertical && (
              <div className="absolute top-1 left-1 right-1 flex items-center gap-1 bg-destructive/90 text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded">
                <AlertCircle className="h-3 w-3" />
                Não vertical
              </div>
            )}
            {draft.status === "uploading" && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                <div className="text-xs font-medium">{Math.round(draft.progress ?? 0)}%</div>
              </div>
            )}
            {draft.status === "done" && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Badge className="bg-primary">Enviado</Badge>
              </div>
            )}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground truncate">{draft.file.name}</p>
        </div>

        {/* Form */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">Título</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onSuggestTitle}
                disabled={isBusy}
                className="h-7 text-xs"
              >
                {draft.status === "suggesting" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Reescrever com IA
              </Button>
            </div>
            <Input
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value })}
              maxLength={60}
              placeholder="Título do vídeo"
              disabled={isBusy}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={draft.category} onValueChange={(v) => onChange({ category: v as ReelCategory })} disabled={isBusy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABEL) as ReelCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Grupos musculares</Label>
              <MuscleGroupMultiSelect
                value={draft.muscleGroups}
                onChange={(value) => onChange({ muscleGroups: value })}
                muscleGroups={[...MUSCLE_GROUPS]}
                disabled={isBusy}
                placeholder="Selecionar..."
                className="w-full"
                compact
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id={`audio-${draft.id}`}
                checked={draft.audioRemoved}
                onCheckedChange={(checked) => {
                  if (checked && !draft.audioRemoved) {
                    onStripAudio();
                  } else {
                    onChange({ audioRemoved: checked });
                  }
                }}
                disabled={isBusy}
              />
              <Label htmlFor={`audio-${draft.id}`} className="text-xs flex items-center gap-1 cursor-pointer">
                {draft.audioRemoved ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                Remover áudio
                {draft.status === "stripping" && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`desc-${draft.id}`}
                checked={draft.showDescription}
                onCheckedChange={(checked) => onChange({ showDescription: checked })}
                disabled={isBusy}
              />
              <Label htmlFor={`desc-${draft.id}`} className="text-xs cursor-pointer">Mostrar descrição</Label>
            </div>
          </div>

          {draft.showDescription && (
            <div>
              <Label className="text-xs">Descrição (até 200 caracteres)</Label>
              <Textarea
                value={draft.description}
                onChange={(e) => onChange({ description: e.target.value.slice(0, 200) })}
                maxLength={200}
                rows={2}
                placeholder="Descrição curta que aparecerá no vídeo..."
                disabled={isBusy}
              />
              <p className="text-[10px] text-muted-foreground text-right mt-1">{draft.description.length}/200</p>
            </div>
          )}

          {draft.error && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {draft.error}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={draft.status === "uploading"}
              className={cn("text-destructive hover:text-destructive hover:bg-destructive/10")}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Remover
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
