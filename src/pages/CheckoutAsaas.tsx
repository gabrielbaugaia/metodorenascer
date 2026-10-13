import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  { slug: "essencial", name: "Essencial", price: 97 },
  { slug: "pro", name: "PRO", price: 297 },
  { slug: "elite", name: "Elite", price: 697 },
] as const;
const MODES = [
  { id: "subscription", label: "Assinatura mensal", hint: "Pix, boleto ou cartão, renovação automática" },
  { id: "pix", label: "Pix avulso", hint: "30 dias de acesso" },
  { id: "card", label: "Cartão avulso", hint: "30 dias de acesso" },
] as const;

const digits = (v: string) => v.replace(/\D/g, "");

export default function CheckoutAsaas() {
  const [params] = useSearchParams();
  const initial = PLANS.find((p) => p.slug === params.get("plano"))?.slug ?? "consultoria";
  const [plan, setPlan] = useState<string>(initial);
  const [mode, setMode] = useState<string>("subscription");
  const [form, setForm] = useState({ name: "", email: "", cpf: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const key = useMemo(() => crypto.randomUUID(), [plan, mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cpf = digits(form.cpf), phone = digits(form.phone);
    if (form.name.trim().length < 3) return toast.error("Informe seu nome completo.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("E-mail inválido.");
    if (cpf.length !== 11 && cpf.length !== 14) return toast.error("CPF ou CNPJ inválido.");
    if (phone && (phone.length < 10 || phone.length > 11)) return toast.error("Telefone inválido.");
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("asaas-checkout", {
      body: { plan_slug: plan, mode, name: form.name.trim(), email: form.email.trim(), cpf_cnpj: cpf, phone: phone || undefined, idempotency_key: key },
    });
    setLoading(false);
    if (error || !data?.url) return toast.error(data?.error || "Não foi possível gerar a cobrança. Tente novamente.");
    window.location.href = data.url;
  };

  return (
    <main className="min-h-[100dvh] bg-background text-foreground px-4 py-10">
      <div className="max-w-xl mx-auto space-y-8">
        <header className="space-y-2 text-center">
          <p className="eyebrow-label">Consultoria Gabriel Baú</p>
          <h1 className="display-title text-3xl">Finalizar inscrição</h1>
        </header>

        <form onSubmit={submit} className="surface rounded-xl border border-border p-5 sm:p-6 space-y-6">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-2">Plano</legend>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map((p) => (
                <button type="button" key={p.slug} onClick={() => setPlan(p.slug)} aria-pressed={plan === p.slug}
                  className={`min-h-[44px] rounded-lg border p-3 text-left transition-colors duration-200 ${plan === p.slug ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                  <span className="block text-sm font-medium">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">R$ {p.price}/mês</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-2">Forma de pagamento</legend>
            {MODES.map((m) => (
              <button type="button" key={m.id} onClick={() => setMode(m.id)} aria-pressed={mode === m.id}
                className={`w-full min-h-[44px] rounded-lg border p-3 text-left transition-colors duration-200 ${mode === m.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                <span className="block text-sm font-medium">{m.label}</span>
                <span className="block text-xs text-muted-foreground">{m.hint}</span>
              </button>
            ))}
          </fieldset>

          <div className="grid gap-4">
            <div className="space-y-1.5"><Label htmlFor="n">Nome completo</Label>
              <Input id="n" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="e">E-mail</Label>
              <Input id="e" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label htmlFor="c">CPF ou CNPJ</Label>
                <Input id="c" inputMode="numeric" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="p">Celular (opcional)</Label>
                <Input id="p" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
          </div>

          <Button type="submit" className="w-full min-h-[48px]" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ir para o pagamento"}
          </Button>
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden /> Pagamento processado com segurança pelo Asaas.
          </p>
        </form>
      </div>
    </main>
  );
}
