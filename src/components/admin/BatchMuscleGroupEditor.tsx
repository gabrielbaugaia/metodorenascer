import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MuscleGroupMultiSelect } from "./MuscleGroupMultiSelect";
import { 
  CheckSquare, 
  Square, 
  XSquare, 
  Save,
  Dumbbell
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BatchMuscleGroupEditorProps {
  selectedIds: Set<string>;
  muscleGroups: string[];
  onSelectionChange: (ids: Set<string>) => void;
  onComplete: () => void;
  totalCount: number;
  filteredCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export function BatchMuscleGroupEditor({
  selectedIds,
  muscleGroups,
  onSelectionChange,
  onComplete,
  totalCount,
  filteredCount,
  onSelectAll,
  onClearSelection,
}: BatchMuscleGroupEditorProps) {
  const [batchGroups, setBatchGroups] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const selectedCount = selectedIds.size;
  const hasSelection = selectedCount > 0;
  const hasGroups = batchGroups.length > 0;

  const handleApplyBatch = async () => {
    if (!hasSelection || !hasGroups) {
      toast.error("Selecione exercícios e grupos para aplicar");
      return;
    }

    setApplying(true);
    setProgress({ current: 0, total: selectedCount });

    try {
      const idsArray = Array.from(selectedIds);
      const chunkSize = 50;
      let processed = 0;

      for (let i = 0; i < idsArray.length; i += chunkSize) {
        const chunk = idsArray.slice(i, i + chunkSize);
        
        const { error } = await supabase
          .from("exercise_gifs")
          .update({ 
            muscle_group: batchGroups,
            updated_at: new Date().toISOString() 
          })
          .in("id", chunk);

        if (error) {
          console.error("Erro no chunk:", error);
        }

        processed += chunk.length;
        setProgress({ current: processed, total: selectedCount });
      }

      toast.success(`${selectedCount} exercício(s) atualizado(s) com sucesso!`);
      onClearSelection();
      setBatchGroups([]);
      onComplete();
    } catch (error) {
      console.error("Erro ao aplicar em lote:", error);
      toast.error("Erro ao aplicar grupos");
    } finally {
      setApplying(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  if (!hasSelection && batchGroups.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Edição em Lote</CardTitle>
          </div>
          {hasSelection && (
            <Badge variant="secondary" className="text-sm">
              {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <CardDescription className="text-sm">
          Selecione exercícios abaixo e aplique grupos musculares de uma vez
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 py-3">
        {/* Selection controls */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            className="gap-1"
          >
            <CheckSquare className="h-4 w-4" />
            Selecionar todos ({filteredCount})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={!hasSelection}
            className="gap-1"
          >
            <XSquare className="h-4 w-4" />
            Limpar seleção
          </Button>
        </div>

        {/* Group selection + Apply */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <MuscleGroupMultiSelect
              value={batchGroups}
              onChange={setBatchGroups}
              muscleGroups={muscleGroups}
              placeholder="Escolher grupos para aplicar..."
              className="w-full h-10"
            />
          </div>
          <Button
            onClick={handleApplyBatch}
            disabled={!hasSelection || !hasGroups || applying}
            className="gap-2"
          >
            {applying ? (
              <>
                <LoadingSpinner size="sm" />
                {progress.current}/{progress.total}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Aplicar ({selectedCount})
              </>
            )}
          </Button>
        </div>

        {/* Selected groups preview */}
        {batchGroups.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground mr-1">Grupos:</span>
            {batchGroups.map(group => (
              <Badge key={group} variant="outline" className="text-xs">
                {group}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Checkbox component for individual items in the list
interface BatchSelectCheckboxProps {
  id: string;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function BatchSelectCheckbox({ id, selected, onToggle }: BatchSelectCheckboxProps) {
  return (
    <Checkbox
      checked={selected}
      onCheckedChange={() => onToggle(id)}
      className="mr-2"
      aria-label="Selecionar para edição em lote"
    />
  );
}
