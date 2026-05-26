import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import type { Sex } from "@/lib/vo2maxCalc";

export interface AstrandData {
  peso_kg: number;
  sex: Sex;
  watts: number;
  fc_5min?: number;
  fc_6min?: number;
  test_date: string;
  local?: string;
  notas?: string;
  screenshotFile?: File | null;
}

interface Props {
  onSubmit: (data: AstrandData) => void;
  onBack: () => void;
}

const INSTRUCTIONS = [
  "Ajuste o banco da bike para extensão quase total da perna",
  "Pedale em cadência constante de 50–60 RPM por 6 minutos",
  "Mantenha a carga constante durante todo o teste",
  "Meça a FC nos últimos 30 segundos do 5º e 6º minuto",
  "Use a média das duas medições de FC",
];

export function Vo2MaxAstrandForm({ onSubmit, onBack }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [step, setStep] = useState<1 | 2>(1);
  const [sex, setSex] = useState<Sex>("M");
  const [peso, setPeso] = useState("");
  const [watts, setWatts] = useState("");
  const [fc5, setFc5] = useState("");
  const [fc6, setFc6] = useState("");
  const [date, setDate] = useState(today);
  const [local, setLocal] = useState("");
  const [notas, setNotas] = useState("");
  const [file, setFile] = useState<File | null>(null);

  if (step === 1) {
    return (
      <Card className="p-4 space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Passo 1 de 2</p>
          <h3 className="font-semibold text-foreground">Instruções — Astrand-Rhyming</h3>
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
    const p = Number(peso);
    const w = Number(watts);
    if (!p || !w || p <= 0 || w <= 0) return;
    onSubmit({
      peso_kg: p,
      sex,
      watts: w,
      fc_5min: fc5 ? Number(fc5) : undefined,
      fc_6min: fc6 ? Number(fc6) : undefined,
      test_date: date,
      local: local || undefined,
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Sexo</Label>
          <Select value={sex} onValueChange={(v) => setSex(v as Sex)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Peso (kg) *</Label>
          <Input type="number" placeholder="75" value={peso} onChange={(e) => setPeso(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Carga na bike (Watts) *</Label>
        <Input type="number" placeholder="150" value={watts} onChange={(e) => setWatts(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">FC 5º min (bpm)</Label>
          <Input type="number" placeholder="148" value={fc5} onChange={(e) => setFc5(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">FC 6º min (bpm)</Label>
          <Input type="number" placeholder="152" value={fc6} onChange={(e) => setFc6(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Local</Label>
          <Input placeholder="Studio" value={local} onChange={(e) => setLocal(e.target.value)} />
        </div>
      </div>

      <Textarea placeholder="Observações" value={notas} onChange={(e) => setNotas(e.target.value)} className="min-h-[60px]" />

      <div>
        <Label className="text-xs">Anexar print</Label>
        <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>
        <Button className="flex-1" onClick={submit}>Calcular VO2 Máx</Button>
      </div>
    </Card>
  );
}
