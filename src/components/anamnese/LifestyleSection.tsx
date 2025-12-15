import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LifestyleSectionProps {
  formData: {
    qualidade_sono: string;
    nivel_estresse: string;
    consome_alcool: string;
    fuma: string;
  };
  onChange: (field: string, value: string) => void;
}

export function LifestyleSection({ formData, onChange }: LifestyleSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estilo de Vida</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Qualidade do sono</Label>
          <Select
            value={formData.qualidade_sono}
            onValueChange={(value) => onChange("qualidade_sono", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excelente">Excelente (8h+ por noite, acordo descansado)</SelectItem>
              <SelectItem value="boa">Boa (6-8h, geralmente descansado)</SelectItem>
              <SelectItem value="regular">Regular (5-6h, às vezes cansado)</SelectItem>
              <SelectItem value="ruim">Ruim (menos de 5h, sempre cansado)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Nível de estresse</Label>
          <Select
            value={formData.nivel_estresse}
            onValueChange={(value) => onChange("nivel_estresse", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixo">Baixo</SelectItem>
              <SelectItem value="moderado">Moderado</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
              <SelectItem value="muito_alto">Muito alto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Consome bebidas alcoólicas?</Label>
          <Select
            value={formData.consome_alcool}
            onValueChange={(value) => onChange("consome_alcool", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nao">Não bebo</SelectItem>
              <SelectItem value="raramente">Raramente (1-2x por mês)</SelectItem>
              <SelectItem value="socialmente">Socialmente (fins de semana)</SelectItem>
              <SelectItem value="frequentemente">Frequentemente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fuma?</Label>
          <Select
            value={formData.fuma}
            onValueChange={(value) => onChange("fuma", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nao">Não</SelectItem>
              <SelectItem value="parei">Parei há menos de 1 ano</SelectItem>
              <SelectItem value="ocasionalmente">Ocasionalmente</SelectItem>
              <SelectItem value="sim">Sim, regularmente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
