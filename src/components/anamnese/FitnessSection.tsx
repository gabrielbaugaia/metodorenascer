import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FitnessSectionProps {
  formData: {
    nivel_condicionamento: string;
    pratica_aerobica: string;
    escada_sem_cansar: string;
  };
  onChange: (field: string, value: string) => void;
}

export function FitnessSection({ formData, onChange }: FitnessSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Condicionamento Físico</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nível de condicionamento atual *</Label>
          <Select
            value={formData.nivel_condicionamento}
            onValueChange={(value) => onChange("nivel_condicionamento", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="iniciante">Iniciante (sedentário ou pouca atividade)</SelectItem>
              <SelectItem value="intermediario">Intermediário (ativo, treina há alguns meses)</SelectItem>
              <SelectItem value="avancado">Avançado (treina há mais de 1 ano consistentemente)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Pratica alguma atividade aeróbica?</Label>
          <RadioGroup
            value={formData.pratica_aerobica}
            onValueChange={(value) => onChange("pratica_aerobica", value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="aerobica-sim" />
              <Label htmlFor="aerobica-sim">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="aerobica-nao" />
              <Label htmlFor="aerobica-nao">Não</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Consegue subir 3 lances de escada sem cansar?</Label>
          <RadioGroup
            value={formData.escada_sem_cansar}
            onValueChange={(value) => onChange("escada_sem_cansar", value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="escada-sim" />
              <Label htmlFor="escada-sim">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="escada-nao" />
              <Label htmlFor="escada-nao">Não</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="parcialmente" id="escada-parcial" />
              <Label htmlFor="escada-parcial">Parcialmente</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
