import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { isInOfferWindow } from "@/lib/inviteOffer";

export const PENDING_INVITE_KEY = "gb_pending_invite";

/** Libera convite pendente (após confirmar e-mail) e mostra a oferta só na janela definida pelo admin. */
export function InviteOfferBanner() {
  const [offer, setOffer] = useState<{ expires_at: string; offer_starts_at: string; offer_plan_slug: string } | null>(null);

  useEffect(() => {
    (async () => {
      const pending = localStorage.getItem(PENDING_INVITE_KEY);
      if (pending) {
        localStorage.removeItem(PENDING_INVITE_KEY);
        const { data } = await supabase.rpc("claim_invite_link", { _slug: pending });
        if (data === "ok") window.location.reload();
      }
      const { data } = await supabase.rpc("get_my_invite_offer");
      const row = (data as typeof offer[] | null)?.[0];
      if (row && isInOfferWindow(row.offer_starts_at, row.expires_at, new Date())) setOffer(row);
    })();
  }, []);

  if (!offer) return null;
  const days = Math.max(0, Math.ceil((new Date(offer.expires_at).getTime() - Date.now()) / 86400000));
  return (
    <section className="surface mb-6 rounded-xl border border-border p-4 flex flex-wrap items-center justify-between gap-3" aria-label="Ativação de plano">
      <div className="space-y-1">
        <p className="eyebrow-label">Continue seu acompanhamento</p>
        <p className="text-sm text-muted-foreground">Seu acesso termina em {days} {days === 1 ? "dia" : "dias"}. Ative seu plano para manter treino e evolução.</p>
      </div>
      <Button asChild className="min-h-[44px]"><Link to={`/checkout?plano=${offer.offer_plan_slug}`}>Ativar plano</Link></Button>
    </section>
  );
}
