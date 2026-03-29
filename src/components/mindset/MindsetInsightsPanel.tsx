import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Brain, Flame, Moon, Heart, TrendingUp, Shield, AlertTriangle, Utensils } from "lucide-react";
import { format, subDays } from "date-fns";

interface WellnessScore {
  date: string;
  burnout_index: number;
  compulsion_risk: number;
  sleep_mood_correlation: number;
  body_mind_divergence: number;
  motivation_trend: number;
  resilience_index: number;
  alerts: any[];
}

function getRiskColor(value: number) {
  if (value >= 70) return "text-red-500";
  if (value >= 40) return "text-yellow-500";
  return "text-emerald-500";
}

function getRiskBadge(value: number) {
  if (value >= 70) return { label: "Alto", variant: "destructive" as const };
  if (value >= 40) return { label: "Moderado", variant: "secondary" as const };
  return { label: "Baixo", variant: "outline" as const };
}

function getInsight(key: string, value: number): string {
  const insights: Record<string, Record<string, string>> = {
    burnout_index: {
      high: "Seus indicadores de estresse, sono e recuperação estão desalinhados há vários dias. Seu corpo precisa de uma pausa real — não apenas descanso passivo, mas atividades restaurativas.",
      moderate: "Alguns sinais de sobrecarga estão aparecendo. Preste atenção à qualidade do sono e considere reduzir a intensidade dos treinos por 2-3 dias.",
      low: "Seu equilíbrio entre estresse e recuperação está saudável. Continue mantendo boas práticas de sono e gestão de estresse.",
    },
    compulsion_risk: {
      high: "Quando o estresse sobe, sua disciplina alimentar tende a cair. Isso é normal — mas reconhecer o padrão é o primeiro passo. Planeje refeições nos dias de mais pressão.",
      moderate: "Alguns episódios de descontrole alimentar associados a estresse foram detectados. Tente manter lanches saudáveis acessíveis.",
      low: "Sua relação com alimentação está equilibrada, mesmo em dias mais estressantes. Excelente autorregulação.",
    },
    sleep_mood_correlation: {
      high: "Existe uma correlação forte entre seu sono e seu humor. Nos dias que você dorme menos de 6h, sua energia mental cai significativamente no dia seguinte.",
      moderate: "Seu humor é parcialmente afetado pela qualidade do sono. Manter regularidade nos horários pode melhorar ambos.",
      low: "Seu humor se mantém estável independente de variações no sono. Boa resiliência emocional.",
    },
    body_mind_divergence: {
      high: "Seus dados fisiológicos (VFC, FC) e seu relato subjetivo estão em direções opostas. Isso pode indicar estresse psicológico não percebido ou negação de sintomas físicos.",
      moderate: "Há alguma diferença entre como seu corpo está respondendo e como você se sente. Preste atenção aos sinais sutis.",
      low: "Boa consciência corporal — seus relatos subjetivos estão alinhados com seus marcadores fisiológicos.",
    },
    motivation_trend: {
      high: "Sua motivação para treinar está em queda progressiva. Pode ser overtraining, burnout ou falta de variedade. Considere mudar o tipo de treino ou reduzir volume.",
      moderate: "A motivação oscila. Isso é normal, mas observe se a tendência continua caindo por mais de uma semana.",
      low: "Motivação estável e consistente. Você está num bom momento de engajamento com o treino.",
    },
    resilience_index: {
      high: "Você demora vários dias para se recuperar emocionalmente após períodos de estresse. Técnicas de regulação emocional (respiração, meditação) podem acelerar esse processo.",
      moderate: "Sua recuperação emocional é razoável, mas pode ser otimizada com práticas regulares de mindfulness.",
      low: "Excelente resiliência — você se recupera rapidamente de dias difíceis. Seus hábitos de autocuidado estão funcionando.",
    },
  };

  const level = value >= 70 ? "high" : value >= 40 ? "moderate" : "low";
  // For resilience, invert the interpretation (low value = low resilience = bad)
  if (key === "resilience_index") {
    const resLevel = value >= 60 ? "low" : value >= 30 ? "moderate" : "high";
    return insights[key]?.[resLevel] || "";
  }
  return insights[key]?.[level] || "";
}

const indexConfig = [
  { key: "burnout_index", label: "Risco de Burnout", icon: Flame, color: "#ef4444" },
  { key: "compulsion_risk", label: "Risco Compulsão", icon: Utensils, color: "#f59e0b" },
  { key: "sleep_mood_correlation", label: "Impacto Sono→Humor", icon: Moon, color: "#6366f1" },
  { key: "body_mind_divergence", label: "Corpo vs Mente", icon: Heart, color: "#ec4899" },
  { key: "motivation_trend", label: "Queda Motivação", icon: TrendingUp, color: "#8b5cf6" },
  { key: "resilience_index", label: "Resiliência", icon: Shield, color: "#10b981" },
];

interface Props {
  userId?: string; // for admin view
}

export function MindsetInsightsPanel({ userId }: Props) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data: scores, isLoading } = useQuery({
    queryKey: ["mental-wellness-scores", targetUserId],
    enabled: !!targetUserId,
    queryFn: async () => {
      const d30ago = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("mental_wellness_scores")
        .select("*")
        .eq("user_id", targetUserId!)
        .gte("date", d30ago)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data || []) as WellnessScore[];
    },
  });

  const latest = scores?.[scores.length - 1];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Inteligência Mental
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Inteligência Mental
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete o check-in cognitivo por pelo menos 3 dias para ver insights sobre sua saúde mental.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Collect active alerts
  const activeAlerts = (latest.alerts as any[])?.filter((a: any) => a.priority === "alta") || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Inteligência Mental
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alert banner */}
          {activeAlerts.length > 0 && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-red-500">
                <AlertTriangle className="h-4 w-4" />
                Atenção
              </div>
              {activeAlerts.map((alert: any, i: number) => (
                <p key={i} className="text-xs text-muted-foreground">
                  {alert.message} — {alert.action}
                </p>
              ))}
            </div>
          )}

          {/* Index cards */}
          <div className="grid grid-cols-2 gap-3">
            {indexConfig.map(({ key, label, icon: Icon, color }) => {
              const value = Math.round(Number((latest as any)[key]) || 0);
              const risk = getRiskBadge(key === "resilience_index" ? 100 - value : value);

              return (
                <div
                  key={key}
                  className="rounded-lg border border-border/50 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" style={{ color }} />
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                    <Badge variant={risk.variant} className="text-[10px] px-1.5 py-0">
                      {risk.label}
                    </Badge>
                  </div>
                  <div className={`text-2xl font-bold ${getRiskColor(key === "resilience_index" ? 100 - value : value)}`}>
                    {value}%
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {getInsight(key, value)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* 30-day trend chart */}
          {scores && scores.length > 3 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Evolução 30 dias — Burnout vs Resiliência</h4>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={scores.map(s => ({
                  date: s.date.slice(5),
                  burnout: Math.round(Number(s.burnout_index)),
                  resilience: Math.round(Number(s.resilience_index)),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="burnout" stroke="#ef4444" strokeWidth={2} dot={false} name="Burnout" />
                  <Line type="monotone" dataKey="resilience" stroke="#10b981" strokeWidth={2} dot={false} name="Resiliência" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
