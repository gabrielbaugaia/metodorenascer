import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Flame } from "lucide-react";
import { PersonalDataFields } from "@/components/anamnese/PersonalDataFields";
import { TrainingHistoryFields } from "@/components/anamnese/TrainingHistoryFields";
import { HealthAndHabitsFields } from "@/components/anamnese/HealthAndHabitsFields";
import { ScheduleAndPhotosFields } from "@/components/anamnese/ScheduleAndPhotosFields";

interface FormData {
  // Dados Pessoais
  data_nascimento: string;
  weight: string;
  height: string;
  whatsapp: string;
  sexo: string;
  
  // Objetivos
  objetivo_principal: string;
  
  // Histórico de Treino
  ja_treinou_antes: string;
  local_treino: string;
  dias_disponiveis: string;
  
  // Condicionamento Físico
  nivel_condicionamento: string;
  pratica_aerobica: string;
  escada_sem_cansar: string;
  
  // Saúde
  condicoes_saude: string;
  injuries: string;
  toma_medicamentos: string;
  medicamentos_detalhes: string;
  
  // Hábitos Alimentares
  refeicoes_por_dia: string;
  bebe_agua_frequente: string;
  restricoes_alimentares: string;
  
  // Estilo de Vida
  qualidade_sono: string;
  nivel_estresse: string;
  consome_alcool: string;
  fuma: string;
  
  // Horários
  horario_treino: string;
  horario_acorda: string;
  horario_dorme: string;
  
  // Fotos
  foto_frente_url: string;
  foto_lado_url: string;
  foto_costas_url: string;
  
