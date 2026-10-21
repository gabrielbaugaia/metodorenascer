import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import { useMovementMedia, type MovementAssessment, type MovementReport as Report } from "@/hooks/useMovementAssessments";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { movementPositionLabel } from "@/lib/movementAssessment";
import { useState } from "react";
import { AngleOverlay } from "./MovementAngleEditor";
import { drawHeader, drawContinuationHeader, drawFooters, PDF_COLORS, setText } from "@/lib/pdfTheme";
import { loadImageOriented } from "@/lib/assessmentPdf";
import { PostureOverlay, PostureLegend } from "./PostureAnnotations";

export function MovementAnalysisText({ report }: { report: Report }) {
  return <section className="space-y-4 text-sm">
    <h3 className="section-title">Sua avaliação em resumo · Equipe GB</h3>
    <p className="whitespace-pre-wrap break-words">{report.summary}</p>
    <ul className="divide-y divide-border">{report.observations.map((o, i) => <li key={i} className="py-3 break-words"><p>{o.observation}</p><p className="text-xs text-muted-foreground">{o.second !== null ? `Quadro em ${o.second.toLocaleString("pt-BR")} s · ` : ""}Confiança {o.confidence}</p></li>)}</ul>
    <div><h4 className="font-semibold">Como isso muda seu treino</h4><p className="whitespace-pre-wrap break-words">{report.recommendations || "Orientações aguardando registro do treinador."}</p></div>
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
      const doc = new jsPDF(); let y = drawHeader(doc, { title: "Avaliação de movimento", subtitle: "ENGENHARIA DO MOVIMENTO" });
      const newPage = (title: string) => { doc.addPage(); y = drawContinuationHeader(doc, title); setText(doc, PDF_COLORS.text); };
      const line = (text: string, size = 10) => {
        setText(doc, PDF_COLORS.text);
        doc.setFontSize(size);
        for (const row of doc.splitTextToSize(text, 172)) { if (y > 268) newPage("Avaliação de movimento"); doc.text(row, 19, y); y += size * 0.5; }
        y += 4;
      };
      doc.setFont("times", "normal");
      line("Equipe GB", 14);
      line(`${studentName} · ${date} · Versão ${a.version}`);
      if (a.report) { line("Sua avaliação em resumo", 14); line(a.report.summary); line("Como isso muda seu treino", 14); line(a.report.recommendations); }
      line("Achados e prioridades", 14);
      a.findings.forEach(f => line(`${f.region}: ${f.label} (${f.severity})`));
      if (a.restrictions) line(`Restrições aprovadas para o treino: ${a.restrictions}`);
      if (a.notes) line(`Observações: ${a.notes}`);
      for (const m of media.data ?? []) {
        if (m.kind !== "photo" || !m.url) continue;
        const image = await loadImageOriented(m.url);
        if (!image) throw new Error("Não foi possível incluir uma foto no PDF");
        newPage("Registros por vista");
        line(movementPositionLabel(m.position_key), 14);
        a.report?.observations.filter(o => o.media_id === m.id).forEach(o => line(o.observation));
        const annotations = a.report?.annotations?.filter(x => x.media_id === m.id) ?? [];
        annotations.forEach((annotation, i) => { line(`${i + 1}. ${annotation.label}: ${annotation.observation}`, 9); line(annotation.explanation, 9); });
        if (y > 170) newPage(movementPositionLabel(m.position_key));
        const ratio = Math.min(170 / image.w, (264 - y) / image.h);
        const width = image.w * ratio, height = image.h * ratio;
        const imageY = y;
        doc.addImage(image.data, "JPEG", 20, imageY, width, height);
        doc.setDrawColor(...PDF_COLORS.bronze); doc.setLineWidth(0.6);
        annotations.forEach((annotation, i) => {
          annotation.points.forEach((p, n) => {
            doc.circle(20 + p.x * width, imageY + p.y * height, 0.8);
            const next = annotation.points[n + 1];
            if (next) doc.line(20 + p.x * width, imageY + p.y * height, 20 + next.x * width, imageY + next.y * height);
          });
          const first = annotation.points[0];
          if (first) { doc.setFontSize(9); setText(doc, PDF_COLORS.bronze); doc.text(String(i + 1), 20 + Math.min(0.94, first.x + 0.02) * width, imageY + Math.max(0.03, first.y - 0.02) * height); }
        });
        for (const angle of a.report?.angles?.filter(x => x.media_id === m.id) ?? []) {
          angle.points.forEach((p, i) => {
            doc.circle(20 + p.x * width, imageY + p.y * height, 0.8);
            const next = angle.points[i + 1];
            if (next) doc.line(20 + p.x * width, imageY + p.y * height, 20 + next.x * width, imageY + next.y * height);
          });
        }
      }
      newPage("Dados técnicos");
      line("Ângulos dos testes", 14);
      line("Marcação de três pontos pelo treinador. Ângulo projetado em imagem; não é medição tridimensional.", 9);
      for (const angle of a.report?.angles ?? []) {
        const m = media.data?.find(m => m.id === angle.media_id);
        line(`${movementPositionLabel(m?.position_key ?? "")} · ${angle.label} · ${angle.degrees.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}°${angle.second !== null ? ` · quadro ${angle.second.toLocaleString("pt-BR")} s` : ""}`);
      }
      if (!a.report?.angles?.length) line("Nenhuma medida angular registrada.");
      line("Registros de movimento", 14);
      a.report?.observations.filter(o => media.data?.some(m => m.id === o.media_id && m.kind === "video")).forEach(o => line(`${movementPositionLabel(media.data?.find(m => m.id === o.media_id)?.position_key ?? "")} · ${o.second ?? "—"} s: ${o.observation}`));
      line("Nota metodológica", 14);
      line(a.report?.limitations ?? "Observação visual e achados registrados pelo treinador.");
      line("Avaliação visual não é diagnóstico nem medição de força ou torque. Vídeos são observados por amostras de quadros; o original está disponível no app. Orientações de treino são definidas pelo treinador.");
      drawFooters(doc);
      doc.save(`laudo-movimento-${a.assessed_at}-v${a.version}.pdf`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível exportar o laudo"); } finally { setExporting(false); }
  };
  return <article className="space-y-6 border-t border-border pt-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow-label">Engenharia do Movimento</p><h2 className="section-title">Avaliação de movimento · {date}</h2><p className="text-sm text-muted-foreground">{studentName} · Versão {a.version}</p></div><Button variant="outline" disabled={exporting || media.isLoading || !!media.error} onClick={exportPdf}><Download className="mr-2 h-4 w-4" />{exporting ? "Exportando" : "Baixar laudo PDF"}</Button></div>
    {a.report && <MovementAnalysisText report={a.report} />}
    <section><h3 className="font-semibold mb-3">Achados e orientações aprovados</h3>{a.findings.length ? <ul className="space-y-2 text-sm">{a.findings.map(f => <li key={f.key}>{f.region} · {f.label} · {f.severity}</li>)}</ul> : <p className="text-sm text-muted-foreground">Sem achados registrados.</p>}</section>
    {a.restrictions && <p className="text-sm whitespace-pre-wrap break-words"><strong>Restrições para o treino: </strong>{a.restrictions}</p>}
    {a.notes && <p className="text-sm whitespace-pre-wrap break-words">{a.notes}</p>}
    <h3 className="section-title">Registros por vista e teste</h3>
    {media.isLoading ? <Loader2 className="animate-spin h-5 w-5" aria-label="Carregando mídias" /> : media.error ? <div role="alert"><p>Não foi possível abrir as mídias.</p><Button variant="outline" onClick={() => media.refetch()}>Tentar novamente</Button></div> : <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">{media.data?.map(m => <figure key={m.id} className="min-w-0 space-y-3"><figcaption className="font-semibold">{movementPositionLabel(m.position_key)}</figcaption>{m.kind === "photo" ? <div className="relative"><img src={m.url} alt={`Avaliação ${movementPositionLabel(m.position_key)}`} className="block w-full bg-secondary" /><PostureOverlay annotations={a.report?.annotations?.filter(x => x.media_id === m.id) ?? []} />{a.report?.angles?.filter(x => x.media_id === m.id).map(angle => <AngleOverlay key={angle.id} angle={angle} />)}</div> : <video controls playsInline preload="metadata" src={m.url} className="w-full aspect-video bg-secondary" />}<PostureLegend annotations={a.report?.annotations?.filter(x => x.media_id === m.id) ?? []} />{a.report?.observations.filter(o => o.media_id === m.id).map((o, i) => <p key={i} className="text-sm break-words">{o.second !== null ? `${o.second.toLocaleString("pt-BR")} s · ` : ""}{o.observation}</p>)}</figure>)}</div>}
    <section className="space-y-3"><h3 className="section-title">Dados técnicos · ângulos dos testes</h3><p className="text-xs text-muted-foreground">Marcação do treinador em imagem. Referências e classificação não são inferidas automaticamente.</p>{a.report?.angles?.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left"><th className="p-2">Registro</th><th className="p-2">Medida</th><th className="p-2">Valor</th><th className="p-2">Quadro</th></tr></thead><tbody>{a.report.angles.map(angle => <tr key={angle.id} className="border-b border-border"><td className="p-2">{movementPositionLabel(media.data?.find(m => m.id === angle.media_id)?.position_key ?? "")}</td><td className="p-2">{angle.label}</td><td className="p-2 whitespace-nowrap">{angle.degrees.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}°</td><td className="p-2 whitespace-nowrap">{angle.second === null ? "Foto" : `${angle.second.toLocaleString("pt-BR")} s`}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">Nenhuma medida angular registrada.</p>}</section>
    <p className="text-xs text-muted-foreground">Observação visual, não diagnóstico. Força e torque não são medidos por estas imagens.</p>
  </article>;
}