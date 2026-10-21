import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CIRCUMFERENCES, METHOD_NOTE, PHOTO_POSITIONS, SKINFOLDS, diff, fmt } from "@/lib/physicalAssessment";
import { fetchPhotos, useAssessmentPhotos, type AssessmentRow } from "@/hooks/usePhysicalAssessments";
import { exportAssessmentPdf } from "@/lib/assessmentPdf";

export const dateBR = (d: string) => format(new Date(d + "T12:00:00"), "dd/MM/yyyy");

/** Direção considerada favorável quando o objetivo é composição corporal; null = neutro (depende do contexto). */
type Metric = { key: string; label: string; unit: string; digits: number; get: (a: AssessmentRow) => number | null | undefined; favorable: "down" | "up" | null };

export const METRICS: Metric[] = [
  { key: "bf", label: "% de gordura", unit: "%", digits: 2, get: (a) => a.results?.body_fat_pct, favorable: "down" },
  { key: "fat", label: "Massa gorda", unit: "kg", digits: 2, get: (a) => a.results?.fat_mass_kg, favorable: "down" },
  { key: "lean", label: "Massa livre de gordura", unit: "kg", digits: 2, get: (a) => a.results?.lean_mass_kg, favorable: "up" },
  { key: "weight", label: "Peso", unit: "kg", digits: 1, get: (a) => a.weight_kg, favorable: null },
  { key: "bmi", label: "IMC", unit: "", digits: 2, get: (a) => a.results?.bmi, favorable: null },
  { key: "waist", label: "Cintura", unit: "cm", digits: 1, get: (a) => a.circumferences?.waist, favorable: "down" },
  { key: "whr", label: "RCQ", unit: "", digits: 3, get: (a) => a.results?.whr, favorable: "down" },
  { key: "whtr", label: "RCE", unit: "", digits: 3, get: (a) => a.results?.whtr, favorable: "down" },
  { key: "sum", label: "Soma das 7 dobras", unit: "mm", digits: 1, get: (a) => a.results?.skinfold_sum, favorable: "down" },
  ...SKINFOLDS.map((s) => ({ key: `sf_${s.key}`, label: `Dobra ${s.label}`, unit: "mm", digits: 1, get: (a: AssessmentRow) => a.skinfolds?.[s.key], favorable: null })),
  ...CIRCUMFERENCES.filter((c) => c.key !== "waist").map((c) => ({ key: `c_${c.key}`, label: c.label, unit: "cm", digits: 1, get: (a: AssessmentRow) => a.circumferences?.[c.key], favorable: null })),
];

function trend(m: Metric, abs: number | null) {
  if (abs == null || Math.abs(abs) < 1e-9) return { text: "sem variação", cls: "text-muted-foreground" };
  const dir = abs > 0 ? "up" : "down";
  if (!m.favorable) return { text: dir === "up" ? "aumentou" : "reduziu", cls: "text-muted-foreground" };
  return dir === m.favorable
    ? { text: "tendência favorável", cls: "text-primary" }
    : { text: "atenção ao contexto", cls: "text-foreground" };
}

