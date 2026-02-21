import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface ScoreSparklineProps {
  data: { date: string; score: number }[];
}

export function ScoreSparkline({ data }: ScoreSparklineProps) {
  if (data.length < 3) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        Complete 3 dias para ver tendência
      </p>
    );
  }

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#sparkGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
