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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Link2Off, Trash2, XCircle, AlertTriangle } from "lucide-react";

interface BrokenUrl {
  id: string;
  name: string;
  url: string;
  muscleGroup: string;
  status: string;
  selected: boolean;
}

interface BrokenUrlsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brokenUrls: BrokenUrl[];
  onToggleSelection: (id: string) => void;
  onToggleAll: () => void;
  onDeactivate: () => Promise<void>;
  onDelete: () => Promise<void>;
  isProcessing: boolean;
}

export function BrokenUrlsModal({
  open,
  onOpenChange,
  brokenUrls,
  onToggleSelection,
  onToggleAll,
  onDeactivate,
  onDelete,
  isProcessing,
}: BrokenUrlsModalProps) {
  const selectedCount = brokenUrls.filter(b => b.selected).length;
  const allSelected = brokenUrls.length > 0 && selectedCount === brokenUrls.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2Off className="h-5 w-5 text-red-500" />
            URLs Quebradas Detectadas
          </DialogTitle>
          <DialogDescription>
            {brokenUrls.length} GIF(s) com URL externa não funcional. Selecione para desativar ou excluir.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              URLs do domínio <code className="bg-amber-200/50 px-1 rounded">v2.exercisedb.io</code> não estão mais acessíveis. 
              Recomendamos baixar novos GIFs para o Storage local.
            </p>
          </div>

          {/* Select All Checkbox */}
          <div className="flex items-center gap-2 pb-4 border-b mb-4">
            <Checkbox
              id="select-all-broken"
              checked={allSelected}
              onCheckedChange={onToggleAll}
              className="data-[state=checked]:bg-red-500"
            />
            <label
              htmlFor="select-all-broken"
              className="text-sm font-medium cursor-pointer"
            >
              Selecionar todos ({selectedCount}/{brokenUrls.length})
            </label>
          </div>

          {/* Broken URLs List */}
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-2">
              {brokenUrls.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    item.selected
                      ? "bg-red-50 border-red-300"
                      : "bg-muted/20 border-muted"
                  }`}
                >
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={() => onToggleSelection(item.id)}
                  />

                  {/* Broken Image Placeholder */}
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-red-100 flex-shrink-0 flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.muscleGroup}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          item.status === 'active' 
                            ? 'border-green-300 text-green-700' 
                            : 'border-yellow-300 text-yellow-700'
                        }`}
                      >
                        {item.status}
                      </Badge>
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
            {selectedCount} selecionado(s)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Fechar
            </Button>
            <Button
              variant="outline"
              onClick={onDeactivate}
              disabled={isProcessing || selectedCount === 0}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              {isProcessing ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Desativar ({selectedCount})
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isProcessing || selectedCount === 0}
            >
              {isProcessing ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir ({selectedCount})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
