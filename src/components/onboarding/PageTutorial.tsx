import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HelpCircle,
  Dumbbell,
  Play,
  Weight,
  Timer,
  Trophy,
  Utensils,
  ArrowLeftRight,
  ShoppingCart,
  Download,
  Brain,
  Sun,
  Moon,
  CheckCircle,
  MessageCircle,
  Bot,
  Clock,
  Camera,
  ImageIcon,
  Sparkles,
  Calendar,
  BedDouble,
  Smartphone,
  Upload,
  BarChart3,
  Heart,
  type LucideIcon,
} from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon: LucideIcon;
}

const TUTORIALS: Record<string, { title: string; steps: TutorialStep[] }> = {
  treino: {
    title: "Como usar o Treino",
    steps: [
      {
        title: "Veja seus treinos do dia",
        description: "Na tela principal você encontra todos os treinos da semana. Cada card mostra o foco muscular, número de exercícios e duração estimada.",
        icon: Dumbbell,
      },
      {
        title: "Inicie uma sessão de treino",
        description: "Clique no card do treino e toque em \"Iniciar Treino\". O cronômetro começa automaticamente e você pode acompanhar o tempo total.",
        icon: Play,
      },
      {
        title: "Registre a carga em cada exercício",
        description: "Durante o treino, toque no exercício para abrir o registro. Informe o peso (kg) e as repetições realizadas em cada série. O app salva o histórico para você progredir.",
        icon: Weight,
      },
      {
        title: "Intervalo de descanso",
        description: "Após completar uma série, o temporizador de descanso aparece automaticamente. Aguarde o tempo recomendado antes da próxima série para melhor resultado.",
        icon: Timer,
      },
      {
        title: "Finalize e veja o resumo",
        description: "Ao concluir todos os exercícios, toque em \"Finalizar Treino\". Você verá um resumo com duração total, exercícios completados e calorias estimadas.",
        icon: Trophy,
      },
    ],
  },
  nutricao: {
    title: "Como usar a Nutrição",
    steps: [
      {
        title: "Alterne entre dia de treino e descanso",
        description: "Use as abas no topo para ver o cardápio específico do dia de treino ou do dia de descanso. As calorias e macros são ajustados automaticamente.",
        icon: ArrowLeftRight,
      },
      {
        title: "Veja macros e calorias",
        description: "Cada refeição mostra os macronutrientes (proteínas, carboidratos, gorduras) e calorias. No topo da página você encontra o resumo diário completo.",
        icon: Utensils,
      },
      {
        title: "Lista de compras semanal",
        description: "Abra a seção \"Lista de Compras\" para ver todos os ingredientes organizados por categoria. Facilita suas idas ao mercado.",
        icon: ShoppingCart,
      },
      {
        title: "Baixe o PDF do plano",
        description: "Toque no botão \"Baixar PDF\" no topo da página para ter seu plano nutricional offline. Perfeito para consultar na cozinha.",
        icon: Download,
      },
    ],
  },
  mindset: {
    title: "Como usar o Mindset",
    steps: [
      {
        title: "Rotinas de manhã e noite",
        description: "Seu protocolo inclui práticas para manhã (energizar o dia) e noite (desacelerar). Siga a ordem sugerida para melhores resultados.",
        icon: Sun,
      },
      {
        title: "Marque práticas concluídas",
        description: "Toque no checkbox de cada prática ao completá-la. O progresso é salvo automaticamente e você pode acompanhar sua consistência.",
        icon: CheckCircle,
      },
      {
        title: "Acompanhe seu progresso",
        description: "A barra de progresso no topo mostra quantas práticas você completou no dia. Busque 100% todos os dias para construir disciplina mental.",
        icon: Brain,
      },
    ],
  },
  suporte: {
    title: "Como usar o Suporte",
    steps: [
      {
        title: "Envie mensagem ao mentor",
        description: "Use o chat para tirar dúvidas sobre treino, nutrição ou mindset. O mentor IA conhece seu perfil completo e dá respostas personalizadas.",
        icon: MessageCircle,
      },
      {
        title: "Chat de IA disponível 24h",
        description: "O mentor IA está disponível a qualquer hora. Pergunte sobre execução de exercícios, substituições de alimentos, ou peça motivação.",
        icon: Bot,
      },
      {
        title: "Tempo de resposta",
        description: "O mentor IA responde instantaneamente. Para questões que precisam de atenção humana, use palavras como \"urgente\" ou \"falar com humano\" para priorizar.",
        icon: Clock,
      },
    ],
  },
  evolucao: {
    title: "Como usar a Evolução",
    steps: [
      {
        title: "Envie fotos de progresso",
        description: "A cada 30 dias você pode enviar novas fotos. Tire fotos de frente, lado e costas para uma análise completa da sua transformação.",
        icon: Camera,
      },
      {
        title: "Padrão correto das fotos",
        description: "Use roupas justas ou mínimas, mesmo fundo e iluminação. Posicione a câmera na altura da cintura. Frente: braços relaxados. Lado: perfil natural. Costas: mesma posição.",
        icon: ImageIcon,
      },
      {
        title: "Análise de IA",
        description: "Após enviar as fotos, o sistema compara automaticamente com suas fotos anteriores e gera uma análise detalhada das mudanças visíveis no seu corpo.",
        icon: Sparkles,
      },
      {
        title: "Acompanhe a timeline",
        description: "Role para baixo para ver todos os seus check-ins anteriores organizados por data, com peso e fotos de cada período.",
        icon: Calendar,
      },
    ],
  },
  renascer: {
    title: "Como usar o Hoje",
    steps: [
      {
        title: "Registre dados do dia",
        description: "Informe horas de sono, nível de estresse (1-10) e nível de energia/foco (1-10). Esses dados alimentam seu Score Renascer diário.",
        icon: Heart,
      },
      {
        title: "Importe dados do celular",
        description: "Se usar Apple Saúde ou Google Fit, tire um print da tela de resumo diário e anexe na seção de screenshots. A IA extrai os dados automaticamente.",
        icon: Smartphone,
      },
      {
        title: "Anexe até 3 screenshots",
        description: "Você pode enviar até 3 prints de apps de saúde. Dados como passos, calorias ativas e minutos de exercício são extraídos e salvos.",
        icon: Upload,
      },
      {
        title: "Histórico dos últimos 7 dias",
        description: "Role para baixo para ver o gráfico e o histórico dos seus registros recentes. Acompanhe a evolução dia a dia.",
        icon: BarChart3,
      },
      {
        title: "O que é o Score Renascer",
        description: "É uma pontuação de 0-100 calculada com base em sono, estresse, energia, treino e atividade física. Quanto mais consistente, maior o score. Acima de 70 é ótimo!",
        icon: Trophy,
      },
    ],
  },
};

const STORAGE_KEY = "renascer_tutorials_seen";

function getSeenTutorials(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markTutorialSeen(pageId: string) {
  const seen = getSeenTutorials();
  if (!seen.includes(pageId)) {
    seen.push(pageId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  }
}

interface PageTutorialProps {
  pageId: string;
}

export function PageTutorial({ pageId }: PageTutorialProps) {
  const [open, setOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const tutorial = TUTORIALS[pageId];

  useEffect(() => {
    const seen = getSeenTutorials();
    setIsNew(!seen.includes(pageId));
  }, [pageId]);

  if (!tutorial) return null;

  const handleOpen = () => {
    setOpen(true);
    markTutorialSeen(pageId);
    setIsNew(false);
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handleOpen} className="relative gap-1.5 text-muted-foreground hover:text-foreground">
        <HelpCircle className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">Como usar</span>
        {isNew && (
          <Badge variant="default" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">
            !
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="w-5 h-5 text-primary" />
              {tutorial.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {tutorial.steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    {index < tutorial.steps.length - 1 && (
                      <div className="w-px h-full bg-border/50 mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-foreground">
                      {index + 1}. {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
