import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Flame, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { PersonalDataFields } from "@/components/anamnese/PersonalDataFields";
import { TrainingHistoryFields } from "@/components/anamnese/TrainingHistoryFields";
import { HealthAndHabitsFields } from "@/components/anamnese/HealthAndHabitsFields";
import { ScheduleAndPhotosFields } from "@/components/anamnese/ScheduleAndPhotosFields";

interface FormData {
  data_nascimento: string;
  weight: string;
  height: string;
  whatsapp: string;
  sexo: string;
  objetivo_principal: string;
  ja_treinou_antes: string;
  local_treino: string;
  dias_disponiveis: string;
  nivel_condicionamento: string;
  pratica_aerobica: string;
  escada_sem_cansar: string;
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
  horario_treino: string;
  horario_acorda: string;
  horario_dorme: string;
  foto_frente_url: string;
  foto_lado_url: string;
  foto_costas_url: string;
  observacoes_adicionais: string;
}

const initialFormData: FormData = {
  data_nascimento: "",
  weight: "",
  height: "",
  whatsapp: "",
  sexo: "",
  objetivo_principal: "",
  ja_treinou_antes: "",
  local_treino: "",
  dias_disponiveis: "",
  nivel_condicionamento: "",
  pratica_aerobica: "",
  escada_sem_cansar: "",
  condicoes_saude: "",
  injuries: "",
  toma_medicamentos: "",
  medicamentos_detalhes: "",
  refeicoes_por_dia: "",
  bebe_agua_frequente: "",
  restricoes_alimentares: "",
  qualidade_sono: "",
  nivel_estresse: "",
  consome_alcool: "",
  fuma: "",
  horario_treino: "",
  horario_acorda: "",
  horario_dorme: "",
  foto_frente_url: "",
  foto_lado_url: "",
  foto_costas_url: "",
  observacoes_adicionais: "",
};

type PageState = "loading" | "form" | "success" | "error";

export default function AnamneseExterna() {
  const { token } = useParams<{ token: string }>();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [clientName, setClientName] = useState("");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMessage("Link inválido.");
      setPageState("error");
      return;
    }

    const validate = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("submit-external-anamnese", {
          body: { action: "validate", token },
        });

        if (error || data?.error) {
          setErrorMessage(data?.error || "Link inválido ou expirado.");
          setPageState("error");
          return;
        }

        setClientName(data.clientName || "Cliente");
        setPageState("form");
      } catch {
        setErrorMessage("Erro ao validar o link. Tente novamente.");
        setPageState("error");
      }
    };

    validate();
  }, [token]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const requiredFields: Record<string, string> = {
      data_nascimento: "Data de nascimento",
      weight: "Peso",
      height: "Altura",
      objetivo_principal: "Objetivo principal",
      ja_treinou_antes: "Histórico de treino",
      dias_disponiveis: "Dias disponíveis",
      nivel_condicionamento: "Nível de condicionamento",
    };

    const missing = Object.entries(requiredFields)
      .filter(([key]) => !formData[key as keyof FormData])
      .map(([, label]) => label);

    if (missing.length > 0) {
      toast.error(`Preencha: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "..." : ""}`);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-external-anamnese", {
        body: { action: "submit", token, formData },
      });

      if (error || data?.error) {
        toast.error(data?.error || "Erro ao enviar dados.");
        return;
      }

      setPageState("success");
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Validando link...</p>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Link Indisponível</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com seu treinador para solicitar um novo link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-xl font-bold">Anamnese Enviada!</h2>
            <p className="text-muted-foreground">
              Seus dados foram recebidos com sucesso, {clientName}. Seu treinador já tem acesso às informações para personalizar seu programa.
            </p>
            <div className="flex items-center justify-center gap-2 pt-4">
              <Flame className="h-5 w-5 text-primary" />
              <span className="font-semibold">Método Renascer</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filledFields = Object.values(formData).filter((v) => v !== "").length;
  const totalFields = Object.keys(formData).length;
  const progress = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">MÉTODO RENASCER</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Olá, {clientName}!</h1>
          <p className="text-muted-foreground mb-4">
            Preencha sua anamnese abaixo para que possamos personalizar seu programa.
          </p>

          {/* Progress */}
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{progress}% preenchido</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PersonalDataFields formData={formData} onChange={handleFieldChange} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Treino</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TrainingHistoryFields formData={formData} onChange={handleFieldChange} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saúde e Hábitos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <HealthAndHabitsFields formData={formData} onChange={handleFieldChange} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rotina e Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScheduleAndPhotosFields formData={formData} userId="" onChange={handleFieldChange} />
            </CardContent>
          </Card>

          <Button
            type="submit"
            variant="fire"
            size="xl"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Enviar Anamnese
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
