import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Watch, Smartphone } from "lucide-react";
import { platform, isNative } from "@/services/platform";

interface WearableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WearableModal({ open, onOpenChange }: WearableModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dados Automáticos</DialogTitle>
          <DialogDescription>
            {isNative
              ? `Toque em Sincronizar para conectar seu ${platform === 'ios' ? 'Apple Health' : 'Health Connect'}.`
              : 'Conecte seu relógio e o app preencherá automaticamente.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Show only the relevant provider on native, both on web */}
          {(platform === 'android' || !isNative) && (
            <div className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
              <Smartphone className="h-6 w-6 text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isNative ? 'Health Connect' : 'Android'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isNative
                    ? 'Sono, passos e frequência cardíaca serão sincronizados via Health Connect.'
                    : 'Via Health Connect — sono, passos e frequência cardíaca serão sincronizados automaticamente.'}
                </p>
              </div>
            </div>
          )}
          {(platform === 'ios' || !isNative) && (
            <div className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
              <Watch className="h-6 w-6 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isNative ? 'Apple Health' : 'Apple'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isNative
                    ? 'Sono, HRV e frequência cardíaca em repouso serão importados do seu Apple Watch.'
                    : 'Via Apple Health — sono, HRV e frequência cardíaca em repouso serão importados do seu Apple Watch.'}
                </p>
              </div>
            </div>
          )}
          {!isNative && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              Baixe o app Renascer Connect para sincronizar dados reais.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
