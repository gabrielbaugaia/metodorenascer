import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrainingHistorySectionProps {
  formData: {
    ja_treinou_antes: string;
    local_treino: string;
    dias_disponiveis: string;
  };
  onChange: (field: string, value: string) => void;
}

export function TrainingHistorySection({ formData, onChange }: TrainingHistorySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Treino</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Já treinou antes? *</Label>
          <RadioGroup
            value={formData.ja_treinou_antes}
            onValueChange={(value) => onChange("ja_treinou_antes", value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="treinou-sim" />
              <Label htmlFor="treinou-sim">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="treinou-nao" />
              <Label htmlFor="treinou-nao">Não</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Onde pretende treinar?</Label>
          <Select
            value={formData.local_treino}
            onValueChange={(value) => onChange("local_treino", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casa">Em casa</SelectItem>
              <SelectItem value="academia">Academia</SelectItem>
              <SelectItem value="ambos">Ambos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Quantos dias por semana pode treinar? *</Label>
          <Select
            value={formData.dias_disponiveis}
            onValueChange={(value) => onChange("dias_disponiveis", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 dias</SelectItem>
              <SelectItem value="3">3 dias</SelectItem>
              <SelectItem value="4">4 dias</SelectItem>
              <SelectItem value="5">5 dias</SelectItem>
              <SelectItem value="6">6 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
