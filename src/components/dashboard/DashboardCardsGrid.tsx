import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DashboardCardItem {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  href: string;
}

interface DashboardCardsGridProps {
  cards: DashboardCardItem[];
}

export function DashboardCardsGrid({ cards }: DashboardCardsGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          variant="dashboard"
          className="group cursor-pointer animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
          onClick={() => navigate(card.href)}
        >
          <CardHeader className="pb-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <card.icon className="w-7 h-7 text-foreground" />
            </div>
            <CardTitle className="text-3xl">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
