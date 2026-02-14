import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ClientAnalysis {
  summary: string;
  objectives: string;
  strengths: string;
  attention_points: string;
  suggested_strategy: string;
  trainer_direction: string;
}

interface Props {
  analysis: ClientAnalysis;
  onChange: (field: keyof ClientAnalysis, value: string) => void;
}

const FIELDS: { key: keyof ClientAnalysis; label: string; priority?: boolean }[] = [
  { key: "summary", label: "Resumo do Cliente" },
  { key: "objectives", label: "Objetivos Detectados" },
  { key: "strengths", label: "Pontos Fortes" },
  { key: "attention_points", label: "Pontos de Atenção" },
  { key: "suggested_strategy", label: "Estratégia Sugerida" },
  { key: "trainer_direction", label: "Direcionamento Técnico do Treinador", priority: true },
];

export function MqoAnalysisPanel({ analysis, onChange }: Props) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 flex items-center gap-2">
        <div className="w-1 h-4 bg-[#FFC400] rounded-sm" />
        Análise + Edição Manual
      </h3>

      <div className="grid gap-4">
        {FIELDS.map(({ key, label, priority }) => (
          <div key={key} className={priority ? "bg-[#FFC400]/5 border-2 border-[#FFC400] rounded-lg p-4" : ""}>
            <Label className={`text-xs uppercase tracking-wider ${priority ? "text-black font-bold" : "text-gray-500"}`}>
              {label}
              {priority && (
                <span className="ml-2 text-[10px] bg-[#FFC400] text-black px-2 py-0.5 rounded-full font-bold">
                  PRIORITÁRIO
                </span>
              )}
            </Label>
            <Textarea
              value={analysis[key] || ""}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={priority ? "Instruções que terão prioridade máxima na geração..." : `${label}...`}
              rows={priority ? 5 : 3}
              className={`mt-1 resize-none border-gray-300 focus:ring-[#FFC400] focus:border-[#FFC400] ${priority ? "text-sm font-medium" : "text-sm"}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
