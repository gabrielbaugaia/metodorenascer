import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Footprints, Activity, Bike } from "lucide-react";
import type { Vo2Protocol } from "@/lib/vo2maxCalc";

interface Props {
  onSelect: (p: Vo2Protocol) => void;
}

const OPTIONS: {
  id: Vo2Protocol;
  title: string;
  description: string;
  badge: string;
  Icon: typeof Footprints;
}[] = [
  {
    id: "cooper",
    title: "Teste de Rua (Cooper 12 min)",
    description: "Corra o máximo possível por 12 minutos. Ideal para iniciantes e intermediários.",
    badge: "Validado cientificamente (Cooper, 1968)",
    Icon: Footprints,
  },
  {
    id: "bruce",
    title: "Teste de Esteira (Protocolo Bruce)",
    description: "Teste progressivo em esteira com estágios de intensidade crescente.",
    badge: "Protocolo clínico (Bruce et al.)",
    Icon: Activity,
  },
  {
    id: "astrand",
    title: "Teste de Bike (Astrand-Rhyming)",
    description: "Pedale em intensidade submáxima por 6 minutos e registre sua FC e carga.",
    badge: "Teste submáximo validado",
    Icon: Bike,
  },
];

export function Vo2MaxProtocolSelector({ onSelect }: Props) {
  return (
    <div className="grid gap-3">
      {OPTIONS.map(({ id, title, description, badge, Icon }) => (
        <button key={id} onClick={() => onSelect(id)} className="text-left">
          <Card className="p-4 hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1.5">
                <h4 className="font-semibold text-foreground">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
                <Badge variant="outline" className="text-[10px]">{badge}</Badge>
              </div>
            </div>
          </Card>
        </button>
      ))}
    </div>
  );
}
