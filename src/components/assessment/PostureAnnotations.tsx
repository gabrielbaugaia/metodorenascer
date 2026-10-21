import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Crosshair, Trash2 } from "lucide-react";
import type { PostureAnnotation } from "../../../supabase/functions/_shared/movementAnnotations";
export type { PostureAnnotation } from "../../../supabase/functions/_shared/movementAnnotations";

export function PostureOverlay({ annotations }: { annotations: PostureAnnotation[] }) {
  return <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full text-primary" aria-label="Pontos e linhas posturais revisáveis">
    {annotations.map((a, i) => <g key={a.id}>
      <polyline points={a.points.map(p => `${p.x * 100},${p.y * 100}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="0.5" />
      {a.points.map((p, n) => <circle key={n} cx={p.x * 100} cy={p.y * 100} r="1" fill="currentColor" />)}
      {a.points[0] && <text x={Math.min(94, a.points[0].x * 100 + 2)} y={Math.max(4, a.points[0].y * 100 - 2)} fill="currentColor" fontSize="4">{i + 1}</text>}
    </g>)}
  </svg>;
}

export function PostureLegend({ annotations }: { annotations: PostureAnnotation[] }) {
  return <ol className="divide-y divide-border text-sm">{annotations.map((a, i) => <li key={a.id} className="space-y-1 py-3 break-words">
    <p className="font-semibold">{i + 1}. {a.label}</p><p>{a.observation}</p><p className="text-muted-foreground">{a.explanation}</p>
  </li>)}</ol>;
}

type Photo = { id: string; kind: string; url?: string };
export function PostureAnnotationEditor({ media, annotations, disabled, onChange }: { media: Photo[]; annotations: PostureAnnotation[]; disabled: boolean; onChange: (items: PostureAnnotation[]) => void }) {
  const [moving, setMoving] = useState<{ id: string; point: number } | null>(null);
  const update = (id: string, patch: Partial<PostureAnnotation>) => onChange(annotations.map(a => a.id === id ? { ...a, ...patch } : a));
  if (!annotations.length) return null;
  return <section className="space-y-5"><h3 className="section-title">Marcações posturais · revisão</h3>
    <p className="text-xs text-muted-foreground">Localização visual aproximada, não medida biomecânica. Confirme os pontos e as explicações antes de publicar.</p>
    {media.filter(m => m.kind === "photo" && m.url && annotations.some(a => a.media_id === m.id)).map(m => {
      const items = annotations.filter(a => a.media_id === m.id);
      return <div key={m.id} className="grid items-start gap-4 md:grid-cols-2"><div className="relative" onClick={e => {
        if (disabled || !moving) return;
        const a = items.find(a => a.id === moving.id); if (!a) return;
        const rect = e.currentTarget.getBoundingClientRect();
        update(a.id, { points: a.points.map((p, i) => i === moving.point ? { x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)) } : p) }); setMoving(null);
      }}><img src={m.url} alt="Foto para revisão postural" className="block w-full" /><PostureOverlay annotations={items} /></div>
      <div className="divide-y divide-border">{items.map((a, i) => <div key={a.id} className="space-y-2 py-3">
        <Input aria-label={`Nome da marcação ${i + 1}`} value={a.label} disabled={disabled} onChange={e => update(a.id, { label: e.target.value })} />
        <Textarea aria-label={`Observação da marcação ${i + 1}`} value={a.observation} disabled={disabled} onChange={e => update(a.id, { observation: e.target.value })} />
        <Textarea aria-label={`Explicação da marcação ${i + 1}`} value={a.explanation} disabled={disabled} onChange={e => update(a.id, { explanation: e.target.value })} />
        <div className="flex flex-wrap gap-2">{a.points.map((_, point) => <Button key={point} size="sm" variant={moving?.id === a.id && moving.point === point ? "default" : "outline"} disabled={disabled} onClick={() => setMoving({ id: a.id, point })}><Crosshair className="mr-1 h-4 w-4" />Ponto {point + 1}</Button>)}
          <Button size="icon" variant="ghost" aria-label={`Excluir marcação ${i + 1}`} disabled={disabled} onClick={() => { setMoving(null); onChange(annotations.filter(x => x.id !== a.id)); }}><Trash2 className="h-4 w-4" /></Button></div>
        {moving?.id === a.id && <p role="status" className="text-xs text-primary">Selecione a nova posição na foto.</p>}
      </div>)}</div></div>;
    })}
  </section>;
}