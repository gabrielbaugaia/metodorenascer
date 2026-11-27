import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, FileDown, Loader2, Minus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { METHOD_NOTE, PHOTO_POSITIONS, fmt } from "@/lib/physicalAssessment";
import { HIGHLIGHT_KEYS, buildComparison, type ComparisonRow } from "@/lib/assessmentComparison";
import { fetchPhotos, useAssessmentPhotos, type AssessmentRow } from "@/hooks/usePhysicalAssessments";
import { exportComparisonPdf } from "@/lib/assessmentPdf";
import { dateBR } from "./AssessmentEvolution";

const signed = (n: number | null, digits: number) => (n == null ? "—" : `${n > 0 ? "+" : ""}${fmt(n, digits)}`);

function DeltaIcon({ row }: { row: ComparisonRow }) {
  if (row.abs == null || Math.abs(row.abs) < 1e-9) return <Minus className="h-4 w-4" aria-hidden />;
  return row.abs > 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />;
}

function HighlightCard({ row }: { row: ComparisonRow }) {
  const m = row.metric;
  const tone = row.trend.tone === "good" ? "text-primary border-primary/40" : "text-muted-foreground border-border";
  return (
    <div className="surface p-4 space-y-3 min-w-0">
      <p className="eyebrow-label truncate">{m.label}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground tabular-nums">{fmt(row.before, m.digits)}</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <span className="font-serif text-2xl tabular-nums">{fmt(row.after, m.digits)}</span>
        {m.unit && <span className="text-xs text-muted-foreground">{m.unit}</span>}
      </div>
      <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs tabular-nums ${tone}`}>
        <DeltaIcon row={row} />
        {signed(row.abs, m.digits)} {m.unit}
        {row.pct != null && <span className="opacity-70">({signed(row.pct, 1)}%)</span>}
      </div>
    </div>
  );
}

function DualBars({ title, rows }: { title: string; rows: ComparisonRow[] }) {
  if (!rows.length) return null;
  const max = Math.max(...rows.flatMap((r) => [r.before ?? 0, r.after ?? 0]), 1e-9);
  return (
    <div className="surface p-5 space-y-4 min-w-0">
      <p className="eyebrow-label">{title}</p>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.metric.key} className="space-y-1.5">
            <div className="flex justify-between gap-2 text-sm">
              <span className="truncate">{r.metric.label.replace(/^Dobra /, "")}</span>
              <span className="tabular-nums text-muted-foreground shrink-0">{signed(r.abs, r.metric.digits)} {r.metric.unit}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-muted-foreground/50" style={{ width: `${((r.before ?? 0) / max) * 100}%` }} /></div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${((r.after ?? 0) / max) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhotoPairs({ before, after }: { before: AssessmentRow; after: AssessmentRow }) {
  const pa = useAssessmentPhotos(before.id), pb = useAssessmentPhotos(after.id);
  const pairs = PHOTO_POSITIONS.map((p) => ({ p, a: pa.data?.find((x) => x.position === p.key), b: pb.data?.find((x) => x.position === p.key) })).filter((x) => x.a?.url || x.b?.url);
  if (pa.isLoading || pb.isLoading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  if (!pairs.length) return null;
  return (
    <div className="space-y-4">
      <p className="eyebrow-label">Registro fotográfico</p>
      <div className="grid gap-5 lg:grid-cols-2">
        {pairs.map(({ p, a, b }) => (
          <figure key={p.key} className="surface p-3 space-y-2">
            <figcaption className="text-sm">{p.label}</figcaption>
            <div className="grid grid-cols-2 gap-2">
              {[{ ph: a, d: before.assessed_at }, { ph: b, d: after.assessed_at }].map(({ ph, d }, i) => (
                <div key={i} className="space-y-1">
                  <div className="aspect-[3/4] rounded-md bg-muted/30 border border-border overflow-hidden flex items-center justify-center">
                    {ph?.url ? <img src={ph.url} alt={`${p.label} em ${dateBR(d)}`} className="h-full w-full object-contain" loading="lazy" /> : <span className="text-xs text-muted-foreground">Sem foto</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">{dateBR(d)}</p>
                </div>
              ))}
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Seleção de duas datas e leitura visual da evolução. Admin e aluno usam o mesmo componente. */
export function AssessmentCompare({ items, studentName }: { items: AssessmentRow[]; studentName: string }) {
  const usable = useMemo(() => items.filter((x) => x.results), [items]);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setPicked((p) => {
      const kept = p.filter((id) => usable.some((x) => x.id === id));
      if (kept.length === 2) return kept;
      return usable.length >= 2 ? [usable[0].id, usable[usable.length - 1].id] : kept;
    });
  }, [usable]);
  if (usable.length < 2) return <div className="surface p-6 text-sm text-muted-foreground">A comparação aparece a partir da segunda avaliação.</div>;

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-2)));
  const x = usable.find((a) => a.id === picked[0]), y = usable.find((a) => a.id === picked[1]);
  const cmp = x && y ? buildComparison(x, y) : null;
  const highlights = cmp ? HIGHLIGHT_KEYS.map((k) => cmp.rows.find((r) => r.metric.key === k)).filter(Boolean) as ComparisonRow[] : [];
  const sfRows = cmp ? cmp.rows.filter((r) => r.metric.key.startsWith("sf_")) : [];
  const circRows = cmp ? cmp.rows.filter((r) => r.metric.key.startsWith("c_") || r.metric.key === "waist") : [];
  const status = (a: AssessmentRow) => (a.status === "published" ? "" : a.status === "draft" ? " · rascunho" : " · não publicada");

  const pdf = async () => {
    if (!cmp) return;
    setBusy(true);
    try {
      const [pa, pb] = await Promise.all([fetchPhotos(cmp.before.id), fetchPhotos(cmp.after.id)]);
      await exportComparisonPdf(cmp.before, cmp.after, pa, pb, studentName);
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível gerar o PDF");
    } finally { setBusy(false); }
  };

  return (
    <section className="space-y-6" aria-labelledby="compare-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow-label">Comparação</p>
          <h2 id="compare-title" className="font-serif text-2xl mt-1">Antes e depois</h2>
          <p className="text-sm text-muted-foreground mt-1">Toque em duas datas para comparar.</p>
        </div>
        <Button onClick={pdf} disabled={!cmp || busy} className="self-start min-h-11">
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}Baixar PDF da comparação
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Datas para comparar">
        {[...usable].reverse().map((a) => {
          const on = picked.includes(a.id);
          return (
            <button key={a.id} type="button" aria-pressed={on} onClick={() => toggle(a.id)}
              className={`shrink-0 rounded-xl border px-4 py-3 text-left min-h-11 transition-colors duration-200 ${on ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"}`}>
              <span className="block text-sm font-semibold">{dateBR(a.assessed_at)}</span>
              <span className="block text-xs text-muted-foreground">{fmt(a.results?.body_fat_pct, 1)}% gordura · v{a.version}{status(a)}</span>
            </button>
          );
        })}
      </div>

      {!cmp ? <p className="text-sm text-muted-foreground">Selecione duas datas.</p> : (
        <>
          <div className="surface p-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
            <div><p className="eyebrow-label">Antes</p><p className="font-serif text-xl sm:text-2xl mt-1">{dateBR(cmp.before.assessed_at)}</p></div>
            <div className="text-xs text-muted-foreground"><ArrowRight className="h-4 w-4 mx-auto text-primary" aria-hidden /><span className="block mt-1 tabular-nums">{cmp.days} dias</span></div>
            <div><p className="eyebrow-label">Depois</p><p className="font-serif text-xl sm:text-2xl mt-1">{dateBR(cmp.after.assessed_at)}</p></div>
          </div>

          <div className="grid gap-3 grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4">
            {highlights.map((r) => <HighlightCard key={r.metric.key} row={r} />)}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DualBars title="Dobras cutâneas (mm)" rows={sfRows} />
            <DualBars title="Circunferências (cm)" rows={circRows} />
          </div>
          <p className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-muted-foreground/50" />Antes</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full bg-primary" />Depois</span>
            <span>Peso, IMC, dobras isoladas e medidas são neutros: dependem do objetivo.</span>
          </p>

          <PhotoPairs before={cmp.before} after={cmp.after} />
          <p className="text-xs text-muted-foreground leading-relaxed">{METHOD_NOTE}</p>
        </>
      )}
    </section>
  );
}

