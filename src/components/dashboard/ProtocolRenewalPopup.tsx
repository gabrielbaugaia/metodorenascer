import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Zap, RefreshCw, Camera } from "lucide-react";

interface ProtocolRenewalPopupProps {
  daysSinceLastProtocol: number;
}

const DISMISS_KEY = "protocol_renewal_popup_dismissed_at";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function ProtocolRenewalPopup({ daysSinceLastProtocol }: ProtocolRenewalPopupProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const is90 = daysSinceLastProtocol >= 85;
  const is30 = daysSinceLastProtocol >= 28;
  const shouldShow = is30 || is90;

  useEffect(() => {
    if (!shouldShow) return;

    const lastDismissed = localStorage.getItem(DISMISS_KEY);
    if (lastDismissed) {
      const elapsed = Date.now() - Number(lastDismissed);
      if (elapsed < COOLDOWN_MS) return;
    }

    // Small delay so dashboard renders first
    const timer = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(timer);
  }, [shouldShow]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  };

  const handleGoToEvolution = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
    navigate("/evolucao");
  };

  if (!shouldShow) return null;

  const title = is90
    ? "🚨 Seu protocolo completou 90 dias!"
    : "📊 Seu protocolo completou 30 dias!";

  const description = is90
    ? "Um novo protocolo é essencial para continuar evoluindo. Seu corpo já se adaptou aos estímulos atuais."
    : "É hora de ajustar seu treino, nutrição e mentalidade para continuar progredindo.";

  const bullets = is90
    ? [
        { icon: AlertTriangle, text: "Após 90 dias, seu corpo se adaptou completamente — os ganhos param." },
        { icon: RefreshCw, text: "Novos estímulos são necessários para quebrar o platô." },
        { icon: TrendingUp, text: "Envie fotos e medidas para gerar um protocolo 100% novo." },
        { icon: Zap, text: "Quanto antes enviar, mais rápido seu novo plano estará pronto." },
      ]
    : [
        { icon: TrendingUp, text: "Seu corpo já começou a se adaptar aos estímulos atuais." },
        { icon: RefreshCw, text: "Ajustes de carga, volume e dieta mantêm a evolução." },
        { icon: Camera, text: "Envie fotos e medidas de evolução para compararmos." },
        { icon: Zap, text: "Com seus dados, ajustamos tudo em até 24h." },
      ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={`text-lg ${is90 ? "text-destructive" : "text-primary"}`}>
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Por que isso importa:
          </p>
          {bullets.map((b, i) => (
            <div key={i} className="flex items-start gap-3">
              <b.icon className={`h-4 w-4 mt-0.5 shrink-0 ${is90 ? "text-destructive" : "text-primary"}`} />
              <p className="text-sm text-foreground">{b.text}</p>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant={is90 ? "destructive" : "default"}
            className="w-full"
            size="lg"
            onClick={handleGoToEvolution}
          >
            <Camera className="mr-2 h-4 w-4" />
            Enviar Evolução Agora
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleDismiss}>
            Lembrar depois
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
