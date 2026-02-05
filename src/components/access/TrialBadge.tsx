import { Clock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { ModuleName } from '@/lib/moduleAccess';
import { cn } from '@/lib/utils';

interface TrialBadgeProps {
  module?: ModuleName;
  className?: string;
  showDaysOnly?: boolean;
}

/**
 * Badge component that shows trial status and days remaining
 */
export function TrialBadge({ module, className, showDaysOnly = false }: TrialBadgeProps) {
  // If module is provided, check that specific module
  // Otherwise, this is a general trial indicator
  const { isTrialing, trialDaysLeft, loading } = module 
    ? useModuleAccess(module) 
    : { isTrialing: false, trialDaysLeft: 0, loading: false };

  if (loading || !isTrialing) return null;

  const isExpiringSoon = trialDaysLeft <= 2;
  const isLastDay = trialDaysLeft <= 1;

  if (showDaysOnly) {
    return (
      <span className={cn(
        "text-sm font-medium",
        isLastDay ? "text-destructive" : isExpiringSoon ? "text-amber-500" : "text-muted-foreground",
        className
      )}>
        {trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'}
      </span>
    );
  }

  return (
    <Badge 
      variant={isLastDay ? "destructive" : isExpiringSoon ? "secondary" : "outline"}
      className={cn("gap-1", className)}
    >
      <Clock className="w-3 h-3" />
      {isLastDay ? (
        'Último dia!'
      ) : (
        `${trialDaysLeft} dias restantes`
      )}
    </Badge>
  );
}

/**
 * Banner component for trial users - shows at top of pages
 */
interface TrialBannerProps {
  trialDaysLeft: number;
  onUpgradeClick: () => void;
  className?: string;
}

export function TrialBanner({ trialDaysLeft, onUpgradeClick, className }: TrialBannerProps) {
  const isExpiringSoon = trialDaysLeft <= 2;
  const isLastDay = trialDaysLeft <= 1;

  return (
    <div className={cn(
      "w-full p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3",
      isLastDay 
        ? "bg-destructive/10 border border-destructive/20" 
        : isExpiringSoon 
          ? "bg-amber-500/10 border border-amber-500/20" 
          : "bg-primary/10 border border-primary/20",
      className
    )}>
      <div className="flex items-center gap-2">
        {isLastDay ? (
          <Clock className="w-5 h-5 text-destructive animate-pulse" />
        ) : (
          <Sparkles className="w-5 h-5 text-primary" />
        )}
        <span className="font-medium">
          {isLastDay 
            ? 'Seu período de teste termina hoje!'
            : `Seu período de teste termina em ${trialDaysLeft} dias`
          }
        </span>
      </div>
      <button
        onClick={onUpgradeClick}
        className={cn(
          "px-4 py-1.5 rounded-md font-medium text-sm transition-colors",
          isLastDay
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        Fazer Upgrade
      </button>
    </div>
  );
}
