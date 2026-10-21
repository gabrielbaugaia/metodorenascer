import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { useMovementMedia, type MovementAssessment, type MovementReport as Report } from "@/hooks/useMovementAssessments";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { PHOTO_POSITIONS, VIDEO_POSITIONS } from "@/lib/movementAssessment";
import { useState } from "react";

export function MovementAnalysisText({ report }: { report: Report }) {
  return <section className="space-y-4 text-sm">
    <h3 className="section-title">Análise de movimento · Equipe GB</h3>
    <p className="whitespace-pre-wrap break-words">{report.summary}</p>
    <ul className="divide-y divide-border">{report.observations.map((o, i) => <li key={i} className="py-3 break-words"><p>{o.observation}</p><p className="text-xs text-muted-foreground">{o.second !== null ? `Quadro em ${o.second.toLocaleString("pt-BR")} s · ` : ""}Confiança {o.confidence}</p></li>)}</ul>
    <div><h4 className="font-semibold">Recomendações</h4><p className="whitespace-pre-wrap break-words">{report.recommendations}</p></div>
    <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">{report.limitations}</p>
  </section>;
}

export function MovementReportView({ assessment: a, studentName }: { assessment: MovementAssessment; studentName: string }) {
  const media = useMovementMedia(a.id);
  const [exporting, setExporting] = useState(false);
  const date = new Date(a.assessed_at + "T12:00:00").toLocaleDateString("pt-BR");
  const exportPdf = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF(); let y = 22;
      const line = (text: string, size = 10) => {
        doc.setFontSize(size);
        for (const row of doc.splitTextToSize(text, 172)) { if (y > 275) { doc.addPage(); y = 22; } doc.text(row, 19, y); y += size * 0.5; }
        y += 4;
      };
      doc.setFont("times", "normal");
      line("Gabriel Baú Consultoria", 20); line("Laudo de avaliação de movimento · Equipe GB", 14);
      line(`${studentName} · ${date} · Versão ${a.version}`);
      if (a.report) { line(a.report.summary); a.report.observations.forEach(o => line(`${o.second !== null ? `${o.second} s: ` : ""}${o.observation}`)); line(`Recomendações: ${a.report.recommendations}`); }
      a.findings.forEach(f => line(`${f.region}: ${f.label} (${f.severity})`));
      if (a.restrictions) line(`Restrições aprovadas para o treino: ${a.restrictions}`);
      if (a.notes) line(`Observações: ${a.notes}`);
      for (const m of media.data ?? []) {
        if (m.kind !== "photo" || !m.url) continue;
        const image = new Image(); image.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Não foi possível incluir uma foto no PDF")); image.src = m.url ?? ""; });
        doc.addPage(); y = 22;
        line(PHOTO_POSITIONS.find(p => p.key === m.position_key)?.label ?? m.position_key, 14);
        const ratio = Math.min(170 / image.naturalWidth, 225 / image.naturalHeight);
        doc.addImage(image, "JPEG", 20, y, image.naturalWidth * ratio, image.naturalHeight * ratio);
      }
      doc.addPage(); y = 22;
      line("Nota metodológica", 14);
      line(a.report?.limitations ?? "Observação visual e achados registrados pelo treinador.");
      line("Avaliação visual não é diagnóstico nem medição de força ou torque. Vídeos são observados por amostras de quadros; o original está disponível no app. Orientações de treino são definidas pelo treinador.");
      doc.save(`laudo-movimento-${a.assessed_at}-v${a.version}.pdf`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível exportar o laudo"); } finally { setExporting(false); }
  };
  return <article className="space-y-6 border-t border-border pt-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="section-title">{date} · Versão {a.version}</h2><Button variant="outline" disabled={exporting || media.isLoading || !!media.error} onClick={exportPdf}><Download className="mr-2 h-4 w-4" />{exporting ? "Exportando" : "Baixar laudo PDF"}</Button></div>
    {a.report && <MovementAnalysisText report={a.report} />}
    <section><h3 className="font-semibold mb-3">Achados e orientações aprovados</h3>{a.findings.length ? <ul className="space-y-2 text-sm">{a.findings.map(f => <li key={f.key}>{f.region} · {f.label} · {f.severity}</li>)}</ul> : <p className="text-sm text-muted-foreground">Sem achados registrados.</p>}</section>
    {a.restrictions && <p className="text-sm whitespace-pre-wrap break-words"><strong>Restrições para o treino: </strong>{a.restrictions}</p>}
    {a.notes && <p className="text-sm whitespace-pre-wrap break-words">{a.notes}</p>}
    {media.isLoading ? <Loader2 className="animate-spin h-5 w-5" aria-label="Carregando mídias" /> : media.error ? <div role="alert"><p>Não foi possível abrir as mídias.</p><Button variant="outline" onClick={() => media.refetch()}>Tentar novamente</Button></div> : <div className="grid grid-cols-2 gap-4">{media.data?.map(m => <figure key={m.id} className="min-w-0"><figcaption className="text-xs text-muted-foreground mb-2">{[...PHOTO_POSITIONS, ...VIDEO_POSITIONS].find(p => p.key === m.position_key)?.label ?? m.position_key}</figcaption>{m.kind === "photo" ? <img src={m.url} alt={`Avaliação ${m.position_key}`} className="w-full aspect-[3/4] object-contain bg-secondary" /> : <video controls playsInline preload="metadata" src={m.url} className="w-full aspect-video bg-secondary" />}</figure>)}</div>}
    <p className="text-xs text-muted-foreground">Observação visual, não diagnóstico. Força e torque não são medidos por estas imagens.</p>
  </article>;
}