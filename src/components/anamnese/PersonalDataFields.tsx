import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PersonalDataFieldsProps {
  formData: {
    data_nascimento: string;
    weight: string;
    height: string;
    whatsapp: string;
    sexo: string;
  };
  onChange: (field: string, value: string) => void;
}

export function PersonalDataFields({ formData, onChange }: PersonalDataFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Pessoais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
          <Input
            id="data_nascimento"
            type="date"
            value={formData.data_nascimento}
            onChange={(e) => onChange("data_nascimento", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Peso (kg) *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="Ex: 70.5"
              value={formData.weight}
              onChange={(e) => onChange("weight", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Altura (cm) *</Label>
            <Input
              id="height"
              type="number"
              placeholder="Ex: 170"
              value={formData.height}
              onChange={(e) => onChange("height", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sexo">Sexo</Label>
          <Select
            value={formData.sexo}
            onValueChange={(value) => onChange("sexo", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="feminino">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            type="tel"
            placeholder="Ex: (11) 98765-4321"
            value={formData.whatsapp}
            onChange={(e) => onChange("whatsapp", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
