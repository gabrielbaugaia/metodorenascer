import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PENDING_INVITE_KEY } from "@/components/invite/InviteOfferBanner";

type Status = { label: string; access_days: number; remaining: number; available: boolean };

const MESSAGES: Record<string, string> = {
  sold_out: "As vagas deste convite acabaram.",
  invalid: "Este convite não está mais disponível.",
  already_claimed: "Sua conta já usou um convite.",
  already_active: "Sua conta já tem um plano ativo.",
};

export default function ConviteLink() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status | null | undefined>(undefined);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.rpc("get_invite_link_status", { _slug: slug }).then(({ data }) => setStatus((data as Status[] | null)?.[0] ?? null));
  }, [slug]);

  const claim = async () => {
    const { data, error } = await supabase.rpc("claim_invite_link", { _slug: slug });
    if (error) return toast.error("Não foi possível liberar o acesso.");
    if (data === "ok") { toast.success("Acesso liberado."); navigate("/dashboard"); }
    else { toast.error(MESSAGES[data as string] ?? "Não foi possível liberar o acesso."); navigate("/dashboard"); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(), password: form.password,
          options: { data: { full_name: form.name.trim() }, emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        if (!data.session) {
          localStorage.setItem(PENDING_INVITE_KEY, slug);
          toast.success("Confirme seu e-mail para entrar. O acesso é liberado no primeiro login.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
        if (error) throw error;
      }
      await claim();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-4 py-10">
      <div className="surface w-full max-w-md rounded-xl border border-border p-6 space-y-5">
        <div className="space-y-2">
          <p className="eyebrow-label">Gabriel Baú Consultoria</p>
          {status === undefined && <p className="text-sm text-muted-foreground">Carregando convite…</p>}
          {status === null && <h1 className="display-title text-2xl">Convite não encontrado.</h1>}
          {status && <>
            <h1 className="display-title text-2xl">Acesso de {status.access_days} dias · {status.label}</h1>
            <p className="text-sm text-muted-foreground">{status.available ? `${status.remaining} vagas restantes.` : "Vagas esgotadas."}</p>
          </>}
        </div>
        {status?.available && (
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && <div className="space-y-1"><Label htmlFor="n">Nome</Label><Input id="n" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>}
            <div className="space-y-1"><Label htmlFor="e">E-mail</Label><Input id="e" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="p">Senha</Label><Input id="p" type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <Button type="submit" className="w-full min-h-[44px]" disabled={busy}>{mode === "signup" ? "Criar conta e liberar acesso" : "Entrar e liberar acesso"}</Button>
            <button type="button" className="text-sm text-muted-foreground underline w-full" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
              {mode === "signup" ? "Já tenho conta" : "Criar conta nova"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
