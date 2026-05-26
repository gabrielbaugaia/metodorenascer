import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Vo2MaxDashboardCard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: test } = useQuery({
    queryKey: ["vo2max-latest", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vo2max_tests")
        .select("*")
        .eq("user_id", user!.id)
        .order("test_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (!test) return null;

  const isGood = ["Bom", "Excelente", "Superior"].includes(test.classificacao);
  const badgeClass = isGood
    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40"
    : test.classificacao === "Regular"
    ? "bg-amber-500/15 text-amber-500 border-amber-500/40"
    : "bg-destructive/15 text-destructive border-destructive/40";

  return (
    <Card
      className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => navigate("/vo2max")}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FlaskConical className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">VO2 Máx</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground tabular-nums">
                {Number(test.valor_ml_kg_min).toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">ml/kg/min</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-[10px] ${badgeClass}`}>{test.classificacao}</Badge>
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(test.test_date + "T12:00:00"), "dd MMM", { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Card>
  );
}
