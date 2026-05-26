import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

export interface CooperData {
  distancia_m: number;
  test_date: string;
  local?: string;
  temperatura?: number;
  notas?: string;
  screenshotFile?: File | null;
}

interface Props {
  onSubmit: (data: CooperData) => void;
  onBack: () => void;
}

const INSTRUCTIONS = [
  "Aqueça por 5–10 minutos com caminhada leve",
  "Corra o máximo de distância possível em 12 minutos contínuos",
  "Mantenha ritmo constante — não comece rápido e pare depois",
  "Use GPS do celular ou meça a pista previamente",
  "Evite fazer em dias de calor extremo ou vento forte",
  "Realize em jejum de no mínimo 2 horas",
];

export function Vo2MaxCooperForm({ onSubmit, onBack }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [step, setStep] = useState<1 | 2>(1);
  const [distancia, setDistancia] = useState("");
  const [date, setDate] = useState(today);
  const [local, setLocal] = useState("");
  const [temp, setTemp] = useState("");
  const [notas, setNotas] = useState("");
  const [file, setFile] = useState<File | null>(null);

  if (step === 1) {
    return (
      <Card className="p-4 space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Passo 1 de 2</p>
          <h3 className="font-semibold text-foreground">Instruções — Teste de Cooper</h3>
        </div>
        <ul className="space-y-2">
          {INSTRUCTIONS.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>
          <Button className="flex-1" onClick={() => setStep(2)}>
            Continuar <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }

  const submit = () => {
    const d = Number(distancia);
    if (!d || d <= 0) return;
    onSubmit({
      distancia_m: d,
      test_date: date,
      local: local || undefined,
      temperatura: temp ? Number(temp) : undefined,
      notas: notas || undefined,
      screenshotFile: file,
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Passo 2 de 2</p>
        <h3 className="font-semibold text-foreground">Dados do Teste</h3>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Distância percorrida (metros) *</Label>
        <Input type="number" placeholder="2400" value={distancia} onChange={(e) => setDistancia(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Data do teste</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Temperatura (°C)</Label>
          <Input type="number" placeholder="22" value={temp} onChange={(e) => setTemp(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Local</Label>
        <Input placeholder="Pista do parque municipal" value={local} onChange={(e) => setLocal(e.target.value)} />
      </div>

      <Textarea placeholder="Observações" value={notas} onChange={(e) => setNotas(e.target.value)} className="min-h-[60px]" />

      <div>
        <Label className="text-xs">Anexar print (GPS/relógio)</Label>
        <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>
        <Button className="flex-1" onClick={submit}>Calcular VO2 Máx</Button>
      </div>
    </Card>
  );
}
