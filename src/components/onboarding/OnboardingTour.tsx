import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Utensils,
  Brain,
  BookOpen,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  tip: string;
}

const steps: Step[] = [
  {
    icon: Target,
    title: "Seu Treino Personalizado",
    description:
      "Acesse treinos criados exclusivamente para você, com vídeos demonstrativos de cada exercício.",
    color: "from-orange-500 to-red-500",
    tip: "Clique em qualquer exercício para ver o vídeo de execução correta!",
  },
  {
    icon: Utensils,
    title: "Plano Nutricional",
    description:
      "Cardápio completo com refeições balanceadas e macros calculados para seus objetivos.",
    color: "from-green-500 to-emerald-500",
    tip: "Baixe seu plano em PDF para consultar offline!",
  },
  {
    icon: Brain,
    title: "Mindset & Mentalidade",
    description:
      "Rotinas, afirmações e práticas para fortalecer sua mente durante a transformação.",
    color: "from-purple-500 to-violet-500",
    tip: "Siga as rotinas diárias para resultados mais consistentes!",
  },
  {
    icon: BookOpen,
    title: "Gerador de Receitas",
    description:
      "Escolha ingredientes e gere receitas fitness personalizadas instantaneamente.",
    color: "from-blue-500 to-cyan-500",
    tip: "Salve suas receitas favoritas para acessar depois!",
  },
  {
    icon: MessageCircle,
    title: "Fale com seu Mentor",
    description:
      "Tire dúvidas 24h por dia com nosso mentor virtual inteligente.",
    color: "from-primary to-orange-600",
    tip: "Não hesite em perguntar - estou aqui para ajudar!",
  },
];

export function OnboardingTour() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (data && !data.onboarding_completed) {
          setOpen(true);
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, [user]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
    } catch (error) {
      console.error("Error updating onboarding status:", error);
    }

    setOpen(false);
  };

  if (loading || !open) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} de {steps.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={handleSkip}
            >
              Pular tour
            </Button>
          </div>
          <Progress value={progress} className="h-1 mb-4" />

          <div
            className={cn(
              "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4",
              step.color
            )}
          >
            <step.icon className="w-8 h-8 text-white" />
          </div>

          <DialogTitle className="text-xl text-center">{step.title}</DialogTitle>
          <DialogDescription className="text-center">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 my-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Dica: </span>
              {step.tip}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="w-full sm:w-auto"
            >
              Voltar
            </Button>
          )}
          <Button
            variant="fire"
            onClick={handleNext}
            className="w-full sm:w-auto"
          >
            {isLastStep ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Começar!
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
