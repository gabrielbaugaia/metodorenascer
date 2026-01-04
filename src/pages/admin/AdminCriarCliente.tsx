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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const clientSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  telefone: z.string().optional(),
  age: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  goals: z.string().optional(),
  nivel_experiencia: z.string().optional(),
  plan_type: z.string().optional(),
});

export default function AdminCriarCliente() {
  const { session } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    telefone: "",
    age: "",
    weight: "",
    height: "",
    goals: "",
    nivel_experiencia: "",
    plan_type: "free",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const copyCredentials = () => {
    if (createdUser) {
      navigator.clipboard.writeText(`Email: ${createdUser.email}\nSenha: ${createdUser.password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Credenciais copiadas!");
    }
  };

  // Generate a secure temporary password
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const special = "!@#$%";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    password += special.charAt(Math.floor(Math.random() * special.length));
    password += Math.floor(Math.random() * 10);
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = clientSchema.safeParse({
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      // Generate password locally - it will be sent to API but NOT returned
      const tempPassword = generatePassword();

      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: formData.email,
          password: tempPassword,
          full_name: formData.full_name,
          telefone: formData.telefone || null,
          age: formData.age ? parseInt(formData.age) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          goals: formData.goals || null,
          nivel_experiencia: formData.nivel_experiencia || null,
          plan_type: formData.plan_type,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Store password locally since API doesn't return it anymore
      setCreatedUser({
        email: data.user.email,
        password: tempPassword,
      });
      
      toast.success("Cliente criado com sucesso!");
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(error.message || "Erro ao criar cliente");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    navigate("/area-cliente");
    return null;
  }

  return (
    <ClientLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/admin/clientes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Clientes
        </Button>

        <div>
          <h1 className="text-3xl font-display font-bold">Criar Novo Cliente</h1>
          <p className="text-muted-foreground">Cadastre um novo cliente no Método Renascer</p>
        </div>

        {createdUser && (
          <Card className="border-green-500/50 bg-green-500/10">
            <CardHeader>
              <CardTitle className="text-green-400">Cliente Criado com Sucesso!</CardTitle>
              <CardDescription>Anote ou copie as credenciais abaixo para enviar ao cliente:</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-background/50 p-4 rounded-lg space-y-2 font-mono text-sm">
                <p><span className="text-muted-foreground">Email:</span> {createdUser.email}</p>
                <p><span className="text-muted-foreground">Senha:</span> {createdUser.password}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyCredentials}>
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copiado!" : "Copiar Credenciais"}
                </Button>
                <Button variant="fire" onClick={() => navigate("/admin/clientes")}>
                  Ver Clientes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Dados do Cliente
            </CardTitle>
            <CardDescription>
              Preencha as informações do novo cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
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
                  <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="25"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="75.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    value={formData.height}
                    onChange={handleChange}
                    placeholder="175"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nivel_experiencia">Nível de Experiência</Label>
                  <Select
                    value={formData.nivel_experiencia}
                    onValueChange={(value) => setFormData({ ...formData, nivel_experiencia: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan_type">Tipo de Plano</Label>
                  <Select
                    value={formData.plan_type}
                    onValueChange={(value) => setFormData({ ...formData, plan_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Plano Free (Cortesia)</SelectItem>
                      <SelectItem value="elite_founder">Elite Fundador</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Objetivos</Label>
                <Textarea
                  id="goals"
                  name="goals"
                  value={formData.goals}
                  onChange={handleChange}
                  placeholder="Descreva os objetivos do cliente..."
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate("/admin/clientes")}>
                  Cancelar
                </Button>
                <Button type="submit" variant="fire" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Criar Cliente
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
