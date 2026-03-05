import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface MacroDonutProps {
  label: string;
  consumed: number;
  target: number;
  color: string;
  unit?: string;
}

export function MacroDonutChart({ label, consumed, target, color, unit = "g" }: MacroDonutProps) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  const data = [
    { value: pct },
    { value: 100 - pct },
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-16 h-16 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={20}
              outerRadius={30}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="hsl(var(--muted))" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-foreground">{Math.round(consumed)}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-[10px] text-muted-foreground">{Math.round(consumed)}/{Math.round(target)}{unit}</span>
    </div>
  );
}
