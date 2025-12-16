import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Plus, 
  Trash2, 
  Apple, 
  Utensils,
  MessageSquare,
  RefreshCw,
  Loader2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface Refeicao {
  nome: string;
  horario: string;
  alimentos: string[];
  calorias_aproximadas?: number;
  observacoes?: string;
}

interface NutritionContent {
  titulo: string;
  objetivo: string;
  calorias_diarias: number;
  macros: {
    proteinas: string;
    carboidratos: string;
    gorduras: string;
  };
  refeicoes: Refeicao[];
  dicas_gerais?: string[];
}

interface NutritionProtocolEditorProps {
  protocol: {
    id: string;
    user_id: string;
    tipo: string;
    titulo: string;
    conteudo: any;
  };
  onSave: (content: any) => Promise<void>;
  onRegenerate: (adjustments: string) => Promise<void>;
  saving: boolean;
  regenerating: boolean;
}

export function NutritionProtocolEditor({ 
  protocol, 
  onSave, 
  onRegenerate, 
  saving, 
  regenerating 
}: NutritionProtocolEditorProps) {
  const [content, setContent] = useState<NutritionContent>(protocol.conteudo);
  const [adjustments, setAdjustments] = useState("");
  const [showRegenerateInput, setShowRegenerateInput] = useState(false);

  const updateRefeicao = (index: number, field: keyof Refeicao, value: any) => {
    const newContent = { ...content };
    if (newContent.refeicoes?.[index]) {
      newContent.refeicoes[index] = {
        ...newContent.refeicoes[index],
        [field]: value
      };
      setContent(newContent);
    }
  };

  const updateAlimento = (refeicaoIndex: number, alimentoIndex: number, value: string) => {
    const newContent = { ...content };
    if (newContent.refeicoes?.[refeicaoIndex]?.alimentos) {
      newContent.refeicoes[refeicaoIndex].alimentos[alimentoIndex] = value;
      setContent(newContent);
    }
  };

  const addAlimento = (refeicaoIndex: number) => {
    const newContent = { ...content };
    if (newContent.refeicoes?.[refeicaoIndex]) {
      newContent.refeicoes[refeicaoIndex].alimentos.push("Novo alimento");
      setContent(newContent);
    }
  };

  const removeAlimento = (refeicaoIndex: number, alimentoIndex: number) => {
    const newContent = { ...content };
    if (newContent.refeicoes?.[refeicaoIndex]?.alimentos) {
      newContent.refeicoes[refeicaoIndex].alimentos.splice(alimentoIndex, 1);
      setContent(newContent);
    }
  };

  const addRefeicao = () => {
    const newContent = { ...content };
    newContent.refeicoes.push({
      nome: "Nova Refeição",
      horario: "12:00",
      alimentos: ["Alimento 1"],
      calorias_aproximadas: 300,
      observacoes: ""
    });
    setContent(newContent);
  };

  const removeRefeicao = (index: number) => {
    const newContent = { ...content };
    newContent.refeicoes.splice(index, 1);
    setContent(newContent);
  };

  const updateMacros = (field: string, value: string) => {
    setContent({
      ...content,
      macros: {
        ...content.macros,
        [field]: value
      }
    });
  };

  const handleSave = async () => {
    try {
      await onSave(content);
      toast.success("Protocolo de nutrição salvo com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar protocolo");
    }
  };

  const handleRegenerate = async () => {
    await onRegenerate(adjustments);
    setAdjustments("");
    setShowRegenerateInput(false);
  };

  if (!content?.refeicoes) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Estrutura do protocolo não reconhecida
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header with actions */}
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold truncate">{content.titulo}</h3>
          <Badge variant="secondary">{content.objetivo}</Badge>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => setShowRegenerateInput(!showRegenerateInput)}
            variant="outline"
            disabled={regenerating}
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="text-xs sm:text-sm">Gerar Novo Protocolo</span>
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="fire" size="sm" className="w-full sm:w-auto">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            <span className="text-xs sm:text-sm">Salvar Alterações</span>
          </Button>
        </div>
      </div>

      {/* Regenerate input */}
      {showRegenerateInput && (
        <Card className="border-primary/30">
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Ajustes para o novo protocolo</Label>
              <Textarea
                placeholder="Descreva as alterações desejadas: mais proteína, menos carboidrato, refeições menores..."
                value={adjustments}
                onChange={(e) => setAdjustments(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={handleRegenerate} disabled={regenerating} variant="fire" className="w-full">
              {regenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Novo Protocolo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Macros summary */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Macros Diários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Calorias</Label>
              <Input
                type="number"
                value={content.calorias_diarias}
                onChange={(e) => setContent({ ...content, calorias_diarias: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Proteínas</Label>
              <Input
                value={content.macros?.proteinas || ""}
                onChange={(e) => updateMacros("proteinas", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Carboidratos</Label>
              <Input
                value={content.macros?.carboidratos || ""}
                onChange={(e) => updateMacros("carboidratos", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Gorduras</Label>
              <Input
                value={content.macros?.gorduras || ""}
                onChange={(e) => updateMacros("gorduras", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meals accordion */}
      <Accordion type="multiple" className="space-y-4">
        {content.refeicoes.map((refeicao, refeicaoIndex) => (
          <AccordionItem key={refeicaoIndex} value={`meal-${refeicaoIndex}`} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Utensils className="h-4 w-4 text-primary" />
                <span className="font-display">{refeicao.nome}</span>
                <Badge variant="outline" className="ml-2">{refeicao.horario}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="bg-background rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="font-medium">Detalhes da Refeição</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRefeicao(refeicaoIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nome</Label>
                    <Input
                      value={refeicao.nome}
                      onChange={(e) => updateRefeicao(refeicaoIndex, "nome", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Horário</Label>
                    <Input
                      value={refeicao.horario}
                      onChange={(e) => updateRefeicao(refeicaoIndex, "horario", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Calorias Aprox.</Label>
                    <Input
                      type="number"
                      value={refeicao.calorias_aproximadas || ""}
                      onChange={(e) => updateRefeicao(refeicaoIndex, "calorias_aproximadas", parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {/* Foods list */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Apple className="h-3 w-3" /> Alimentos
                  </Label>
                  {refeicao.alimentos?.map((alimento, alimentoIndex) => (
                    <div key={alimentoIndex} className="flex gap-2">
                      <Input
                        value={alimento}
                        onChange={(e) => updateAlimento(refeicaoIndex, alimentoIndex, e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAlimento(refeicaoIndex, alimentoIndex)}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addAlimento(refeicaoIndex)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Alimento
                  </Button>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Observações
                  </Label>
                  <Textarea
                    value={refeicao.observacoes || ""}
                    onChange={(e) => updateRefeicao(refeicaoIndex, "observacoes", e.target.value)}
                    placeholder="Observações sobre esta refeição..."
                    rows={2}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Button variant="outline" onClick={addRefeicao} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Refeição
      </Button>
    </div>
  );
}
