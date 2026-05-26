import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Save, History } from "lucide-react";
import type { Classification } from "@/lib/vo2maxCalc";
import { PROTOCOL_LABEL, type Vo2Protocol } from "@/lib/vo2maxCalc";

interface Props {
  protocolo: Vo2Protocol;
  vo2: number;
  classification: Classification;
  testDate: string;
  local?: string;
  onSave: () => void;
  onShowHistory: () => void;
  isSaving: boolean;
}

export function Vo2MaxResultCard({ protocolo, vo2, classification, testDate, local, onSave, onShowHistory, isSaving }: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setDisplay(vo2 * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [vo2]);

  const badgeClass =
    classification.color === "success"
      ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40"
      : classification.color === "warning"
      ? "bg-amber-500/15 text-amber-500 border-amber-500/40"
      : "bg-destructive/15 text-destructive border-destructive/40";

  return (
    <Card className="p-6 space-y-4 text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">VO2 Máx Estimado</p>
      <div>
        <div className="text-5xl font-bold text-primary tabular-nums">{display.toFixed(1)}</div>
        <div className="text-sm text-muted-foreground mt-1">ml/kg/min</div>
      </div>
      <Badge className={`text-sm px-3 py-1 ${badgeClass}`}>{classification.label}</Badge>

      <div className="text-xs text-muted-foreground space-y-0.5 pt-2 border-t border-border">
        <p>{PROTOCOL_LABEL[protocolo]}</p>
        <p>{testDate}{local ? ` · ${local}` : ""}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar
        </Button>
        <Button variant="outline" onClick={onShowHistory}>
          <History className="h-4 w-4 mr-2" /> Histórico
        </Button>
      </div>
    </Card>
  );
}
