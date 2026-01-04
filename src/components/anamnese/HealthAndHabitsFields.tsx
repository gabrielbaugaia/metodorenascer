import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HealthAndHabitsFieldsProps {
  formData: {
    condicoes_saude: string;
    injuries: string;
    toma_medicamentos: string;
    medicamentos_detalhes: string;
    refeicoes_por_dia: string;
    bebe_agua_frequente: string;
    restricoes_alimentares: string;
    qualidade_sono: string;
    nivel_estresse: string;
    consome_alcool: string;
    fuma: string;
  };
  onChange: (field: string, value: string) => void;
}

export function HealthAndHabitsFields({ formData, onChange }: HealthAndHabitsFieldsProps) {
  return (
    <>
      {/* Saúde */}
      <Card>
        <CardHeader>
          <CardTitle>Saúde</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="condicoes_saude">Condições de saúde (se houver)</Label>
            <Input
              id="condicoes_saude"
              placeholder="Ex: Hipertensão, diabetes, etc."
              value={formData.condicoes_saude}
              onChange={(e) => onChange("condicoes_saude", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="injuries">Limitações físicas ou lesões</Label>
            <Input
              id="injuries"
              placeholder="Ex: Dor no joelho, problema na coluna, etc."
              value={formData.injuries}
              onChange={(e) => onChange("injuries", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Toma medicamentos regularmente?</Label>
            <RadioGroup
              value={formData.toma_medicamentos}
              onValueChange={(value) => onChange("toma_medicamentos", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="medicamentos-sim" />
                <Label htmlFor="medicamentos-sim" className="font-normal">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="medicamentos-nao" />
                <Label htmlFor="medicamentos-nao" className="font-normal">Não</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.toma_medicamentos === "sim" && (
            <div className="space-y-2">
              <Label htmlFor="medicamentos_detalhes">Quais medicamentos e para que são utilizados?</Label>
              <Textarea
                id="medicamentos_detalhes"
                placeholder="Ex: Losartana 50mg (hipertensão) 1x ao dia, Metformina 850mg (diabetes) 2x ao dia"
                value={formData.medicamentos_detalhes}
                onChange={(e) => onChange("medicamentos_detalhes", e.target.value)}
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hábitos Alimentares */}
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
                <SelectItem value="1-2">1-2 refeições</SelectItem>
                <SelectItem value="3">3 refeições</SelectItem>
                <SelectItem value="4">4 refeições</SelectItem>
                <SelectItem value="5">5 refeições</SelectItem>
                <SelectItem value="6+">6 ou mais refeições</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Bebe água frequentemente?</Label>
            <RadioGroup
              value={formData.bebe_agua_frequente}
              onValueChange={(value) => onChange("bebe_agua_frequente", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="agua-sim" />
                <Label htmlFor="agua-sim" className="font-normal">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="agua-nao" />
                <Label htmlFor="agua-nao" className="font-normal">Não</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="restricoes_alimentares">Restrições alimentares</Label>
            <Input
              id="restricoes_alimentares"
              placeholder="Ex: Intolerância à lactose, vegetariano, etc."
              value={formData.restricoes_alimentares}
              onChange={(e) => onChange("restricoes_alimentares", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Estilo de Vida */}
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
                <SelectItem value="Excelente">Excelente</SelectItem>
                <SelectItem value="Boa">Boa</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Ruim">Ruim</SelectItem>
                <SelectItem value="Péssima">Péssima</SelectItem>
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
                <SelectItem value="Baixo">Baixo</SelectItem>
                <SelectItem value="Moderado">Moderado</SelectItem>
                <SelectItem value="Alto">Alto</SelectItem>
                <SelectItem value="Muito alto">Muito alto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Consome álcool?</Label>
            <RadioGroup
              value={formData.consome_alcool}
              onValueChange={(value) => onChange("consome_alcool", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="alcool-nao" />
                <Label htmlFor="alcool-nao" className="font-normal">Não</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="raramente" id="alcool-raramente" />
                <Label htmlFor="alcool-raramente" className="font-normal">Raramente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="socialmente" id="alcool-socialmente" />
                <Label htmlFor="alcool-socialmente" className="font-normal">Socialmente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="frequentemente" id="alcool-frequentemente" />
                <Label htmlFor="alcool-frequentemente" className="font-normal">Frequentemente</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Fuma?</Label>
            <RadioGroup
              value={formData.fuma}
              onValueChange={(value) => onChange("fuma", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="fuma-nao" />
                <Label htmlFor="fuma-nao" className="font-normal">Não</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="raramente" id="fuma-raramente" />
                <Label htmlFor="fuma-raramente" className="font-normal">Raramente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="fuma-sim" />
                <Label htmlFor="fuma-sim" className="font-normal">Sim</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
