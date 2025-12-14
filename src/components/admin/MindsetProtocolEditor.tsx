import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Save, 
  Plus, 
  Trash2, 
  Brain,
  Sun,
  Moon,
  X,
  RefreshCw,
  Loader2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface MindsetPratica {
  nome: string;
  descricao: string;
}

interface MindsetContent {
  titulo: string;
  mentalidade_necessaria: {
    titulo: string;
    descricao: string;
    reflexao: string;
  };
  rotina_manha: {
    duracao: string;
    praticas: MindsetPratica[];
  };
  rotina_noite: {
    duracao: string;
    praticas: MindsetPratica[];
  };
  crencas_limitantes: {
    crenca: string;
    reformulacao: string;
    acao: string;
  }[];
  afirmacoes_personalizadas?: string[];
}

interface MindsetProtocolEditorProps {
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

export function MindsetProtocolEditor({ 
  protocol, 
  onSave, 
  onRegenerate, 
  saving, 
  regenerating 
}: MindsetProtocolEditorProps) {
  const [content, setContent] = useState<MindsetContent>(protocol.conteudo);
  const [adjustments, setAdjustments] = useState("");
  const [showRegenerateInput, setShowRegenerateInput] = useState(false);

  const updateMentalidade = (field: string, value: string) => {
    setContent({
      ...content,
      mentalidade_necessaria: {
        ...content.mentalidade_necessaria,
        [field]: value
      }
    });
  };

  const updatePratica = (rotina: 'rotina_manha' | 'rotina_noite', index: number, field: keyof MindsetPratica, value: string) => {
    const newContent = { ...content };
    if (newContent[rotina]?.praticas?.[index]) {
      newContent[rotina].praticas[index] = {
        ...newContent[rotina].praticas[index],
        [field]: value
      };
      setContent(newContent);
    }
  };

  const addPratica = (rotina: 'rotina_manha' | 'rotina_noite') => {
    const newContent = { ...content };
    newContent[rotina].praticas.push({
      nome: "Nova prática",
      descricao: "Descrição da prática"
    });
    setContent(newContent);
  };

  const removePratica = (rotina: 'rotina_manha' | 'rotina_noite', index: number) => {
    const newContent = { ...content };
    newContent[rotina].praticas.splice(index, 1);
    setContent(newContent);
  };

  const updateCrencaLimitante = (index: number, field: string, value: string) => {
    const newContent = { ...content };
    if (newContent.crencas_limitantes?.[index]) {
      newContent.crencas_limitantes[index] = {
        ...newContent.crencas_limitantes[index],
        [field]: value
      };
      setContent(newContent);
    }
  };

  const addCrencaLimitante = () => {
    const newContent = { ...content };
    newContent.crencas_limitantes.push({
      crenca: "Nova crença limitante",
      reformulacao: "Reformulação positiva",
      acao: "Ação prática"
    });
    setContent(newContent);
  };

  const removeCrencaLimitante = (index: number) => {
    const newContent = { ...content };
    newContent.crencas_limitantes.splice(index, 1);
    setContent(newContent);
  };

  const handleSave = async () => {
    try {
      await onSave(content);
      toast.success("Protocolo de mindset salvo com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar protocolo");
    }
  };

  const handleRegenerate = async () => {
    await onRegenerate(adjustments);
    setAdjustments("");
    setShowRegenerateInput(false);
  };

  if (!content?.mentalidade_necessaria) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Estrutura do protocolo não reconhecida
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{content.titulo}</h3>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowRegenerateInput(!showRegenerateInput)}
            variant="outline"
            disabled={regenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Gerar Novo Protocolo
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="fire">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
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
                placeholder="Descreva as alterações desejadas: foco em ansiedade, mais práticas de manhã..."
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

      {/* Mentalidade Necessária */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Mentalidade Necessária
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Título</Label>
            <Input
              value={content.mentalidade_necessaria.titulo}
              onChange={(e) => updateMentalidade("titulo", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <Textarea
              value={content.mentalidade_necessaria.descricao}
              onChange={(e) => updateMentalidade("descricao", e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Reflexão</Label>
            <Textarea
              value={content.mentalidade_necessaria.reflexao}
              onChange={(e) => updateMentalidade("reflexao", e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rotina da Manhã */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="h-4 w-4 text-yellow-500" />
            Rotina da Manhã
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Duração:</Label>
            <Input
              value={content.rotina_manha?.duracao || ""}
              onChange={(e) => setContent({
                ...content,
                rotina_manha: { ...content.rotina_manha, duracao: e.target.value }
              })}
              className="w-32"
            />
          </div>
          
          {content.rotina_manha?.praticas?.map((pratica, index) => (
            <div key={index} className="bg-background rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Prática {index + 1}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePratica('rotina_manha', index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input
                  value={pratica.nome}
                  onChange={(e) => updatePratica('rotina_manha', index, 'nome', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <Textarea
                  value={pratica.descricao}
                  onChange={(e) => updatePratica('rotina_manha', index, 'descricao', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          ))}
          
          <Button variant="outline" size="sm" onClick={() => addPratica('rotina_manha')} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Prática
          </Button>
        </CardContent>
      </Card>

      {/* Rotina da Noite */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-400" />
            Rotina da Noite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Duração:</Label>
            <Input
              value={content.rotina_noite?.duracao || ""}
              onChange={(e) => setContent({
                ...content,
                rotina_noite: { ...content.rotina_noite, duracao: e.target.value }
              })}
              className="w-32"
            />
          </div>
          
          {content.rotina_noite?.praticas?.map((pratica, index) => (
            <div key={index} className="bg-background rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Prática {index + 1}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePratica('rotina_noite', index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input
                  value={pratica.nome}
                  onChange={(e) => updatePratica('rotina_noite', index, 'nome', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <Textarea
                  value={pratica.descricao}
                  onChange={(e) => updatePratica('rotina_noite', index, 'descricao', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          ))}
          
          <Button variant="outline" size="sm" onClick={() => addPratica('rotina_noite')} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Prática
          </Button>
        </CardContent>
      </Card>

      {/* Crenças Limitantes */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <X className="h-4 w-4 text-red-500" />
            Crenças Limitantes para Superar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.crencas_limitantes?.map((crenca, index) => (
            <div key={index} className="bg-background rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Crença {index + 1}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCrencaLimitante(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Crença</Label>
                <Input
                  value={crenca.crenca}
                  onChange={(e) => updateCrencaLimitante(index, 'crenca', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Reformulação</Label>
                <Textarea
                  value={crenca.reformulacao}
                  onChange={(e) => updateCrencaLimitante(index, 'reformulacao', e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Ação</Label>
                <Input
                  value={crenca.acao}
                  onChange={(e) => updateCrencaLimitante(index, 'acao', e.target.value)}
                />
              </div>
            </div>
          ))}
          
          <Button variant="outline" size="sm" onClick={addCrencaLimitante} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Crença Limitante
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
