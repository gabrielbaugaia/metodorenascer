import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type S = { asaas_subscription_id: string; plan_name: string; value_cents: number; status: string; paid_until: string | null; next_due_date: string | null };
const LABEL: Record<string, string> = { active: "Ativa", pending: "Aguardando pagamento", past_due: "Pagamento em atraso", canceled: "Cancelada" };

export function AsaasSubscriptionCard() {
  const [sub, setSub] = useState<S | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.functions.invoke("asaas-manage", { body: { action: "my_status" } });
    setSub(data?.subscription ?? null);
    setInvoice(data?.open_invoice_url ?? null);
  };
  useEffect(() => { load(); }, []);
  if (!sub) return null;

  const cancel = async () => {
    if (!confirm("Deseja cancelar sua assinatura? Seu acesso segue até o fim do período pago.")) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("asaas-manage", { body: { action: "cancel", subscription_id: sub.asaas_subscription_id } });
    setBusy(false);
    if (error || data?.error) return toast.error("Não foi possível cancelar agora.");
    toast.success("Assinatura cancelada.");
    load();
  };

  const d = (v: string | null) => (v ? new Date(v + "T12:00:00").toLocaleDateString("pt-BR") : "—");
  return (
    <section className="surface rounded-xl border border-border p-5 space-y-3" aria-label="Gerenciar assinatura">
      <p className="eyebrow-label">Sua assinatura</p>
      <div className="flex flex-wrap justify-between gap-2">
        <p className="font-medium">{sub.plan_name} · {(sub.value_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês</p>
        <p className="text-sm text-muted-foreground">{LABEL[sub.status] ?? sub.status}</p>
      </div>
      <p className="text-sm text-muted-foreground">Acesso até {d(sub.paid_until)} · Próximo vencimento {d(sub.next_due_date)}</p>
      <div className="flex flex-wrap gap-2">
        {invoice && <Button asChild className="min-h-[44px]"><a href={invoice} target="_blank" rel="noopener noreferrer">Pagar fatura em aberto</a></Button>}
        {sub.status !== "canceled" && <Button variant="outline" className="min-h-[44px]" onClick={cancel} disabled={busy}>Cancelar assinatura</Button>}
      </div>
    </section>
  );
}