export function PhotoGrid({ assessment, label }: { assessment: AssessmentRow; label?: string }) {
  const { data, isLoading } = useAssessmentPhotos(assessment.id);
  return (
    <div className="space-y-2 min-w-0">
      {label && <p className="eyebrow-label">{label}</p>}
      <div className="grid grid-cols-2 gap-2">
        {PHOTO_POSITIONS.map((p) => {
          const ph = data?.find((x) => x.position === p.key);
          return (
            <figure key={p.key} className="rounded-lg border border-border bg-muted/30 overflow-hidden">
              <div className="aspect-[3/4] flex items-center justify-center">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  : ph?.url ? <img src={ph.url} alt={`${p.label} em ${dateBR(assessment.assessed_at)}`} className="h-full w-full object-contain" loading="lazy" />
                  : <span className="text-xs text-muted-foreground">Sem foto</span>}
              </div>
              <figcaption className="px-2 py-1 text-[11px] text-muted-foreground">{p.label}</figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}

export function AssessmentSummary({ a, studentName }: { a: AssessmentRow; studentName: string }) {
  const [busy, setBusy] = useState(false);
  const r = a.results;
  const items: [string, string][] = [
    ["Gordura estimada", `${fmt(r?.body_fat_pct, 2)}%`],
    ["Massa gorda", `${fmt(r?.fat_mass_kg, 2)} kg`],
    ["Massa livre de gordura", `${fmt(r?.lean_mass_kg, 2)} kg`],
    ["Peso", `${fmt(a.weight_kg)} kg`],
    ["IMC", fmt(r?.bmi, 2)],
    ["RCQ", fmt(r?.whr, 3)],
    ["RCE", fmt(r?.whtr, 3)],
    ["Soma 7 dobras", `${fmt(r?.skinfold_sum)} mm`],
  ];
  const pdf = async () => {
    setBusy(true);
    try {
      await exportAssessmentPdf(a, await fetchPhotos(a.id), studentName);
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível gerar o PDF");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
        <div className="min-w-0">
          <p className="eyebrow-label">Avaliação de {dateBR(a.assessed_at)}</p>
          <CardTitle className="text-lg mt-1">Composição corporal · v{a.version}</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={pdf} disabled={busy} className="self-start min-h-11">
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
          Exportar laudo PDF
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {items.map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border p-3">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="text-base font-semibold mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>
        {(a.notes || a.recommendations) && (
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {a.notes && <div><p className="eyebrow-label mb-1">Observações</p><p className="whitespace-pre-wrap">{a.notes}</p></div>}
            {a.recommendations && <div><p className="eyebrow-label mb-1">Recomendações</p><p className="whitespace-pre-wrap">{a.recommendations}</p></div>}
          </div>
        )}
        <PhotoGrid assessment={a} />
        <p className="text-xs text-muted-foreground leading-relaxed">{METHOD_NOTE}</p>
      </CardContent>
    </Card>
  );
}

export function EvolutionCharts({ items }: { items: AssessmentRow[] }) {
  const available = METRICS.filter((m) => items.some((a) => m.get(a) != null));
  const [metric, setMetric] = useState(available[0]?.key ?? "bf");
  const m = available.find((x) => x.key === metric) ?? available[0];
  if (!m || items.length < 2) {
    return <p className="text-sm text-muted-foreground">Os gráficos aparecem a partir da segunda avaliação publicada.</p>;
  }
  const data = items.map((a) => ({ date: dateBR(a.assessed_at), v: m.get(a) ?? null }));
  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-lg">Evolução cronológica</CardTitle>
        <div className="max-w-xs">
          <Label htmlFor="metric" className="sr-only">Indicador</Label>
          <Select value={m.key} onValueChange={setMetric}>
            <SelectTrigger id="metric" className="min-h-11"><SelectValue /></SelectTrigger>
            <SelectContent>{available.map((x) => <SelectItem key={x.key} value={x.key}>{x.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full" role="img" aria-label={`Gráfico de ${m.label} ao longo das avaliações`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: number) => [`${fmt(v, m.digits)} ${m.unit}`, m.label]}
              />
              <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ComparisonPanel({ items }: { items: AssessmentRow[] }) {
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");
  useEffect(() => {
    if (items.length >= 2) {
      setAId((p) => (items.some((x) => x.id === p) ? p : items[0].id));
      setBId((p) => (items.some((x) => x.id === p) ? p : items[items.length - 1].id));
    }
  }, [items]);
  const a = items.find((x) => x.id === aId);
  const b = items.find((x) => x.id === bId);
  const rows = useMemo(() => (a && b ? METRICS.filter((m) => m.get(a) != null || m.get(b) != null) : []), [a, b]);
  if (items.length < 2) return null;
  const opt = (x: AssessmentRow) => `${dateBR(x.assessed_at)}${x.status !== "published" ? ` (${x.status})` : ""} · v${x.version}`;
  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-lg">Comparar duas avaliações</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {[["Avaliação inicial", aId, setAId], ["Avaliação final", bId, setBId]].map(([lbl, val, set]: any) => (
            <div key={lbl} className="space-y-1">
              <Label>{lbl}</Label>
              <Select value={val} onValueChange={set}>
                <SelectTrigger className="min-h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{items.map((x) => <SelectItem key={x.id} value={x.id}>{opt(x)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </CardHeader>
      {a && b && (
        <CardContent className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Indicador</TableHead>
                <TableHead className="text-right">{dateBR(a.assessed_at)}</TableHead>
                <TableHead className="text-right">{dateBR(b.assessed_at)}</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead>Leitura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => {
                const va = m.get(a), vb = m.get(b);
                const d = diff(va, vb);
                const t = trend(m, d.abs);
                return (
                  <TableRow key={m.key}>
                    <TableCell className="whitespace-nowrap">{m.label}{m.unit && <span className="text-muted-foreground"> ({m.unit})</span>}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(va, m.digits)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(vb, m.digits)}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.abs == null ? "—" : `${d.abs > 0 ? "+" : ""}${fmt(d.abs, m.digits)}`}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.pct == null ? "—" : `${d.pct > 0 ? "+" : ""}${fmt(d.pct, 1)}%`}</TableCell>
                    <TableCell className={`text-xs whitespace-nowrap ${t.cls}`}>{t.text}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground">
            Variações de peso, IMC, dobras isoladas e circunferências são neutras: dependem do objetivo e devem ser lidas com o acompanhamento profissional.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <PhotoGrid assessment={a} label={dateBR(a.assessed_at)} />
            <PhotoGrid assessment={b} label={dateBR(b.assessed_at)} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
