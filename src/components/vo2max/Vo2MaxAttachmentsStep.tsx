import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Watch, Sparkles } from "lucide-react";

export interface AttachmentsData {
  screenshotFile?: File | null;
  appFile?: File | null;
  notas_execucao?: string;
}

interface Props {
  onSave: (d: AttachmentsData) => void;
  onSkip: () => void;
  isSaving?: boolean;
}

export function Vo2MaxAttachmentsStep({ onSave, onSkip, isSaving }: Props) {
  const [esteira, setEsteira] = useState<File | null>(null);
  const [app, setApp] = useState<File | null>(null);
  const [notas, setNotas] = useState("");

  return (
    <Card className="p-5 space-y-5">
      <div className="text-center space-y-1">
        <Sparkles className="h-8 w-8 mx-auto text-primary" />
        <h3 className="font-semibold">Quer enriquecer este registro?</h3>
        <p className="text-xs text-muted-foreground">
          Anexos opcionais — ajudam a comparar com sessões futuras.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" /> Foto do display da esteira
        </Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setEsteira(e.target.files?.[0] || null)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <Watch className="h-3.5 w-3.5" /> Print do app/relógio (Apple Watch, Garmin, Strava)
        </Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setApp(e.target.files?.[0] || null)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Como você se sentiu? (BPM máx, sensações…)</Label>
        <Textarea
          placeholder="Ex: BPM máx 178, pernas pesadas no estágio 4…"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className="min-h-[70px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button variant="outline" onClick={onSkip} disabled={isSaving}>
          Pular
        </Button>
        <Button
          onClick={() =>
            onSave({
              screenshotFile: esteira,
              appFile: app,
              notas_execucao: notas || undefined,
            })
          }
          disabled={isSaving}
        >
          {isSaving ? "Salvando…" : "Concluir"}
        </Button>
      </div>
    </Card>
  );
}
