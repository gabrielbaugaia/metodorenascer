import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatPriceBRL, MODULE_DISPLAY_NAMES, ModuleName } from '@/lib/moduleAccess';
import { 
  Dumbbell, 
  Utensils, 
  Brain, 
  ChefHat, 
  Check, 
  Sparkles,
  Crown,
  Clock
} from 'lucide-react';

interface CommercialPlan {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  features: string[];
  modules_access: Record<string, string>;
  is_popular: boolean;
  sort_order: number;
}

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentModule?: ModuleName;
  trialDaysLeft?: number;
}

export function UpgradeModal({ 
  open, 
  onClose, 
  currentModule,
  trialDaysLeft 
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchPlans();
    }
  }, [open]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('commercial_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      
      setPlans(data?.map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features as string[] : [],
        modules_access: (p.modules_access as Record<string, string>) || {}
      })) || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: CommercialPlan) => {
    // Navigate to checkout/subscription page with selected plan
    navigate(`/assinatura?plan=${plan.slug}`);
    onClose();
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'treino': return <Dumbbell className="w-4 h-4" />;
      case 'nutricao': return <Utensils className="w-4 h-4" />;
      case 'mindset': return <Brain className="w-4 h-4" />;
      case 'receitas': return <ChefHat className="w-4 h-4" />;
      default: return null;
    }
  };

  const moduleHighlight = currentModule ? MODULE_DISPLAY_NAMES[currentModule] : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Crown className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl">
            Desbloqueie Acesso Completo
          </DialogTitle>
          <DialogDescription className="text-base">
            {trialDaysLeft && trialDaysLeft > 0 ? (
              <span className="flex items-center justify-center gap-2 mt-2">
                <Clock className="w-4 h-4" />
                Seu período de teste termina em {trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'}
              </span>
            ) : moduleHighlight ? (
              `Faça upgrade para ter acesso completo ao módulo de ${moduleHighlight}`
            ) : (
              'Escolha o plano ideal para sua transformação'
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {plans.map((plan) => {
              const hasModule = currentModule && 
                plan.modules_access[currentModule] === 'full';

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border-2 p-5 transition-all ${
                    plan.is_popular 
                      ? 'border-primary bg-primary/5 shadow-lg' 
                      : 'border-border hover:border-primary/50'
                  } ${hasModule ? 'ring-2 ring-green-500' : ''}`}
                >
                  {plan.is_popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Mais Popular
                    </Badge>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.description}
                    </p>
                    <div className="mt-3">
                      <span className="text-3xl font-bold">
                        {formatPriceBRL(plan.price_cents)}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </div>

                  {/* Modules included */}
                  <div className="flex justify-center gap-2 mb-4">
                    {['treino', 'nutricao', 'mindset', 'receitas'].map((mod) => {
                      const hasAccess = plan.modules_access[mod] === 'full';
                      return (
                        <div
                          key={mod}
                          className={`p-2 rounded-lg ${
                            hasAccess 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                              : 'bg-muted text-muted-foreground opacity-40'
                          }`}
                          title={MODULE_DISPLAY_NAMES[mod as ModuleName]}
                        >
                          {getModuleIcon(mod)}
                        </div>
                      );
                    })}
                  </div>

                  {/* Features list */}
                  <ul className="space-y-2 mb-4">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full" 
                    variant={plan.is_popular ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {hasModule ? 'Desbloquear Agora' : 'Escolher Plano'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-4 text-sm text-muted-foreground">
          <p>Cancele a qualquer momento. Sem compromisso.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
