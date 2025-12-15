import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EatingHabitsSectionProps {
  formData: {
    refeicoes_por_dia: string;
    bebe_agua_frequente: string;
    restricoes_alimentares: string;
  };
  onChange: (field: string, value: string) => void;
}

export function EatingHabitsSection({ formData, onChange }: EatingHabitsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hábitos Alimentares</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Quantas refeições faz por dia?</Label>
          <Select
            value={formData.refeicoes_por_dia}
            onValueChange={(value) => onChange("refeicoes_por_dia", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 refeições</SelectItem>
              <SelectItem value="3">3 refeições</SelectItem>
              <SelectItem value="4">4 refeições</SelectItem>
              <SelectItem value="5">5 refeições</SelectItem>
              <SelectItem value="6+">6 ou mais refeições</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Bebe água com frequência?</Label>
          <RadioGroup
            value={formData.bebe_agua_frequente}
            onValueChange={(value) => onChange("bebe_agua_frequente", value)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id="agua-sim" />
              <Label htmlFor="agua-sim">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="agua-nao" />
              <Label htmlFor="agua-nao">Não</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="restricoes_alimentares">Restrições alimentares ou alergias?</Label>
          <Textarea
            id="restricoes_alimentares"
            placeholder="Ex: intolerância à lactose, alergia a frutos do mar, vegetariano..."
            value={formData.restricoes_alimentares}
            onChange={(e) => onChange("restricoes_alimentares", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
