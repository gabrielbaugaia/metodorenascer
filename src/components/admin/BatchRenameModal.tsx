import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Wand2, XCircle, ArrowRight } from "lucide-react";

interface RenameSuggestion {
  id: string;
  original: string;
  suggested: string;
  gifUrl: string;
  muscleGroup: string;
  selected: boolean;
}

interface BatchRenameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: RenameSuggestion[];
  onToggleSelection: (id: string) => void;
  onToggleAll: () => void;
  onApply: () => Promise<void>;
  isApplying: boolean;
}

export function BatchRenameModal({
  open,
  onOpenChange,
  suggestions,
  onToggleSelection,
  onToggleAll,
  onApply,
  isApplying,
}: BatchRenameModalProps) {
  const selectedCount = suggestions.filter(s => s.selected).length;
  const allSelected = suggestions.length > 0 && selectedCount === suggestions.length;
  const someSelected = selectedCount > 0 && selectedCount < suggestions.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Revisar Sugestões da IA
          </DialogTitle>
          <DialogDescription>
            {suggestions.length} exercício(s) analisado(s). Selecione quais nomes deseja aplicar.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-2 pb-4 border-b mb-4">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={onToggleAll}
              className="data-[state=checked]:bg-primary"
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              {allSelected ? "Desmarcar todos" : "Selecionar todos"} ({selectedCount}/{suggestions.length})
            </label>
          </div>

          {/* Suggestions List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`flex items-start gap-4 p-3 rounded-lg border transition-colors ${
                    suggestion.selected
                      ? "bg-primary/5 border-primary/30"
                      : "bg-muted/20 border-muted"
                  }`}
                >
                  <Checkbox
                    checked={suggestion.selected}
                    onCheckedChange={() => onToggleSelection(suggestion.id)}
                    className="mt-1"
                  />

                  {/* GIF Preview */}
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {suggestion.gifUrl ? (
                      <img
                        src={suggestion.gifUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        Sem GIF
                      </div>
                    )}
                  </div>

                  {/* Names Comparison */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.muscleGroup}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground line-through truncate max-w-[150px]">
                        {suggestion.original}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                        {suggestion.suggested}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedCount} selecionado(s) para aplicar
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isApplying}
            >
              Cancelar
            </Button>
            <Button
              onClick={onApply}
              disabled={isApplying || selectedCount === 0}
            >
              {isApplying ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Aplicar {selectedCount} Alteração(ões)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
