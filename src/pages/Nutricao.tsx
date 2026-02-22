import { useNavigate } from "react-router-dom";
import { useProtocol } from "@/hooks/useProtocol";
import { useEntitlements } from "@/hooks/useEntitlements";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Utensils, Loader2, Apple, Download, Lock, Droplets, 
  ShoppingCart, ArrowLeftRight, Moon, ChevronDown, ChevronUp,
  Dumbbell, BedDouble 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TrialBanner } from "@/components/access/TrialBadge";
import { UpgradeModal } from "@/components/access/UpgradeModal";
import { generateProtocolPdf } from "@/lib/generateProtocolPdf";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface MacrosRefeicao {
  proteinas_g?: number;
  carboidratos_g?: number;
  gorduras_g?: number;
  calorias?: number;
  proteinas?: string;
  carboidratos?: string;
  gorduras?: string;
}

interface Refeicao {
  nome: string;
  horario?: string;
  tipo?: string;
  alimentos?: (string | { item: string; calorias?: number })[];
  macros_refeicao?: MacrosRefeicao;
  calorias_aproximadas?: number;
  calorias_total?: number;
  substituicoes?: string[];
}

interface OpcaoPreSono {
  descricao: string;
  alimentos: string[];
  macros: MacrosRefeicao;
}

interface ItemCompras {
  nome: string;
  quantidade_semanal: string;
}

interface SubstituicaoCategoria {
  categoria: string;
  equivalencias: Array<{
    original: string;
    substituicoes: string[];
  }>;
}

interface NutritionContent {
  refeicoes?: Refeicao[];
  macros?: { proteinas_g?: number; carboidratos_g?: number; gorduras_g?: number; lipidios_g?: number; calorias_diarias?: number };
  macros_diarios?: { calorias?: number; proteina_g?: number; carboidrato_g?: number; gordura_g?: number; agua_litros?: number };
  calorias_diarias?: number;
  dicas?: string[];
  dicas_praticas?: string[];
  plano_dia_treino?: { calorias_totais?: number; refeicoes: Refeicao[] };
  plano_dia_descanso?: { calorias_totais?: number; nota_ajuste?: string; refeicoes: Refeicao[] };
  refeicao_pre_sono?: { explicacao?: string; opcoes: OpcaoPreSono[] };
  estrategia_anti_compulsao?: { titulo?: string; orientacoes?: string[] };
  hidratacao?: { litros_dia?: number; calculo?: string; distribuicao?: string[]; quantidade?: string; dicas?: string[] };
  lista_compras_semanal?: { proteinas?: ItemCompras[]; carboidratos?: ItemCompras[]; gorduras?: ItemCompras[]; frutas?: ItemCompras[]; vegetais?: ItemCompras[]; outros?: ItemCompras[] } | string[];
  substituicoes?: SubstituicaoCategoria[];
}

function isExpandedFormat(conteudo: NutritionContent): boolean {
  return !!(conteudo.plano_dia_treino || conteudo.macros_diarios);
}

