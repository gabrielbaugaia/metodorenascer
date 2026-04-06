import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Camera } from "lucide-react";

interface ProtocolRenewalBannerProps {
  daysSinceLastProtocol: number;
  needsEvolutionPhotos: boolean;
}

export function ProtocolRenewalBanner({ daysSinceLastProtocol, needsEvolutionPhotos }: ProtocolRenewalBannerProps) {
  const navigate = useNavigate();

  if (daysSinceLastProtocol < 28 || !needsEvolutionPhotos) return null;

  const isExpired = daysSinceLastProtocol >= 60;

  return (
    <Card className={`border ${isExpired ? "border-destructive/40 bg-destructive/5" : "border-yellow-500/40 bg-yellow-500/5"}`}>
      <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isExpired ? "bg-destructive/20" : "bg-yellow-500/20"}`}>
          {isExpired ? (
            <AlertTriangle className={`h-5 w-5 text-destructive`} />
          ) : (
            <RefreshCw className={`h-5 w-5 text-yellow-500`} />
          )}
        </div>

        <CardTitle className="text-base">
          {isExpired ? "Protocolo Expirado" : "Ajuste de Protocolo"}
        </CardTitle>

        <p className="text-sm text-muted-foreground max-w-sm">
          {isExpired
            ? `Seu protocolo completou ${daysSinceLastProtocol} dias. Envie fotos e medidas de evolução para gerar seu novo protocolo.`
            : `Seu protocolo completou ${daysSinceLastProtocol} dias. Envie seus dados de evolução para ajustarmos seu treino.`}
        </p>

        <Button
          variant={isExpired ? "destructive" : "fire"}
          size="lg"
          className="w-full mt-1"
          onClick={() => navigate("/evolucao")}
        >
          <Camera className="mr-2 h-4 w-4" />
          Enviar Evolução
        </Button>
      </CardContent>
    </Card>
  );
}
