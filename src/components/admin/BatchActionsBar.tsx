import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Pause, Ban, Play, X } from "lucide-react";

interface BatchActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onChangePlan: () => void;
  onPause: () => void;
  onBlock: () => void;
  onReactivate: () => void;
  loading?: boolean;
}

export function BatchActionsBar({
  selectedCount,
  onClearSelection,
  onChangePlan,
  onPause,
  onBlock,
  onReactivate,
  loading,
}: BatchActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-sm">
            {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
          </Badge>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={onChangePlan}
            disabled={loading}
            className="text-xs"
          >
            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
            Alterar Plano
          </Button>
          <Button variant="outline" size="sm" onClick={onPause} disabled={loading} className="text-xs">
            <Pause className="h-3.5 w-3.5 mr-1.5" />
            Pausar
          </Button>
          <Button variant="outline" size="sm" onClick={onReactivate} disabled={loading} className="text-xs">
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Reativar
          </Button>
          <Button variant="destructive" size="sm" onClick={onBlock} disabled={loading} className="text-xs">
            <Ban className="h-3.5 w-3.5 mr-1.5" />
            Bloquear
          </Button>
        </div>
      </div>
    </div>
  );
}
