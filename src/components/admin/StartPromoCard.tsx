import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { START_PROMO_SLUG } from "@/hooks/useStartPromotion";

export function StartPromoCard() {
  const [p, setP] = useState<{ active: boolean; promo_value_cents: number; slot_limit: number } | null>(null);
  const [paid, setPaid] = useState(0);
  const [reserved, setReserved] = useState(0);

  const load = async () => {
    const [{ data }, { data: claims }] = await Promise.all([
      supabase.from("plan_promotions").select("active,promo_value_cents,slot_limit").eq("slug", START_PROMO_SLUG).maybeSingle(),
      supabase.from("plan_promotion_claims").select("status,created_at").eq("promotion_slug", START_PROMO_SLUG),
    ]);
    setP(data);
    const cutoff = Date.now() - 30 * 60000;
    setPaid((claims ?? []).filter((c) => c.status === "paid").length);
    setReserved((claims ?? []).filter((c) => c.status === "reserved" && new Date(c.created_at).getTime() > cutoff).length);
  };
  useEffect(() => { load(); }, []);
  if (!p) return null;

  const toggle = async () => {
    const { error } = await supabase.from("plan_promotions").update({ active: !p.active }).eq("slug", START_PROMO_SLUG);
    if (error) return toast.error("Não foi possível alterar.");
    toast.success(p.active ? "Condição desligada." : "Condição ligada.");
    load();
  };

  return (
    <section className="surface rounded-xl border border-border p-5 flex flex-wrap items-center justify-between gap-3" aria-label="Condição Start">
      <div className="space-y-1">
        <p className="eyebrow-label">Start R$ {p.promo_value_cents / 100} · {p.active ? "ligada" : "desligada"}</p>
        <p className="text-sm text-muted-foreground">{paid} de {p.slot_limit} vagas pagas · {reserved} em pagamento agora</p>
      </div>
      <Button variant="outline" className="min-h-[44px]" onClick={toggle}>{p.active ? "Desligar" : "Ligar"}</Button>
    </section>
  );
}
