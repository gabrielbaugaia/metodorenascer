import { CheckCircle2, XCircle, AlertTriangle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AuditResult {
  // Treino criteria
  coherence_anamnese?: boolean;
  coherence_objective?: boolean;
  restriction_respect?: boolean;
  weekly_volume?: boolean;
  muscle_distribution?: boolean;
  progression_defined?: boolean;
  instruction_clarity?: boolean;
  mindset_quality?: boolean;
  safety_score?: boolean;
  // Nutrição criteria
  macros_definidos?: boolean;
  macros_por_refeicao?: boolean;
  pre_treino_presente?: boolean;
  pos_treino_presente?: boolean;
  pre_sono_presente?: boolean;
  hidratacao_presente?: boolean;
  dia_treino_vs_descanso?: boolean;
  lista_compras_gerada?: boolean;
  substituicoes_geradas?: boolean;
  compativel_anamnese?: boolean;
  // Common
  final_score?: number;
  classification?: string;
  issues?: string[];
  corrections_applied?: string[];
  audited_at?: string;
  warning?: string;
  audit_type?: string;
}

interface Props {
  auditResult: AuditResult | null | undefined;
  tipo?: string;
}

const TREINO_CRITERIA_LABELS: Record<string, string> = {
  coherence_anamnese: "Coerência com anamnese",
  coherence_objective: "Coerência com objetivo",
  restriction_respect: "Respeito às restrições/lesões",
  weekly_volume: "Volume semanal adequado",
  muscle_distribution: "Distribuição dos grupamentos musculares",
  progression_defined: "Progressão definida (4 semanas)",
  instruction_clarity: "Clareza das instruções",
  mindset_quality: "Qualidade do protocolo de mindset",
  safety_score: "Segurança geral da prescrição",
};

const NUTRICAO_CRITERIA_LABELS: Record<string, string> = {
  macros_definidos: "Macros diários definidos",
  macros_por_refeicao: "Macros por refeição",
  pre_treino_presente: "Refeição pré-treino presente",
  pos_treino_presente: "Refeição pós-treino presente",
  pre_sono_presente: "Refeição pré-sono (3 opções)",
  hidratacao_presente: "Hidratação calculada",
  dia_treino_vs_descanso: "Dia treino vs descanso",
  lista_compras_gerada: "Lista de compras gerada",
  substituicoes_geradas: "Substituições geradas",
  compativel_anamnese: "Compatível com anamnese",
};

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600";
  if (score >= 80) return "text-blue-600";
  if (score >= 70) return "text-yellow-600";
  return "text-red-600";
}

function getScoreBadgeVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 80) return "default";
  if (score >= 70) return "secondary";
  return "destructive";
}

export function PrescriptionAuditPanel({ auditResult, tipo }: Props) {
  if (!auditResult) return null;

  const score = auditResult.final_score ?? 0;
  const auditType = auditResult.audit_type || tipo || "treino";
  const isNutricao = auditType === "nutricao";
  const criteriaLabels = isNutricao ? NUTRICAO_CRITERIA_LABELS : TREINO_CRITERIA_LABELS;
  const criteria = Object.keys(criteriaLabels);

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {isNutricao ? "Auditoria Nutricional" : "Auditoria Interna de Qualidade"}
        </h4>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}/100
          </span>
          <Badge variant={getScoreBadgeVariant(score)}>
            {auditResult.classification || "N/A"}
          </Badge>
        </div>
      </div>

      {auditResult.warning && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-800">{auditResult.warning}</p>
        </div>
      )}

      {/* Criteria grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {criteria.map((key) => {
          const passed = auditResult[key as keyof AuditResult] === true;
          return (
            <div
              key={key}
              className={`flex items-center gap-2 p-2 rounded text-sm ${
                passed ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {passed ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 shrink-0" />
              )}
              <span>{criteriaLabels[key]}</span>
            </div>
          );
        })}
      </div>

      {/* Issues */}
      {auditResult.issues && auditResult.issues.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase">Problemas Detectados</p>
          <ul className="space-y-1">
            {auditResult.issues.map((issue, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                <span className="text-red-400 mt-0.5">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Corrections */}
      {auditResult.corrections_applied && auditResult.corrections_applied.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase">Correções Aplicadas</p>
          <ul className="space-y-1">
            {auditResult.corrections_applied.map((corr, i) => (
              <li key={i} className="text-sm text-blue-700 flex items-start gap-1.5">
                <span className="text-blue-400 mt-0.5">✓</span>
                {corr}
              </li>
            ))}
          </ul>
        </div>
      )}

      {auditResult.audited_at && (
        <p className="text-xs text-gray-400">
          Auditado em: {new Date(auditResult.audited_at).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
