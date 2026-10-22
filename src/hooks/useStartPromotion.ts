import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const START_PROMO_SLUG = "start-97-20";
export type PromoStatus = { active: boolean; price: number; limit: number; remaining: number };

/** Status público da condição promocional do Start (fonte: backend). */
export function useStartPromotion() {
  const [promo, setPromo] = useState<PromoStatus | null>(null);
  useEffect(() => {
    supabase.rpc("get_promotion_status", { _slug: START_PROMO_SLUG }).then(({ data }) => {
      const r = Array.isArray(data) ? data[0] : null;
      if (r?.active) setPromo({ active: true, price: r.promo_value_cents / 100, limit: r.slot_limit, remaining: r.remaining });
    });
  }, []);
  return promo;
}
