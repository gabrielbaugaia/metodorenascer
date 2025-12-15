import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ObjectivesSectionProps {
  objetivo_principal: string;
  onChange: (field: string, value: string) => void;
}

export function ObjectivesSection({ objetivo_principal, onChange }: ObjectivesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Objetivos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Objetivo Principal *</Label>
          <Select
            value={objetivo_principal}
            onValueChange={(value) => onChange("objetivo_principal", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione seu objetivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="emagrecimento">Emagrecimento / Perda de gordura</SelectItem>
              <SelectItem value="hipertrofia">Ganho de massa muscular</SelectItem>
              <SelectItem value="definicao">Definição muscular</SelectItem>
              <SelectItem value="saude">Melhorar saúde geral</SelectItem>
              <SelectItem value="condicionamento">Melhorar condicionamento físico</SelectItem>
              <SelectItem value="força">Aumentar força</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
