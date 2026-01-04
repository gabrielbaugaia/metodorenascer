import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Sun, 
  Moon, 
  Zap, 
  X,
  Download,
  Loader2,
  CheckCircle,
  Target,
  MessageCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProtocol } from "@/hooks/useProtocol";

interface MindsetPratica {
  nome: string;
  descricao?: string;
  duracao?: string;
  por_que?: string;
}

interface MindsetProtocol {
  titulo: string;
  mentalidade_necessaria?: {
    titulo: string;
    descricao: string;
    reflexao?: string;
    foco_do_ciclo?: string;
    comportamento_chave?: string;
  };
  rotina_manha?: {
    duracao?: string;
    duracao_total?: string;
    praticas?: MindsetPratica[];
  };
  rotina_noite?: {
    duracao?: string;
    duracao_total?: string;
    praticas?: MindsetPratica[];
  };
  crencas_limitantes?: {
    crenca?: string;
    crenca_original?: string;
    reformulacao: string;
    acao?: string;
    acao_pratica?: string;
    gatilho_identificado?: string;
  }[];
  habitos_semanais?: string[];
  afirmacoes_personalizadas?: (string | { afirmacao: string; comportamento_alvo?: string; quando_usar?: string })[];
}

export default function Mindset() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { protocol: protocolData, loading } = useProtocol("mindset");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      loadCheckedItems();
    }
  }, [user]);

  const loadCheckedItems = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("conversas")
        .select("mensagens")
        .eq("user_id", user.id)
        .eq("tipo", "mindset_progress")
        .maybeSingle();
      
      if (data?.mensagens) {
        setCheckedItems(data.mensagens as Record<string, boolean>);
      } else {
        const stored = localStorage.getItem(`mindset-progress-${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setCheckedItems(parsed);
          saveCheckedItems(parsed);
        }
      }
    } catch (error) {
      console.error("Error loading mindset progress:", error);
      const stored = localStorage.getItem(`mindset-progress-${user.id}`);
      if (stored) {
        setCheckedItems(JSON.parse(stored));
      }
    }
  };

  const saveCheckedItems = async (items: Record<string, boolean>) => {
    localStorage.setItem(`mindset-progress-${user?.id}`, JSON.stringify(items));
    
    if (!user) return;
    
    try {
      await supabase
        .from("conversas")
        .upsert({
          user_id: user.id,
          tipo: "mindset_progress",
          mensagens: items as any,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id,tipo" });
    } catch (error) {
      console.error("Error saving mindset progress:", error);
    }
  };

  const toggleItem = (key: string) => {
    const newChecked = { ...checkedItems, [key]: !checkedItems[key] };
    setCheckedItems(newChecked);
    saveCheckedItems(newChecked);
  };

  const content = protocolData?.conteudo as unknown as MindsetProtocol | null;

  const countProgress = () => {
    if (!content) return { completed: 0, total: 0 };
    
    const morningPractices = content.rotina_manha?.praticas?.length || 0;
    const nightPractices = content.rotina_noite?.praticas?.length || 0;
    const totalPractices = morningPractices + nightPractices;
    
    const completedCount = Object.values(checkedItems).filter(Boolean).length;
    return { completed: Math.min(completedCount, totalPractices), total: totalPractices };
  };

  const { completed, total } = countProgress();
  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  if (!protocolData || !content) {
    return (
      <ClientLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-display font-bold mb-2">Protocolo de Mindset</h1>
            <p className="text-muted-foreground mb-8">
              Seu protocolo de mentalidade ainda não foi gerado. Fale com seu mentor para solicitar ajustes.
            </p>
            <Button onClick={() => navigate("/suporte")} variant="fire" size="lg">
              <MessageCircle className="h-5 w-5 mr-2" />
              Falar com Mentor
            </Button>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Brain className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold uppercase text-foreground">MINDSET</h1>
          </div>
          <p className="text-muted-foreground uppercase text-sm">
            Reprogramação Mental para Transformação
          </p>
        </div>

        {/* Progress Card */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progresso semanal:</span>
              <span className="text-sm font-medium text-primary">
                {completed}/{total} práticas
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </CardContent>
        </Card>

        {/* Mentalidade Necessária */}
        {content.mentalidade_necessaria && (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-semibold uppercase">
                  Mentalidade Necessária
                </span>
              </div>
              <p className="text-lg mb-2">
                <span className="text-primary font-medium">
                  {content.mentalidade_necessaria.titulo}.
                </span>{" "}
                {content.mentalidade_necessaria.descricao}
              </p>
              <p className="text-sm text-muted-foreground">
                {content.mentalidade_necessaria.reflexao}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Rotina da Manhã */}
        {content.rotina_manha && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  ROTINA DA MANHÃ
                </CardTitle>
                <Badge variant="secondary" className="text-primary">
                  {content.rotina_manha.duracao || content.rotina_manha.duracao_total}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.rotina_manha.praticas?.map((pratica, index) => (
                <div
                  key={`manha-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleItem(`manha-${index}`)}
                >
                  <Checkbox
                    checked={checkedItems[`manha-${index}`] || false}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1">
                    <span className={checkedItems[`manha-${index}`] ? "line-through text-muted-foreground" : ""}>
                      {pratica.nome}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Rotina da Noite */}
        {content.rotina_noite && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Moon className="h-5 w-5 text-indigo-400" />
                  ROTINA DA NOITE
                </CardTitle>
                <Badge variant="secondary" className="text-primary">
                  {content.rotina_noite.duracao || content.rotina_noite.duracao_total}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.rotina_noite.praticas?.map((pratica, index) => (
                <div
                  key={`noite-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleItem(`noite-${index}`)}
                >
                  <Checkbox
                    checked={checkedItems[`noite-${index}`] || false}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1">
                    <span className={checkedItems[`noite-${index}`] ? "line-through text-muted-foreground" : ""}>
                      {pratica.nome}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Crenças Limitantes */}
        {content.crencas_limitantes && content.crencas_limitantes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Crenças Limitantes para Superar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue="crenca-0" className="space-y-2">
                {content.crencas_limitantes.map((item, index) => {
                  const crenca = item.crenca || item.crenca_original || "";
                  const acao = item.acao || item.acao_pratica || "";
                  return (
                    <AccordionItem key={index} value={`crenca-${index}`} className="border-none">
                      <AccordionTrigger className="py-3 px-4 bg-muted/30 rounded-lg hover:bg-muted/50 hover:no-underline">
                        <div className="flex items-center gap-3">
                          <X className="h-4 w-4 text-red-500" />
                          <span className="text-left">"{crenca}"</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-3 px-4 pb-0">
                        <div className="space-y-3 pl-7">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase mb-1">Reformulação</p>
                            <p className="text-sm text-green-500">{item.reformulacao}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase mb-1">Ação</p>
                            <p className="text-sm">{acao}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Afirmações Personalizadas */}
        {content.afirmacoes_personalizadas && content.afirmacoes_personalizadas.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                <Target className="h-4 w-4" />
                Afirmações Personalizadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {content.afirmacoes_personalizadas.map((afirmacao, index) => {
                const text = typeof afirmacao === 'string' ? afirmacao : afirmacao.afirmacao;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">{text}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            className="flex-1" 
            size="default"
            onClick={() => navigate("/suporte")}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            <span className="text-xs sm:text-sm">FALAR COM MENTOR</span>
          </Button>
          <Button 
            variant="default" 
            className="flex-1" 
            size="default"
            onClick={() => {
              if (protocolData && content) {
                import("@/lib/generateProtocolPdf").then(({ generateProtocolPdf }) => {
                  generateProtocolPdf({
                    id: protocolData.id,
                    tipo: "mindset",
                    titulo: content.titulo || "Protocolo de Mindset",
                    conteudo: protocolData.conteudo,
                    data_geracao: protocolData.data_geracao || new Date().toISOString(),
                  });
                });
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="text-xs sm:text-sm">BAIXAR PDF</span>
          </Button>
        </div>
      </div>
    </ClientLayout>
  );
}
