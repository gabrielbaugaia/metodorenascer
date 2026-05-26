import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PROTOCOL_LABEL, type Vo2Protocol } from "@/lib/vo2maxCalc";

export interface Vo2Test {
  id: string;
  protocolo: Vo2Protocol;
  valor_ml_kg_min: number;
  classificacao: string;
  test_date: string;
  local: string | null;
}

interface Props {
  tests: Vo2Test[];
}

export function Vo2MaxHistoryList({ tests }: Props) {
  if (tests.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground text-sm">
        Nenhum teste registrado ainda.
      </Card>
    );
  }

  const chartData = [...tests]
    .reverse()
    .map((t) => ({
      date: format(new Date(t.test_date + "T12:00:00"), "dd/MM", { locale: ptBR }),
      vo2: Number(t.valor_ml_kg_min),
    }));

  return (
    <div className="space-y-4">
      {tests.length >= 2 && (
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Evolução</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="vo2" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {tests.map((t) => (
          <Card key={t.id} className="p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{Number(t.valor_ml_kg_min).toFixed(1)} ml/kg/min</span>
                <Badge variant="outline" className="text-[10px]">{t.classificacao}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {PROTOCOL_LABEL[t.protocolo]} · {format(new Date(t.test_date + "T12:00:00"), "dd MMM yyyy", { locale: ptBR })}
                {t.local ? ` · ${t.local}` : ""}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
