import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { startOfWeek, format, parseISO } from "date-fns";
import type { Activity } from "@/hooks/useHyrox90";
import { dateBR, paceSeconds, type SetEntry, type StationEntry } from "@/lib/hyrox90";

const axis = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };
const tip = {
  contentStyle: { background: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" },
};
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function Chart({ title, data, dataKey, fmt, bar }: { title: string; data: Record<string, unknown>[]; dataKey: string; fmt?: (v: number) => string; bar?: boolean }) {
  return (
    <section className="space-y-3 min-w-0">
      <h4 className="font-medium">{title}</h4>
      <div className="h-52 w-full">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            {bar ? (
              <BarChart data={data}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={axis} />
                <YAxis tick={axis} />
                <Tooltip {...tip} />
                <Bar dataKey={dataKey} fill="hsl(var(--primary))" isAnimationActive={false} />
              </BarChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={axis} />
                <YAxis tick={axis} domain={["auto", "auto"]} tickFormatter={fmt} reversed={!!fmt} />
                <Tooltip {...tip} formatter={(v: number) => (fmt ? fmt(v) : v)} />
                <Line dataKey={dataKey} stroke="hsl(var(--primary))" strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm py-8">Sem registros ainda.</p>
        )}
      </div>
    </section>
  );
}

export function HyroxCharts({ activities }: { activities: Activity[] }) {
  const done = activities
    .filter((a) => a.status === "completed")
    .sort((a, b) => (a.actual_date ?? "").localeCompare(b.actual_date ?? ""));
  const runs = done.filter((a) => a.kind === "running");
  const pace = runs.flatMap((a) => {
    const s = paceSeconds(a.pace);
    return s ? [{ label: dateBR(a.actual_date!).slice(0, 5), pace: s }] : [];
  });
  const dist = runs.filter((a) => a.distance_km).map((a) => ({ label: dateBR(a.actual_date!).slice(0, 5), km: Number(a.distance_km) }));
  const weekly = Object.entries(
    runs.reduce<Record<string, number>>((acc, a) => {
      const w = format(startOfWeek(parseISO(a.actual_date!), { weekStartsOn: 1 }), "dd/MM");
      acc[w] = (acc[w] ?? 0) + Number(a.distance_km ?? 0);
      return acc;
    }, {}),
  ).map(([label, km]) => ({ label, km: Math.round(km * 10) / 10 }));
  const station = (name: string) =>
    done
      .filter((a) => a.kind === "hyrox")
      .flatMap((a) => {
        const e = (a.station_entries as unknown as StationEntry[]).find((s) => s.station === name);
        return e?.time_s ? [{ label: dateBR(a.actual_date!).slice(0, 5), tempo: e.time_s }] : [];
      });
  const volume = done
    .filter((a) => a.kind === "strength")
    .map((a) => ({
      label: dateBR(a.actual_date!).slice(0, 5),
      volume: Math.round(
        (a.set_entries as unknown as SetEntry[]).filter((e) => e.done).reduce((t, e) => t + (e.weight ?? 0) * (e.reps ?? 0), 0),
      ),
    }))
    .filter((v) => v.volume > 0);
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <Chart title="Pace médio da corrida (min/km)" data={pace} dataKey="pace" fmt={mmss} />
      <Chart title="Distância por corrida (km)" data={dist} dataKey="km" />
      <Chart title="Volume semanal de corrida (km)" data={weekly} dataKey="km" bar />
      <Chart title="Volume de musculação (kg × reps)" data={volume} dataKey="volume" bar />
      <Chart title="Burpee Broad Jump — tempo" data={station("Burpee Broad Jump")} dataKey="tempo" fmt={mmss} />
      <Chart title="Wall Balls — tempo" data={station("Wall Balls")} dataKey="tempo" fmt={mmss} />
    </div>
  );
}
