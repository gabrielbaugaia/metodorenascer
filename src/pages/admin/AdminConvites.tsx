import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Mail, ArrowLeft, Copy, Check, Link as LinkIcon, Trash2, CreditCard, Gift } from "lucide-react";
import { toast } from "sonner";

export default function AdminConvites() {
  const { session } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState("");
  const [inviteResult, setInviteResult] = useState<{
    inviteLink: string;
    email: string;
    password: string;
    requiresPayment: boolean;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    whatsapp: "",
    plan_type: "mensal",
    requires_payment: false, // New: toggle for requiring Stripe payment
  });

  const handleDeleteUser = async () => {
    if (!emailToDelete) {
      toast.error("Digite o email do usuário");
      return;
    }

    if (emailToDelete === "baugabriel@icloud.com") {
      toast.error("Não é possível deletar o admin");
      return;
    }

    setDeleteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { email: emailToDelete },
      });

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (error) {
        toast.error("Erro ao deletar usuário");
        return;
      }

      toast.success(data.message || "Usuário deletado!");
      setEmailToDelete("");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erro ao deletar usuário");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const copyLink = () => {
    if (inviteResult) {
      navigator.clipboard.writeText(inviteResult.inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Link copiado!");
    }
  };

  const copyCredentials = () => {
    if (inviteResult) {
      navigator.clipboard.writeText(`Email: ${inviteResult.email}\nSenha: ${inviteResult.password}`);
      setCopiedCreds(true);
      setTimeout(() => setCopiedCreds(false), 2000);
      toast.success("Credenciais copiadas!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.plan_type) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    setInviteResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: {
          full_name: formData.full_name,
          email: formData.email,
          whatsapp: formData.whatsapp || null,
          plan_type: formData.plan_type,
          requires_payment: formData.requires_payment,
        },
      });

      // Check if data contains an error (Edge Function returned error with body)
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Check for invoke error
      if (error) {
        // Try to parse error context if available
        const errorMessage = error.message || "Erro ao enviar convite";
        toast.error(errorMessage);
        return;
      }

      if (!data?.user) {
        toast.error("Erro ao processar convite. Tente novamente.");
        return;
      }

      setInviteResult({
        inviteLink: data.inviteLink,
        email: data.user.email,
        password: data.user.temporary_password,
        requiresPayment: formData.requires_payment,
      });
      
      toast.success(
        formData.requires_payment 
          ? "Convite enviado! Cliente precisará pagar para acessar." 
          : "Convite enviado com acesso liberado!"
      );
      
      // Reset form
      setFormData({
        full_name: "",
        email: "",
        whatsapp: "",
        plan_type: "mensal",
        requires_payment: false,
      });
      
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast.error("Erro ao enviar convite. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    navigate("/dashboard");
    return null;
  }

  const planOptions = [
    { value: "free", label: "Gratuito - R$0,00" },
    { value: "elite_founder", label: "Elite Fundador - R$49,90/mês" },
    { value: "mensal", label: "Mensal - R$197,00/mês" },
    { value: "trimestral", label: "Trimestral - R$497,00" },
    { value: "semestral", label: "Semestral - R$697,00" },
    { value: "anual", label: "Anual - R$997,00" },
  ];

  return (
    <ClientLayout>
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Enviar Convite</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Convide um cliente com link e email automático
          </p>
        </div>

        {inviteResult && (
          <Card className={inviteResult.requiresPayment ? "border-yellow-500/50 bg-yellow-500/10" : "border-green-500/50 bg-green-500/10"}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${inviteResult.requiresPayment ? "text-yellow-400" : "text-green-400"}`}>
                {inviteResult.requiresPayment ? (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Convite Enviado - Aguardando Pagamento
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Convite Enviado - Acesso Liberado!
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {inviteResult.requiresPayment 
                  ? "O cliente receberá o email e precisará completar o pagamento no Stripe para acessar o sistema."
                  : "O email foi enviado e o link está pronto para compartilhar:"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Link de Convite</Label>
                  <div className="flex gap-2 mt-1">
                    <Input 
                      value={inviteResult.inviteLink} 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button variant="outline" size="icon" onClick={copyLink}>
                      {copiedLink ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-background/50 p-4 rounded-lg space-y-2">
                  <p className="text-xs text-muted-foreground">Credenciais de acesso:</p>
                  <p className="font-mono text-sm"><span className="text-muted-foreground">Email:</span> {inviteResult.email}</p>
                  <p className="font-mono text-sm"><span className="text-muted-foreground">Senha:</span> {inviteResult.password}</p>
                </div>
                
                <Button variant="outline" onClick={copyCredentials} className="w-full">
                  {copiedCreds ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copiedCreds ? "Copiado!" : "Copiar Credenciais"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Dados do Convidado
            </CardTitle>
            <CardDescription>
              Preencha apenas o essencial - o cliente completa a anamnese depois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan_type">Plano *</Label>
                <Select
                  value={formData.plan_type}
                  onValueChange={(value) => setFormData({ ...formData, plan_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planOptions.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>
                        {plan.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Toggle for payment requirement */}
              {formData.plan_type !== "free" && (
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {formData.requires_payment ? (
                        <CreditCard className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Gift className="h-4 w-4 text-green-500" />
                      )}
                      <Label htmlFor="requires_payment" className="font-medium cursor-pointer">
                        {formData.requires_payment ? "Exigir pagamento Stripe" : "Liberar acesso direto"}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.requires_payment 
                        ? "Cliente só acessa após pagar no Stripe" 
                        : "Cliente acessa imediatamente (pagamento já recebido por fora)"}
                    </p>
                  </div>
                  <Switch
                    id="requires_payment"
                    checked={formData.requires_payment}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_payment: checked })}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/admin")}
                  className="order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="fire" 
                  disabled={loading}
                  className="order-1 sm:order-2 flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Enviar Convite
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Delete User Section */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Deletar Usuário
            </CardTitle>
            <CardDescription>
              Remove um usuário do sistema (útil para limpar cadastros de teste)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={emailToDelete}
                onChange={(e) => setEmailToDelete(e.target.value)}
                placeholder="email@exemplo.com"
                className="flex-1"
              />
              <Button 
                variant="destructive" 
                onClick={handleDeleteUser}
                disabled={deleteLoading || !emailToDelete}
              >
                {deleteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