  // Observações
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

// Normalize nivel_condicionamento to match database constraint
function normalizeNivelExperiencia(nivel: string): string {
  const map: Record<string, string> = {
    'Sedentário': 'iniciante',
    'Iniciante': 'iniciante',
    'Intermediário': 'intermediario',
    'Avançado': 'avancado',
  };
  return map[nivel] || 'iniciante';
}

export default function Anamnese() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Check if user has pending payment - must pay before anamnese
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!user) return;
      
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // If pending payment, redirect to dashboard to show payment screen
      if (subscription?.status === "pending_payment") {
        navigate("/dashboard");
        return;
      }
    };
    
    checkPaymentStatus();
  }, [user, navigate]);

  // Check if user already completed anamnese
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("anamnese_completa")
        .eq("id", user.id)
        .maybeSingle();
      
      if (data?.anamnese_completa) {
        navigate("/dashboard");
      }
    };
    
    checkProfile();
  }, [user, navigate]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    // Validate required fields
    const requiredFields = {
      'data_nascimento': 'Data de nascimento',
      'weight': 'Peso',
      'height': 'Altura',
      'objetivo_principal': 'Objetivo principal',
      'ja_treinou_antes': 'Histórico de treino',
      'dias_disponiveis': 'Dias disponíveis',
      'nivel_condicionamento': 'Nível de condicionamento',
      'horario_treino': 'Horário de treino (necessário para nutrição)'
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !formData[key as keyof FormData])
      .map(([, label]) => label);
    
    if (missingFields.length > 0) {
      toast.error(`Preencha: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}`);
      return;
    }

    // Photos are now optional - removed mandatory validation

    setLoading(true);
    
    try {
      const nivelExperienciaNormalizado = normalizeNivelExperiencia(formData.nivel_condicionamento);
      console.log("[ANAMNESE] Start submit for user", user.id);
      
      // Calculate age from birth date
      const birthDate = new Date(formData.data_nascimento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Combina lesões e detalhes de medicamentos em um campo de restrições médicas
      const restricoesMedicasCompletas = [
        formData.injuries,
        formData.toma_medicamentos === "sim" ? `Medicamentos: ${formData.medicamentos_detalhes}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      console.log("[ANAMNESE] Updating profile...");
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          age,
          data_nascimento: formData.data_nascimento,
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          telefone: formData.whatsapp,
          sexo: formData.sexo,
          goals: formData.objetivo_principal,
          objetivo_principal: formData.objetivo_principal,
          ja_treinou_antes: formData.ja_treinou_antes === "sim",
          local_treino: formData.local_treino,
          availability: formData.dias_disponiveis,
          dias_disponiveis: formData.dias_disponiveis,
          nivel_experiencia: nivelExperienciaNormalizado,
          nivel_condicionamento: formData.nivel_condicionamento,
          pratica_aerobica: formData.pratica_aerobica === "sim",
          escada_sem_cansar: formData.escada_sem_cansar,
          condicoes_saude: formData.condicoes_saude,
          injuries: formData.injuries,
          restricoes_medicas: restricoesMedicasCompletas,
          toma_medicamentos: formData.toma_medicamentos === "sim",
          refeicoes_por_dia: formData.refeicoes_por_dia,
          bebe_agua_frequente: formData.bebe_agua_frequente === "sim",
          restricoes_alimentares: formData.restricoes_alimentares,
          qualidade_sono: formData.qualidade_sono,
          nivel_estresse: formData.nivel_estresse,
          consome_alcool: formData.consome_alcool,
          fuma: formData.fuma,
          foto_frente_url: formData.foto_frente_url,
          foto_lado_url: formData.foto_lado_url,
          foto_costas_url: formData.foto_costas_url,
          observacoes_adicionais: formData.observacoes_adicionais,
          anamnese_completa: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("[ANAMNESE] Profile update error", updateError);
        throw new Error("PROFILE_UPDATE_ERROR");
      }

      // Generate protocols for the client (first protocol only - monthly limit enforced by edge function)
      console.log("[ANAMNESE] Generating protocols...");
      
      // Get subscription to determine plan type
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_type")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      
      const planType = subscription?.plan_type || "mensal";
      
      // Prepare user context for protocol generation
      // CRITICAL: Include routine fields for deterministic meal scheduling
      const userContext = {
        age,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        sex: formData.sexo,
        goal: formData.objetivo_principal,
        trainingLevel: nivelExperienciaNormalizado,
        trainingLocation: formData.local_treino,
        daysAvailable: formData.dias_disponiveis,
        medicalRestrictions: restricoesMedicasCompletas,
        dietaryRestrictions: formData.restricoes_alimentares,
        sleepQuality: formData.qualidade_sono,
        stressLevel: formData.nivel_estresse,
        observations: formData.observacoes_adicionais,
        // Routine fields for meal scheduling (REQUIRED for nutrition protocol)
        horario_treino: formData.horario_treino || "18:00",
        horario_acorda: formData.horario_acorda || "06:00",
        horario_dorme: formData.horario_dorme || "22:00",
        refeicoes_por_dia: formData.refeicoes_por_dia || "5",
        // Additional health context for personalized nutrition
        condicoes_saude: formData.condicoes_saude,
        toma_medicamentos: formData.toma_medicamentos,
      };
      
      // Generate all 3 protocols in parallel
      const protocolTypes = ["treino", "nutricao", "mindset"];
      const protocolPromises = protocolTypes.map((tipo) =>
        supabase.functions.invoke("generate-protocol", {
          body: { tipo, userContext, userId: user.id, planType },
        })
      );
      
      const results = await Promise.allSettled(protocolPromises);
      const successCount = results.filter((r) => r.status === "fulfilled" && !r.value.error).length;
      
      if (successCount === 3) {
        toast.success("Anamnese concluída e protocolos gerados com sucesso!");
      } else if (successCount > 0) {
        toast.success(`Anamnese concluída! ${successCount} de 3 protocolos foram gerados.`);
      } else {
        toast.success("Anamnese concluída! Seus protocolos serão gerados em breve pelo seu mentor.");
      }
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving anamnese:", error);
      toast.error("Não foi possível salvar seus dados");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filledFields = Object.values(formData).filter(v => v !== "").length;
  const totalFields = Object.keys(formData).length;
  const progress = (filledFields / totalFields) * 100;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">MÉTODO RENASCER</span>
          </div>
          <h1 className="text-3xl font-bold uppercase mb-2">Complete sua Anamnese</h1>
          <p className="text-muted-foreground mb-4">
            Preencha os dados abaixo para personalizar seu programa
          </p>
          {/* Progress indicator */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-primary font-medium">
                {filledFields} de {totalFields} campos preenchidos
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados Pessoais */}
          <PersonalDataFields 
            formData={formData} 
            onChange={handleFieldChange} 
          />

          {/* Objetivos */}
          <Card>
            <CardHeader>
              <CardTitle>Objetivos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Objetivo Principal *</Label>
                <Select
                  value={formData.objetivo_principal}
                  onValueChange={(value) => handleFieldChange("objetivo_principal", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
                    <SelectItem value="Ganho de massa muscular">Ganho de massa muscular</SelectItem>
                    <SelectItem value="Definição muscular">Definição muscular</SelectItem>
                    <SelectItem value="Melhora de condicionamento">Melhora de condicionamento</SelectItem>
                    <SelectItem value="Saúde e bem-estar">Saúde e bem-estar</SelectItem>
                    <SelectItem value="Reabilitação">Reabilitação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Treino e Condicionamento */}
          <TrainingHistoryFields 
            formData={formData} 
            onChange={handleFieldChange} 
          />

          {/* Saúde e Hábitos */}
          <HealthAndHabitsFields 
            formData={formData} 
            onChange={handleFieldChange} 
          />

          {/* Horários e Fotos */}
          {user && (
            <ScheduleAndPhotosFields 
              formData={formData} 
              userId={user.id}
              userName={user.user_metadata?.full_name || user.email?.split('@')[0]}
              onChange={handleFieldChange} 
            />
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="fire"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Gerando seus protocolos...</span>
              </div>
            ) : (
              "Concluir Anamnese e Gerar Planos"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
