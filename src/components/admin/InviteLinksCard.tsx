import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy } from "lucide-react";

type LinkRow = { id: string; slug: string; label: string; slot_limit: number; access_days: number; offer_days_before: number; offer_plan_slug: string; active: boolean };
type Claim = { link_id: string; user_id: string; expires_at: string; profiles?: { full_name: string | null; email: string | null } | null };

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function InviteLinksCard() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [f, setF] = useState({ label: "Auge Clube", slot_limit: 20, access_days: 30, offer_days_before: 5, offer_plan_slug: "start" });

  const load = async () => {
    const [{ data: l }, { data: c }] = await Promise.all([
      supabase.from("invite_links").select("*").order("created_at", { ascending: false }),
      supabase.from("invite_link_claims").select("link_id,user_id,expires_at").order("created_at"),
    ]);
    setLinks((l as LinkRow[]) ?? []);
    setClaims((c as Claim[]) ?? []);
    const ids = (c ?? []).map((x) => x.user_id);
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
      setNames(Object.fromEntries((p ?? []).map((x) => [x.id, x.full_name || x.email || "Aluno"])));
    }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const slug = `${slugify(f.label)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("invite_links").insert({ ...f, slug });
    if (error) return toast.error("Não foi possível criar o link.");
    toast.success("Link criado.");
    load();
  };
  const toggle = async (l: LinkRow) => {
    await supabase.from("invite_links").update({ active: !l.active }).eq("id", l.id);
    load();
  };
  const url = (slug: string) => `${window.location.origin}/convite/${slug}`;

  return (
    <section className="surface rounded-xl border border-border p-5 space-y-5" aria-label="Links de convite">
      <div>
        <h2 className="text-lg font-semibold">Links de convite</h2>
        <p className="text-sm text-muted-foreground">Um link geral com vagas limitadas. Cada pessoa cria a própria conta.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2"><Label htmlFor="il-label">Nome do grupo</Label><Input id="il-label" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="il-slots">Vagas</Label><Input id="il-slots" type="number" min={1} value={f.slot_limit} onChange={(e) => setF({ ...f, slot_limit: +e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="il-days">Dias de acesso</Label><Input id="il-days" type="number" min={1} value={f.access_days} onChange={(e) => setF({ ...f, access_days: +e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="il-offer">Mostrar oferta quantos dias antes do fim</Label><Input id="il-offer" type="number" min={0} value={f.offer_days_before} onChange={(e) => setF({ ...f, offer_days_before: +e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="il-plan">Plano oferecido</Label>
          <select id="il-plan" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={f.offer_plan_slug} onChange={(e) => setF({ ...f, offer_plan_slug: e.target.value })}>
            <option value="start">Start</option><option value="evolution">Evolution</option><option value="premium">Premium</option>
          </select>
        </div>
      </div>
      <Button className="min-h-[44px]" onClick={create} disabled={!f.label.trim()}>Criar link</Button>

      {links.map((l) => {
        const lc = claims.filter((c) => c.link_id === l.id);
        return (
          <div key={l.id} className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{l.label} · {l.active ? "ativo" : "pausado"}</p>
                <p className="text-sm text-muted-foreground">{lc.length} de {l.slot_limit} vagas · {l.access_days} dias · oferta {l.offer_days_before} dias antes</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(url(l.slug)); toast.success("Link copiado."); }}><Copy className="h-4 w-4 mr-1" />Copiar</Button>
                <Button variant="outline" size="sm" onClick={() => toggle(l)}>{l.active ? "Pausar" : "Ativar"}</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground break-all">{url(l.slug)}</p>
            {lc.length > 0 && (
              <ul className="text-sm space-y-1">
                {lc.map((c) => <li key={c.user_id} className="flex justify-between gap-2"><span className="truncate">{names[c.user_id] ?? "Aluno"}</span><span className="text-muted-foreground shrink-0">até {new Date(c.expires_at).toLocaleDateString("pt-BR")}</span></li>)}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
