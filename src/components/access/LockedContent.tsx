import { useState, ReactNode } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { ModuleName, MODULE_DISPLAY_NAMES } from '@/lib/moduleAccess';
import { UpgradeModal } from './UpgradeModal';

interface LockedContentProps {
  module: ModuleName;
  children: ReactNode;
  previewContent?: ReactNode;
  fallbackMessage?: string;
  className?: string;
}

/**
 * Wrapper component that shows content based on module access level.
 * - Full access: shows children
 * - Limited access: shows previewContent (if provided) + upgrade prompt
 * - No access: shows locked overlay with upgrade button
 */
export function LockedContent({ 
  module, 
  children, 
  previewContent,
  fallbackMessage,
  className = ''
}: LockedContentProps) {
  const { access, loading, hasFullAccess, hasAnyAccess, trialDaysLeft, isTrialing } = useModuleAccess(module);
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (loading) {
    return <Skeleton className={`w-full h-48 ${className}`} />;
  }

  // Full access - show content
  if (hasFullAccess) {
    return <>{children}</>;
  }

  // Limited access - show preview + upgrade prompt
  if (hasAnyAccess && previewContent) {
    return (
      <>
        {previewContent}
        <UpgradePrompt 
          module={module}
          isTrialing={isTrialing}
          trialDaysLeft={trialDaysLeft}
          onClick={() => setShowUpgrade(true)} 
        />
        <UpgradeModal 
          open={showUpgrade} 
          onClose={() => setShowUpgrade(false)}
          currentModule={module}
          trialDaysLeft={trialDaysLeft}
        />
      </>
    );
  }

  // No access - show locked overlay
  return (
    <>
      <LockedOverlay 
        module={module}
        message={fallbackMessage}
        onClick={() => setShowUpgrade(true)} 
      />
      <UpgradeModal 
        open={showUpgrade} 
        onClose={() => setShowUpgrade(false)}
        currentModule={module}
        trialDaysLeft={trialDaysLeft}
      />
    </>
  );
}

interface UpgradePromptProps {
  module: ModuleName;
  isTrialing: boolean;
  trialDaysLeft: number;
  onClick: () => void;
}

function UpgradePrompt({ module, isTrialing, trialDaysLeft, onClick }: UpgradePromptProps) {
  return (
    <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">
              {isTrialing 
                ? `Seu trial de ${MODULE_DISPLAY_NAMES[module]} termina em ${trialDaysLeft} dias`
                : `Desbloqueie acesso completo ao ${MODULE_DISPLAY_NAMES[module]}`
              }
            </p>
            <p className="text-sm text-muted-foreground">
              Faça upgrade para ver todo o conteúdo
            </p>
          </div>
        </div>
        <Button onClick={onClick} className="shrink-0">
          Ver Planos
        </Button>
      </div>
    </div>
  );
}

interface LockedOverlayProps {
  module: ModuleName;
  message?: string;
  onClick: () => void;
}

function LockedOverlay({ module, message, onClick }: LockedOverlayProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center p-8 rounded-xl bg-muted/50 border border-dashed border-muted-foreground/30 text-center cursor-pointer hover:bg-muted/70 transition-colors"
      onClick={onClick}
    >
      <div className="p-4 bg-muted rounded-full mb-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        Conteúdo Bloqueado
      </h3>
      <p className="text-muted-foreground mb-4 max-w-sm">
        {message || `O módulo de ${MODULE_DISPLAY_NAMES[module]} não está incluído no seu plano atual.`}
      </p>
      <Button onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <Sparkles className="w-4 h-4 mr-2" />
        Ver Planos de Upgrade
      </Button>
    </div>
  );
}

/**
 * Simple check component that just shows/hides content based on access
 */
interface AccessCheckProps {
  module: ModuleName;
  children: ReactNode;
  fallback?: ReactNode;
}

export function AccessCheck({ module, children, fallback }: AccessCheckProps) {
  const { hasAnyAccess, loading } = useModuleAccess(module);

  if (loading) return null;
  if (!hasAnyAccess) return <>{fallback}</> || null;
  
  return <>{children}</>;
}

/**
 * Component to show only if user has full access
 */
export function FullAccessOnly({ module, children, fallback }: AccessCheckProps) {
  const { hasFullAccess, loading } = useModuleAccess(module);

  if (loading) return null;
  if (!hasFullAccess) return <>{fallback}</> || null;
  
  return <>{children}</>;
}
