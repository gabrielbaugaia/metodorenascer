import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell } from "lucide-react";

interface TrainingPreferencesSectionProps {
  preferencias_treino: string;
  onChange: (field: string, value: string) => void;
}

export function TrainingPreferencesSection({ preferencias_treino, onChange }: TrainingPreferencesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          Seus Desejos para o Treino
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Label htmlFor="preferencias_treino">
            Descreva suas preferências e prioridades de treino
          </Label>
          <Textarea
            id="preferencias_treino"
            placeholder="Conte-nos sobre suas preferências de treino. Por exemplo:&#10;&#10;• Quer dar mais ênfase em glúteos e pernas?&#10;• Prefere não treinar muito braço?&#10;• Gosta de treinos mais curtos e intensos ou mais longos e leves?&#10;• Tem algum exercício favorito ou que não gosta?&#10;• Quer focar em força, resistência ou estética?&#10;• Algo sobre sua rotina que devemos considerar?&#10;&#10;Descreva livremente o que espera do seu programa."
            value={preferencias_treino}
            onChange={(e) => onChange("preferencias_treino", e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            💡 Campo opcional — quanto mais detalhes você compartilhar, mais personalizado será seu treino.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
