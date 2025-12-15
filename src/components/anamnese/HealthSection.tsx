import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HealthSectionProps {
  formData: {
    condicoes_saude: string;
    injuries: string;
    toma_medicamentos: string;
    medicamentos_detalhes: string;
  };
  onChange: (field: string, value: string) => void;
}

export function HealthSection({ formData, onChange }: HealthSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saúde</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="condicoes_saude">Possui alguma condição de saúde?</Label>
          <Textarea
            id="condicoes_saude"
            placeholder="Ex: diabetes, hipertensão, problemas cardíacos..."
            value={formData.condicoes_saude}
            onChange={(e) => onChange("condicoes_saude", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="injuries">Lesões ou dores crônicas?</Label>
          <Textarea
            id="injuries"
            placeholder="Ex: dor no joelho, hérnia de disco, tendinite..."
            value={formData.injuries}
            onChange={(e) => onChange("injuries", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Toma medicamentos regularmente?</Label>
          <RadioGroup
            value={formData.toma_medicamentos}
            onValueChange={(value) => onChange("toma_medicamentos", value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="med-sim" />
              <Label htmlFor="med-sim">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="med-nao" />
              <Label htmlFor="med-nao">Não</Label>
            </div>
          </RadioGroup>
        </div>

        {formData.toma_medicamentos === "sim" && (
          <div className="space-y-2">
            <Label htmlFor="medicamentos_detalhes">Quais medicamentos?</Label>
            <Input
              id="medicamentos_detalhes"
              placeholder="Liste os medicamentos que você toma"
              value={formData.medicamentos_detalhes}
              onChange={(e) => onChange("medicamentos_detalhes", e.target.value)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
