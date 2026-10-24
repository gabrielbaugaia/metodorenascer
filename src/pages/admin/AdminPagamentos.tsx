import { useEffect, useState } from "react";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { StartPromoCard } from "@/components/admin/StartPromoCard";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Order = { id: string; email: string; plan_slug: string; value_cents: number; billing_type: string; status: string; due_date: string | null; paid_at: string | null; created_at: string };
type Sub = { id: string; email: string; plan_name: string; value_cents: number; status: string; next_due_date: string | null; paid_until: string | null; canceled_at: string | null; asaas_subscription_id: string | null };

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dt = (d: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

export default function AdminPagamentos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [env, setEnv] = useState<{ configured: boolean; webhook_token: boolean; env: string } | null>(null);
  const [provider, setProvider] = useState("stripe");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [o, s, e, p] = await Promise.all([
      supabase.from("asaas_payment_orders").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("asaas_subscriptions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.functions.invoke("asaas-manage", { body: { action: "env" } }),
      supabase.from("payment_settings").select("checkout_provider").eq("id", 1).maybeSingle(),
    ]);
    setOrders((o.data as Order[]) ?? []);
    setSubs((s.data as Sub[]) ?? []);
    setEnv(e.data ?? null);
    setProvider(p.data?.checkout_provider ?? "stripe");
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const act = async (action: "reconcile" | "cancel", id: string) => {
    if (action === "cancel" && !confirm("Cancelar esta assinatura no Asaas?")) return;
    setBusy(id + action);
    const { data, error } = await supabase.functions.invoke("asaas-manage", { body: { action, subscription_id: id } });
    setBusy(null);
    if (error || data?.error) return toast.error(data?.error || "Falha na operação");
    toast.success(action === "cancel" ? "Assinatura cancelada" : `Reconciliado: ${data.status}`);
    load();
  };

  const paid = orders.filter((o) => ["received", "confirmed"].includes(o.status));
  const overdue = orders.filter((o) => o.status === "overdue");
  const active = subs.filter((s) => s.status === "active");
  const canceled = subs.filter((s) => s.status === "canceled");
  const kpis = [
    { label: "Recebido", value: brl(paid.reduce((a, o) => a + o.value_cents, 0)) },
    { label: "Assinantes ativos", value: active.length },
    { label: "Inadimplentes", value: overdue.length + subs.filter((s) => s.status === "past_due").length },
    { label: "Cancelamentos", value: canceled.length },
  ];

  return (
    <ClientLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="eyebrow-label">Financeiro</p>
            <h1 className="display-title text-2xl sm:text-3xl">Pagamentos Asaas</h1>
          </div>
          <Button variant="outline" onClick={load} disabled={loading} className="min-h-[44px]">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden /> Atualizar
          </Button>
        </header>

        <StartPromoCard />


        {env && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">Ambiente: {env.env === "production" ? "produção" : "teste"}</Badge>
            <Badge variant="outline">Chave: {env.configured ? "configurada" : "ausente"}</Badge>
            <Badge variant="outline">Webhook: {env.webhook_token ? "token salvo" : "token ausente"}</Badge>
            <Badge variant="outline">Checkout oficial: {provider === "asaas" ? "Asaas" : "Stripe (Asaas só para admin)"}</Badge>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.map((k) => (
                <div key={k.label} className="surface rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-xl font-semibold mt-1">{k.value}</p>
                </div>
              ))}
            </div>

            <Tabs defaultValue="assinaturas">
              <TabsList>
                <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
                <TabsTrigger value="transacoes">Transações</TabsTrigger>
              </TabsList>
              <TabsContent value="assinaturas" className="mt-4">
                {subs.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma assinatura Asaas ainda.</p> : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-muted-foreground"><tr className="border-b border-border">
                        {["E-mail", "Plano", "Valor", "Status", "Próx. venc.", "Pago até", ""].map((h) => <th key={h} className="p-3 text-left font-medium">{h}</th>)}
                      </tr></thead>
                      <tbody>{subs.map((s) => (
                        <tr key={s.id} className="border-b border-border last:border-0">
                          <td className="p-3 break-all">{s.email}</td><td className="p-3">{s.plan_name}</td><td className="p-3">{brl(s.value_cents)}</td>
                          <td className="p-3"><Badge variant="outline">{s.status}</Badge></td><td className="p-3">{dt(s.next_due_date)}</td><td className="p-3">{dt(s.paid_until)}</td>
                          <td className="p-3 whitespace-nowrap">{s.asaas_subscription_id && (<>
                            <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => act("reconcile", s.asaas_subscription_id!)}>Reconciliar</Button>
                            {s.status !== "canceled" && <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => act("cancel", s.asaas_subscription_id!)}>Cancelar</Button>}
                          </>)}</td>
                        </tr>))}</tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="transacoes" className="mt-4">
                {orders.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma transação Asaas ainda.</p> : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-muted-foreground"><tr className="border-b border-border">
                        {["Data", "E-mail", "Plano", "Forma", "Valor", "Status", "Pago em"].map((h) => <th key={h} className="p-3 text-left font-medium">{h}</th>)}
                      </tr></thead>
                      <tbody>{orders.map((o) => (
                        <tr key={o.id} className="border-b border-border last:border-0">
                          <td className="p-3">{dt(o.created_at)}</td><td className="p-3 break-all">{o.email}</td><td className="p-3">{o.plan_slug}</td>
                          <td className="p-3">{o.billing_type}</td><td className="p-3">{brl(o.value_cents)}</td>
                          <td className="p-3"><Badge variant="outline">{o.status}</Badge></td><td className="p-3">{dt(o.paid_at)}</td>
                        </tr>))}</tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </ClientLayout>
  );
}
