import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrainingHistoryFieldsProps {
  formData: {
    ja_treinou_antes: string;
    local_treino: string;
    dias_disponiveis: string;
    nivel_condicionamento: string;
    pratica_aerobica: string;
    escada_sem_cansar: string;
  };
  onChange: (field: string, value: string) => void;
}

export function TrainingHistoryFields({ formData, onChange }: TrainingHistoryFieldsProps) {
  return (
    <>
      {/* Histórico de Treino */}
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
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="treinou-sim" />
                <Label htmlFor="treinou-sim" className="font-normal">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="treinou-nao" />
                <Label htmlFor="treinou-nao" className="font-normal">Não</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Onde prefere treinar? *</Label>
            <Select
              value={formData.local_treino}
              onValueChange={(value) => onChange("local_treino", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Academia">Academia</SelectItem>
                <SelectItem value="Casa">Casa</SelectItem>
                <SelectItem value="Ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantos dias na semana pode treinar? *</Label>
            <Select
              value={formData.dias_disponiveis}
              onValueChange={(value) => onChange("dias_disponiveis", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2x">2x por semana</SelectItem>
                <SelectItem value="3x">3x por semana</SelectItem>
                <SelectItem value="4x">4x por semana</SelectItem>
                <SelectItem value="5x">5x por semana</SelectItem>
                <SelectItem value="6x">6x por semana</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Condicionamento Físico */}
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
                <SelectItem value="Sedentário">Sedentário</SelectItem>
                <SelectItem value="Iniciante">Iniciante</SelectItem>
                <SelectItem value="Intermediário">Intermediário</SelectItem>
                <SelectItem value="Avançado">Avançado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pratica atividade aeróbica?</Label>
            <RadioGroup
              value={formData.pratica_aerobica}
              onValueChange={(value) => onChange("pratica_aerobica", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="aerobica-sim" />
                <Label htmlFor="aerobica-sim" className="font-normal">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="aerobica-nao" />
                <Label htmlFor="aerobica-nao" className="font-normal">Não</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Consegue subir 3 lances de escada sem cansar?</Label>
            <RadioGroup
              value={formData.escada_sem_cansar}
              onValueChange={(value) => onChange("escada_sem_cansar", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="escada-sim" />
                <Label htmlFor="escada-sim" className="font-normal">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="escada-nao" />
                <Label htmlFor="escada-nao" className="font-normal">Não</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dificuldade" id="escada-dificuldade" />
                <Label htmlFor="escada-dificuldade" className="font-normal">Com dificuldade</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
