import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Dumbbell, Apple, Brain, Sparkles } from "lucide-react";

interface Props {
  onGenerate: (type: string, options: GenerationOptions) => void;
  generating: string | null;
}

export interface GenerationOptions {
  considerFiles: boolean;
  considerOldTraining: boolean;
  prioritizeTrainer: boolean;
  frequency: string;
  intensity: string;
}

export function MqoProtocolGenerator({ onGenerate, generating }: Props) {
  const [options, setOptions] = useState<GenerationOptions>({
    considerFiles: true,
    considerOldTraining: false,
    prioritizeTrainer: true,
    frequency: "3x",
    intensity: "moderada",
  });

  const buttons = [
    { type: "treino", label: "Gerar Treino", icon: Dumbbell },
    { type: "dieta", label: "Gerar Dieta", icon: Apple },
    { type: "mentalidade", label: "Gerar Mentalidade", icon: Brain },
  ];

  return (
    <div className="border border-gray-200 rounded-lg p-5 space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 flex items-center gap-2">
        <div className="w-1 h-4 bg-[#FFC400] rounded-sm" />
        Geração de Protocolos
      </h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="files" checked={options.considerFiles}
              onCheckedChange={(v) => setOptions((p) => ({ ...p, considerFiles: !!v }))}
            />
            <Label htmlFor="files" className="text-sm">Considerar arquivos enviados</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="old" checked={options.considerOldTraining}
              onCheckedChange={(v) => setOptions((p) => ({ ...p, considerOldTraining: !!v }))}
            />
            <Label htmlFor="old" className="text-sm">Considerar treino antigo</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="trainer" checked={options.prioritizeTrainer}
              onCheckedChange={(v) => setOptions((p) => ({ ...p, prioritizeTrainer: !!v }))}
            />
            <Label htmlFor="trainer" className="text-sm font-semibold">Priorizar observações do treinador</Label>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Frequência Semanal</Label>
            <Select value={options.frequency} onValueChange={(v) => setOptions((p) => ({ ...p, frequency: v }))}>
              <SelectTrigger className="border-gray-300 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["2x", "3x", "4x", "5x", "6x"].map((f) => (
                  <SelectItem key={f} value={f}>{f} por semana</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Intensidade</Label>
            <Select value={options.intensity} onValueChange={(v) => setOptions((p) => ({ ...p, intensity: v }))}>
              <SelectTrigger className="border-gray-300 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["leve", "moderada", "alta", "muito alta"].map((i) => (
                  <SelectItem key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {buttons.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            onClick={() => onGenerate(type, options)}
            disabled={!!generating}
            className="bg-black text-white hover:bg-gray-800"
          >
            {generating === type ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Icon className="mr-2 h-4 w-4" />}
            {label}
          </Button>
        ))}
        <Button
          onClick={() => {
            onGenerate("treino", options);
            setTimeout(() => onGenerate("dieta", options), 1000);
            setTimeout(() => onGenerate("mentalidade", options), 2000);
          }}
          disabled={!!generating}
          className="bg-[#FFC400] text-black hover:bg-[#FFC400]/90 font-semibold"
        >
          <Sparkles className="mr-2 h-4 w-4" /> Gerar Completo
        </Button>
      </div>
    </div>
  );
}
