import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Watch, Smartphone } from "lucide-react";

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
            Em breve você conectará seu relógio e o app preencherá automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
            <Smartphone className="h-6 w-6 text-green-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Android</p>
              <p className="text-xs text-muted-foreground">
                Via Health Connect — sono, passos e frequência cardíaca serão sincronizados automaticamente.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border/50 p-4">
            <Watch className="h-6 w-6 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Apple</p>
              <p className="text-xs text-muted-foreground">
                Via Apple Health — sono, HRV e frequência cardíaca em repouso serão importados do seu Apple Watch.
              </p>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground pt-2">
            Funcionalidade em desenvolvimento. Fique atento às atualizações.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