/* MacroCard — neutro, sem cores vividas */
function MacroCard({ label, value, unit }: { label: string; value: number | string; unit?: string; color?: string }) {
  return (
    <Card className="p-3 sm:p-4 text-center border-border/50">
      <p className="text-xl md:text-2xl font-bold text-foreground">{value}{unit || ''}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

/* MealMacrosBar — badges neutros */
function MealMacrosBar({ macros }: { macros?: MacrosRefeicao }) {
  if (!macros) return null;
  const p = macros.proteinas_g || (macros.proteinas ? parseInt(macros.proteinas as string) : 0);
  const c = macros.carboidratos_g || (macros.carboidratos ? parseInt(macros.carboidratos as string) : 0);
  const g = macros.gorduras_g || (macros.gorduras ? parseInt(macros.gorduras as string) : 0);
  const cal = macros.calorias || 0;
  if (!p && !c && !g) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/40">
      {p > 0 && <Badge variant="outline" className="text-xs border-border/50">P: {p}g</Badge>}
      {c > 0 && <Badge variant="outline" className="text-xs border-border/50">C: {c}g</Badge>}
      {g > 0 && <Badge variant="outline" className="text-xs border-border/50">G: {g}g</Badge>}
      {cal > 0 && <Badge variant="outline" className="text-xs">{cal} kcal</Badge>}
    </div>
  );
}

function MealCard({ refeicao, index }: { refeicao: Refeicao; index: number }) {
  return (
    <Card key={index} className="border border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-sm sm:text-base">
            <Apple className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" strokeWidth={1.5} />
            <span>{refeicao.nome}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {refeicao.tipo === "pre_treino" && <Badge variant="secondary" className="text-xs"><Dumbbell className="w-3 h-3 mr-1" />Pré</Badge>}
            {refeicao.tipo === "pos_treino" && <Badge variant="secondary" className="text-xs"><Dumbbell className="w-3 h-3 mr-1" />Pós</Badge>}
            {refeicao.tipo === "pre_sono" && <Badge variant="secondary" className="text-xs"><BedDouble className="w-3 h-3 mr-1" />Pré-Sono</Badge>}
            {refeicao.horario && <Badge variant="outline">{refeicao.horario}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {refeicao.alimentos?.map((alimento, aIndex) => (
            <li key={aIndex} className="text-sm text-muted-foreground flex justify-between">
              <span>{typeof alimento === "string" ? alimento : alimento.item}</span>
              {typeof alimento !== "string" && alimento.calorias && (<span>{alimento.calorias} kcal</span>)}
            </li>
          ))}
        </ul>
        <MealMacrosBar macros={refeicao.macros_refeicao} />
        {refeicao.substituicoes && refeicao.substituicoes.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <p className="text-xs font-medium text-muted-foreground mb-1">Substituições:</p>
            {refeicao.substituicoes.map((sub, si) => (
              <p key={si} className="text-xs text-muted-foreground">• {sub}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border border-border/50">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full p-4 text-left">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <span className="text-sm sm:text-base font-semibold">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

export default function Nutricao() {
  const navigate = useNavigate();
  const { protocol, loading } = useProtocol("nutricao");
  const { isFull, isTrialing, isBlocked, trialUsage, markUsed, loading: entLoading } = useEntitlements();
  const [downloading, setDownloading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const conteudo = (protocol?.conteudo as NutritionContent) || {};
  const expanded = isExpandedFormat(conteudo);
  const legacyRefeicoes = conteudo.refeicoes || [];
  const macros = conteudo.macros;
  const dicas = conteudo.dicas || conteudo.dicas_praticas || [];
  const macrosDiarios = conteudo.macros_diarios;
  const planoDiaTreino = conteudo.plano_dia_treino;
  const planoDiaDescanso = conteudo.plano_dia_descanso;
  const preSono = conteudo.refeicao_pre_sono;
  const antiCompulsao = conteudo.estrategia_anti_compulsao;
  const hidratacao = conteudo.hidratacao;
  const listaCompras = conteudo.lista_compras_semanal;
  const substituicoes = conteudo.substituicoes;

  const hasContent = expanded ? !!(planoDiaTreino?.refeicoes?.length) : legacyRefeicoes.length > 0;
  const maxMealsVisible = isTrialing ? 2 : Infinity;

  useEffect(() => {
    if (isTrialing && !trialUsage.used_diet && hasContent) {
      markUsed('used_diet');
    }
  }, [isTrialing, trialUsage.used_diet, hasContent]);

  const handleDownloadPdf = () => {
    if (!protocol) return;
    setDownloading(true);
    try {
      generateProtocolPdf({ id: protocol.id, tipo: "nutricao", titulo: protocol.titulo, conteudo: protocol.conteudo, data_geracao: protocol.data_geracao || new Date().toISOString() });
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header — flat */}
        <PageHeader
          title="Plano Nutricional"
          subtitle={hasContent ? "Seu cardápio estratégico para máxima performance" : "Seu protocolo será gerado em breve"}
          actions={
            protocol && isFull ? (
              <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
                <Download className="w-4 h-4 mr-2" />
                {downloading ? "Baixando..." : "Baixar PDF"}
              </Button>
            ) : undefined
          }
        />

        {!entLoading && isBlocked && (
          <UpgradeModal open={true} onClose={() => setShowUpgradeModal(false)} />
        )}

        {isTrialing && (
          <TrialBanner isTrialing={isTrialing} onUpgradeClick={() => setShowUpgradeModal(true)} />
        )}

        {!hasContent && !isBlocked ? (
          <EmptyState
            icon={Utensils}
            title="Nenhum plano nutricional disponível"
            description="Seu protocolo nutricional será gerado em breve. Fale com seu mentor."
            ctaLabel="Falar com Mentor"
            ctaAction={() => navigate("/suporte")}
          />
        ) : !isBlocked ? (
          <>
            {/* Macros Overview — cores neutras */}
            {isFull && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MacroCard label="kcal/dia" value={macrosDiarios?.calorias || conteudo.calorias_diarias || macros?.calorias_diarias || "--"} />
                <MacroCard label="Proteínas" value={macrosDiarios?.proteina_g || macros?.proteinas_g || "--"} unit="g" />
                <MacroCard label="Carboidratos" value={macrosDiarios?.carboidrato_g || macros?.carboidratos_g || "--"} unit="g" />
                <MacroCard label="Gorduras" value={macrosDiarios?.gordura_g || macros?.gorduras_g || "--"} unit="g" />
                <MacroCard label="Água" value={macrosDiarios?.agua_litros || (hidratacao as any)?.litros_dia || "--"} unit="L" />
              </div>
            )}

            {/* Hydration — neutro */}
            {isFull && hidratacao && (hidratacao.distribuicao || hidratacao.dicas) && (
              <Card className="p-4 border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  <span className="font-semibold text-sm">Hidratação</span>
                  {hidratacao.calculo && <Badge variant="outline" className="text-xs">{hidratacao.calculo}</Badge>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(hidratacao.distribuicao || hidratacao.dicas || []).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Droplets className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Meal Plans */}
            {expanded && planoDiaTreino && planoDiaDescanso ? (
              <Tabs defaultValue="treino" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="treino" className="text-xs sm:text-sm">
                    <Dumbbell className="w-4 h-4 mr-1.5" />Dia de Treino
                  </TabsTrigger>
                  <TabsTrigger value="descanso" className="text-xs sm:text-sm">
                    <Moon className="w-4 h-4 mr-1.5" />Dia de Descanso
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="treino" className="space-y-4 mt-4">
                  {planoDiaTreino.calorias_totais && (
                    <Badge variant="outline" className="text-xs">Total: {planoDiaTreino.calorias_totais} kcal</Badge>
                  )}
                  {planoDiaTreino.refeicoes.slice(0, maxMealsVisible).map((ref, i) => (
                    <MealCard key={i} refeicao={ref} index={i} />
                  ))}
                  {isTrialing && planoDiaTreino.refeicoes.length > maxMealsVisible && (
                    <div className="text-center py-2">
                      <Button variant="outline" size="sm" onClick={() => setShowUpgradeModal(true)}>
                        <Lock className="w-4 h-4 mr-2" />Desbloquear plano completo
                      </Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="descanso" className="space-y-4 mt-4">
                  {planoDiaDescanso.nota_ajuste && (
                    <Card className="p-3 border-border/50">
                      <p className="text-sm text-muted-foreground">{planoDiaDescanso.nota_ajuste}</p>
                    </Card>
                  )}
                  {planoDiaDescanso.calorias_totais && (
                    <Badge variant="outline" className="text-xs">Total: {planoDiaDescanso.calorias_totais} kcal</Badge>
                  )}
                  {planoDiaDescanso.refeicoes.slice(0, maxMealsVisible).map((ref, i) => (
                    <MealCard key={i} refeicao={ref} index={i} />
                  ))}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4">
                {legacyRefeicoes.slice(0, maxMealsVisible).map((refeicao, index) => (
                  <MealCard key={index} refeicao={refeicao} index={index} />
                ))}
                {isTrialing && legacyRefeicoes.length > maxMealsVisible && (
                  <div className="text-center py-2">
                    <Button variant="outline" size="sm" onClick={() => setShowUpgradeModal(true)}>
                      <Lock className="w-4 h-4 mr-2" />Desbloquear plano completo
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Pre-sleep — neutro */}
            {isFull && preSono && preSono.opcoes?.length > 0 && (
              <CollapsibleSection title="Refeição Pré-Sono" icon={BedDouble} defaultOpen>
                {preSono.explicacao && (
                  <p className="text-sm text-muted-foreground mb-3">{preSono.explicacao}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {preSono.opcoes.map((opcao, i) => (
                    <Card key={i} className="p-3 border-border/50">
                      <p className="font-semibold text-sm mb-2">Opção {i + 1}: {opcao.descricao}</p>
                      <ul className="space-y-1 mb-2">
                        {opcao.alimentos.map((a, ai) => (
                          <li key={ai} className="text-xs text-muted-foreground">• {a}</li>
                        ))}
                      </ul>
                      <MealMacrosBar macros={opcao.macros} />
                    </Card>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Anti-compulsion — neutro */}
            {isFull && antiCompulsao && antiCompulsao.orientacoes?.length > 0 && (
              <Card className="p-4 border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="font-semibold text-sm">{antiCompulsao.titulo || "Controle da Fome Noturna"}</span>
                </div>
                <ul className="space-y-1">
                  {antiCompulsao.orientacoes.map((o, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {o}</li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Shopping List */}
            {isFull && listaCompras && !Array.isArray(listaCompras) && (
              <CollapsibleSection title="Lista de Compras Semanal" icon={ShoppingCart}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(listaCompras).map(([cat, items]) => {
                    if (!items || !Array.isArray(items) || items.length === 0) return null;
                    return (
                      <div key={cat}>
                        <p className="font-semibold text-sm capitalize mb-2">{cat}</p>
                        <ul className="space-y-1">
                          {items.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex justify-between">
                              <span>{item.nome}</span>
                              <span className="text-xs font-medium">{item.quantidade_semanal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            )}

            {/* Substitutions */}
            {isFull && substituicoes && substituicoes.length > 0 && (
              <CollapsibleSection title="Substituições Equivalentes" icon={ArrowLeftRight}>
                <div className="space-y-4">
                  {substituicoes.map((cat, ci) => (
                    <div key={ci}>
                      <p className="font-semibold text-sm mb-2">{cat.categoria}</p>
                      {cat.equivalencias?.map((eq, ei) => (
                        <div key={ei} className="mb-2 pl-3 border-l-2 border-primary/30">
                          <p className="text-sm font-medium">{eq.original} =</p>
                          <ul className="pl-3">
                            {eq.substituicoes?.map((sub, si) => (
                              <li key={si} className="text-xs text-muted-foreground">• {sub}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Tips */}
            {Array.isArray(dicas) && dicas.length > 0 && isFull && (
              <Card className="p-4 border-border/50">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Dica do dia:</strong> {dicas[0]}
                </p>
              </Card>
            )}
          </>
        ) : null}
      </div>
      <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </ClientLayout>
  );
}
