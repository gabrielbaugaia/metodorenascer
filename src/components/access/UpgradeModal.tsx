import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check } from 'lucide-react';

const STRIPE_TRIAL_LINK = 'https://buy.stripe.com/9B67sKeMW4ru2sp7Gy2B201';
const STRIPE_DIRECT_LINK = 'https://buy.stripe.com/fZu3cudIS3nqaYVf902B205';

const BENEFITS = [
  'Todos os treinos personalizados',
  'Plano nutricional completo',
  'Biblioteca de receitas ilimitada',
  'Mindset e desenvolvimento pessoal',
  'Suporte prioritário com mentor',
];

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentModule?: string;
  trialDaysLeft?: number;
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Crown className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl">
            Desbloqueie o acesso completo
          </DialogTitle>
          <DialogDescription className="text-base">
            Você está no acesso limitado. Desbloqueie o plano completo para continuar.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 my-4">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3 text-sm">
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-3">
          <Button
            variant="fire"
            className="w-full"
            onClick={() => window.open(STRIPE_TRIAL_LINK, '_blank')}
          >
            Testar 7 dias grátis
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(STRIPE_DIRECT_LINK, '_blank')}
          >
            Assinar agora
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-2">
          Cancele a qualquer momento. Sem compromisso.
        </p>
      </DialogContent>
    </Dialog>
  );
}
