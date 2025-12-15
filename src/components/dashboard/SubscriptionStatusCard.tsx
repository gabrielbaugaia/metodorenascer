import { Card } from "@/components/ui/card";
import { Crown } from "lucide-react";

interface SubscriptionStatusCardProps {
  subscriptionEnd: string;
}

export function SubscriptionStatusCard({ subscriptionEnd }: SubscriptionStatusCardProps) {
  return (
    <Card variant="glass" className="mb-4 p-4 border-primary/20">
      <div className="flex items-center gap-3">
        <Crown className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">Assinatura Ativa</p>
          <p className="text-xs text-muted-foreground">
            Válida até {new Date(subscriptionEnd).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
    </Card>
  );
}
