import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dumbbell, 
  Apple, 
  Sparkles, 
  Loader2, 
  FileText,
  Calendar,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { generateProtocolPdf } from "@/lib/generateProtocolPdf";

interface Protocol {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: any;
  data_geracao: string;
  ativo: boolean;
}

interface Profile {
  weight: number | null;
  height: number | null;
  goals: string | null;
  injuries: string | null;
  availability: string | null;
  nivel_experiencia: string | null;
  restricoes_medicas: string | null;
}

export default function Protocolos() {
  const { user } = useAuth();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch protocols
      const { data: protocolsData } = await supabase
        .from("protocolos")
        .select("*")
        .eq("user_id", user.id)
        .eq("ativo", true)
        .order("data_geracao", { ascending: false });

      setProtocols(protocolsData || []);

      // Fetch profile for context
      const { data: profileData } = await supabase
        .from("profiles")
        .select("weight, height, goals, injuries, availability, nivel_experiencia, restricoes_medicas")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateProtocol = async (tipo: "treino" | "nutricao") => {
    if (!user || !profile) {
      toast.error("Complete sua anamnese primeiro");
      return;
    }

    setGenerating(tipo);
    try {
      const { data, error } = await supabase.functions.invoke("generate-protocol", {
        body: {
          tipo,
          userId: user.id,
          userContext: {
            peso: profile.weight,
            altura: profile.height,
            objetivos: profile.goals,
            lesoes: profile.injuries,
            disponibilidade: profile.availability,
            nivel: profile.nivel_experiencia,
            restricoes: profile.restricoes_medicas,
          },
        },
      });

      if (error) throw error;

      toast.success(`Protocolo de ${tipo} gerado com sucesso!`);
      fetchData();
    } catch (error: any) {
      console.error("Error generating protocol:", error);
      toast.error(error.message || "Erro ao gerar protocolo");
    } finally {
      setGenerating(null);
    }
  };

  const treinoProtocols = protocols.filter(p => p.tipo === "treino");
  const nutricaoProtocols = protocols.filter(p => p.tipo === "nutricao");

  const renderTreinoContent = (conteudo: any) => {
    if (!conteudo?.semanas) return <p className="text-muted-foreground">Conteúdo não disponível</p>;

    return (
      <div className="space-y-4">
        {conteudo.observacoes_gerais && (
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {conteudo.observacoes_gerais}
          </p>
        )}
        <Accordion type="single" collapsible className="space-y-2">
          {conteudo.semanas?.map((semana: any, sIndex: number) => (
            <AccordionItem key={sIndex} value={`semana-${sIndex}`} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <span className="font-semibold">Semana {semana.semana}</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {semana.dias?.map((dia: any, dIndex: number) => (
                    <div key={dIndex} className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-primary">{dia.dia}</h4>
                        <Badge variant="outline">{dia.foco}</Badge>
                      </div>
                      <div className="space-y-2">
                        {dia.exercicios?.map((ex: any, eIndex: number) => (
                          <div key={eIndex} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                            <div>
                              <p className="font-medium">{ex.nome}</p>
                              {ex.dicas && <p className="text-xs text-muted-foreground">{ex.dicas}</p>}
                            </div>
                            <div className="text-sm text-right">
                              <p>{ex.series}x{ex.repeticoes}</p>
                              <p className="text-muted-foreground">{ex.descanso}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  };

  const renderNutricaoContent = (conteudo: any) => {
    if (!conteudo?.refeicoes) return <p className="text-muted-foreground">Conteúdo não disponível</p>;

    return (
      <div className="space-y-6">
        {/* Macros Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-primary">{conteudo.calorias_diarias || "--"}</p>
            <p className="text-xs text-muted-foreground">Calorias/dia</p>
          </div>
          <div className="bg-blue-500/10 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-500">{conteudo.macros?.proteinas_g || "--"}g</p>
            <p className="text-xs text-muted-foreground">Proteínas</p>
          </div>
          <div className="bg-green-500/10 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-500">{conteudo.macros?.carboidratos_g || "--"}g</p>
            <p className="text-xs text-muted-foreground">Carboidratos</p>
          </div>
        </div>

        {/* Meals */}
        <div className="space-y-3">
          {conteudo.refeicoes?.map((refeicao: any, index: number) => (
            <div key={index} className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{refeicao.nome}</h4>
                <Badge variant="outline">{refeicao.horario}</Badge>
              </div>
              <ul className="space-y-1">
                {refeicao.alimentos?.map((alimento: any, aIndex: number) => (
                  <li key={aIndex} className="text-sm text-muted-foreground flex justify-between">
                    <span>{typeof alimento === "string" ? alimento : alimento.item}</span>
                    {alimento.calorias && <span>{alimento.calorias} kcal</span>}
                  </li>
                ))}
              </ul>
              {refeicao.calorias_total && (
                <p className="text-sm font-medium mt-2 text-right">Total: {refeicao.calorias_total} kcal</p>
              )}
            </div>
          ))}
        </div>

        {/* Supplementation */}
        {conteudo.suplementacao && conteudo.suplementacao.length > 0 && (
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Suplementação</h4>
            <ul className="list-disc list-inside space-y-1">
              {conteudo.suplementacao.map((supl: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground">{supl}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <ClientLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Meus Protocolos</h1>
            <p className="text-muted-foreground">Seus planos de treino e nutrição personalizados pela IA</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => generateProtocol("treino")}
              disabled={generating !== null}
            >
              {generating === "treino" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Dumbbell className="h-4 w-4 mr-2" />
              )}
              Gerar Treino
            </Button>
            <Button
              variant="fire"
              onClick={() => generateProtocol("nutricao")}
              disabled={generating !== null}
            >
              {generating === "nutricao" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Apple className="h-4 w-4 mr-2" />
              )}
              Gerar Nutrição
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="treino" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="treino" className="gap-2">
                <Dumbbell className="h-4 w-4" />
                Treinos ({treinoProtocols.length})
              </TabsTrigger>
              <TabsTrigger value="nutricao" className="gap-2">
                <Apple className="h-4 w-4" />
                Nutrição ({nutricaoProtocols.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="treino" className="space-y-4">
              {treinoProtocols.length === 0 ? (
                <Card variant="glass" className="text-center py-12">
                  <CardContent>
                    <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum protocolo de treino</h3>
                    <p className="text-muted-foreground mb-4">
                      Clique no botão acima para gerar seu primeiro protocolo de treino personalizado!
                    </p>
                    <Button variant="fire" onClick={() => generateProtocol("treino")} disabled={generating !== null}>
                      {generating === "treino" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Gerar Protocolo de Treino
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                treinoProtocols.map((protocol) => (
                  <Card key={protocol.id} variant="glass">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Dumbbell className="h-5 w-5 text-primary" />
                            {protocol.titulo}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            Gerado em {format(new Date(protocol.data_geracao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{protocol.conteudo?.nivel || "Personalizado"}</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateProtocolPdf(protocol)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderTreinoContent(protocol.conteudo)}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="nutricao" className="space-y-4">
              {nutricaoProtocols.length === 0 ? (
                <Card variant="glass" className="text-center py-12">
                  <CardContent>
                    <Apple className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum protocolo nutricional</h3>
                    <p className="text-muted-foreground mb-4">
                      Clique no botão acima para gerar seu primeiro plano alimentar personalizado!
                    </p>
                    <Button variant="fire" onClick={() => generateProtocol("nutricao")} disabled={generating !== null}>
                      {generating === "nutricao" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Gerar Plano Nutricional
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                nutricaoProtocols.map((protocol) => (
                  <Card key={protocol.id} variant="glass">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Apple className="h-5 w-5 text-green-500" />
                            {protocol.titulo}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            Gerado em {format(new Date(protocol.data_geracao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateProtocolPdf(protocol)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderNutricaoContent(protocol.conteudo)}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ClientLayout>
  );
}
