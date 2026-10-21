import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { angleFromPoints, movementPositionLabel, type AnglePoint, type MovementAngle } from "@/lib/movementAssessment";
import { Crosshair, RotateCcw, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Media = { id: string; kind: string; position_key: string; url?: string };
export function AngleOverlay({ angle }: { angle: MovementAngle }) {
  return <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full text-primary pointer-events-none" aria-label={`${angle.label}: ${angle.degrees.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} graus`}>
    <polyline points={angle.points.map(p => `${p.x * 100},${p.y * 100}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="0.6" />
    {angle.points.map((p, i) => <circle key={i} cx={p.x * 100} cy={p.y * 100} r="1" fill="currentColor" />)}
  </svg>;
}

export function MovementAngleEditor({ media, angles, onChange, disabled }: { media: Media[]; angles: MovementAngle[]; onChange: (angles: MovementAngle[]) => void; disabled: boolean }) {
  const [selected, setSelected] = useState("");
  const [label, setLabel] = useState("");
  const [points, setPoints] = useState<AnglePoint[]>([]);
  const [ratio, setRatio] = useState(1);
  const [marking, setMarking] = useState(false);
  const [second, setSecond] = useState<number | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const current = media.find(m => m.id === selected) ?? media.find(m => m.url);
  const degrees = angleFromPoints(points, ratio);
  const reset = () => { setPoints([]); setMarking(false); setSecond(null); };
  const add = () => {
    if (!current || degrees === null || !label.trim()) return toast.error("Nomeie a medida e marque três pontos distintos.");
    onChange([...angles, { id: crypto.randomUUID(), media_id: current.id, label: label.trim(), points, degrees, second, aspect_ratio: ratio, method: "manual_3_points" }]);
    reset(); setLabel("");
  };
  return <section className="space-y-4 border-t border-border pt-5">
    <h3 className="section-title">Ângulos dos testes</h3>
    <p className="text-xs text-muted-foreground">Ângulo projetado na imagem entre três pontos marcados pelo treinador. Não é medida tridimensional nem diagnóstico.</p>
    <div className="flex flex-wrap gap-2">{media.filter(m => m.url).map(m => <Button key={m.id} variant={current?.id === m.id ? "default" : "outline"} size="sm" disabled={disabled} onClick={() => { setSelected(m.id); reset(); }}>{movementPositionLabel(m.position_key)}</Button>)}</div>
    {current?.url && <>
      <div className="relative max-w-lg" onClick={e => {
        if (!marking || points.length >= 3) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setPoints([...points, { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }]);
      }}>
        {current.kind === "photo" ? <img src={current.url} alt={movementPositionLabel(current.position_key)} className="block w-full" onLoad={e => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} /> : <video ref={video} key={current.id} src={current.url} controls={!marking} playsInline preload="metadata" className="block w-full" onLoadedMetadata={e => setRatio(e.currentTarget.videoWidth / e.currentTarget.videoHeight)} onSeeking={() => { if (!marking) setPoints([]); }} />}
        {points.length > 0 && <AngleOverlay angle={{ id: "preview", media_id: current.id, label, points, degrees: degrees ?? 0, second, aspect_ratio: ratio, method: "manual_3_points" }} />}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={disabled} onClick={() => { video.current?.pause(); setSecond(current.kind === "video" ? video.current?.currentTime ?? 0 : null); setPoints([]); setMarking(true); }}><Crosshair className="mr-2 h-4 w-4" />Marcar três pontos</Button>
        <Button variant="ghost" size="icon" aria-label="Limpar marcação" disabled={disabled} onClick={reset}><RotateCcw className="h-4 w-4" /></Button>
        <span role="status" className="text-sm">{degrees !== null ? `${degrees.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}°` : marking ? `${points.length}/3 pontos · ponto 2 é o vértice` : ""}</span>
      </div>
      <div className="flex flex-wrap gap-2"><Input aria-label="Nome da medida angular" placeholder="Ex.: joelho direito" value={label} onChange={e => setLabel(e.target.value)} disabled={disabled} className="max-w-sm" /><Button onClick={add} disabled={disabled || degrees === null || !label.trim()}><Plus className="mr-2 h-4 w-4" />Registrar ângulo</Button></div>
    </>}
    {!current && <p className="text-sm text-muted-foreground">Nenhuma mídia disponível para marcação.</p>}
    <ul className="divide-y divide-border">{angles.map(a => <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{a.label} · {a.degrees.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}° · {movementPositionLabel(media.find(m => m.id === a.media_id)?.position_key ?? "")}{a.second !== null ? ` · ${a.second.toFixed(2)} s` : ""}</span><Button variant="ghost" size="icon" aria-label={`Excluir medida ${a.label}`} disabled={disabled} onClick={() => onChange(angles.filter(x => x.id !== a.id))}><Trash2 className="h-4 w-4" /></Button></li>)}</ul>
  </section>;
}