import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ObservationsSectionProps {
  observacoes_adicionais: string;
  onChange: (field: string, value: string) => void;
}

export function ObservationsSection({ observacoes_adicionais, onChange }: ObservationsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Observações Adicionais</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="observacoes_adicionais">
            Algo mais que você gostaria de nos contar?
          </Label>
          <Textarea
            id="observacoes_adicionais"
            placeholder="Conte-nos mais sobre seus objetivos, motivações, desafios..."
            value={observacoes_adicionais}
            onChange={(e) => onChange("observacoes_adicionais", e.target.value)}
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
