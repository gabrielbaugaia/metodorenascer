import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Loader2, 
  Crown, 
  CheckCircle2, 
  Edit, 
  ExternalLink,
  DollarSign,
  Users,
  TrendingUp,
  Star,
  Sparkles
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  period: string;
  periodMonths: number;
  features: string[];
  popular: boolean;
  active: boolean;
  maxMembers?: number;
  description: string;
}

const initialPlans: Plan[] = [
  {
    id: "embaixador",
    name: "ELITE Fundador",
    price: 49.90,
    priceId: "price_1ScZqTCuFZvf5xFdZuOBMzpt",
    period: "/mês",
    periodMonths: 1,
    features: [
      "Treino personalizado",
      "Nutrição personalizada", 
      "Mindset",
      "Suporte 24h",
      "Acesso vitalício ao preço"
    ],
    popular: false,
    active: true,
    maxMembers: 25,
    description: "Plano exclusivo para os 25 primeiros clientes fundadores"
  },
  {
    id: "mensal",
    name: "Mensal",
    price: 197.00,
    priceId: "price_1ScZrECuFZvf5xFdfS9W8kvY",
    period: "/mês",
    periodMonths: 1,
    features: [
      "Treino personalizado",
      "Nutrição personalizada",
      "Mindset",
      "Suporte 24h"
    ],
    popular: false,
    active: true,
    description: "Plano mensal com renovação automática"
  },
  {
    id: "trimestral",
    name: "Trimestral",
    price: 497.00,
    priceId: "price_1ScZsTCuFZvf5xFdbW8kJeQF",
    period: "/3 meses",
    periodMonths: 3,
    features: [
      "Treino personalizado",
      "Nutrição personalizada",
      "Mindset",
      "Suporte 24h",
      "Economia de 16%"
    ],
    popular: true,
    active: true,
    description: "Plano trimestral com desconto de 16%"
  },
  {
    id: "semestral",
    name: "Semestral",
    price: 697.00,
    priceId: "price_1ScZtrCuFZvf5xFd8iXDfbEp",
    period: "/6 meses",
    periodMonths: 6,
    features: [
      "Treino personalizado",
      "Nutrição personalizada",
      "Mindset",
      "Suporte 24h",
      "Economia de 41%"
    ],
    popular: false,
    active: true,
    description: "Plano semestral com desconto de 41%"
  },
  {
    id: "anual",
    name: "Anual",
    price: 997.00,
    priceId: "price_1ScZvCCuFZvf5xFdjrs51JQB",
    period: "/ano",
    periodMonths: 12,
    features: [
      "Treino personalizado",
      "Nutrição personalizada",
      "Mindset",
      "Suporte 24h",
      "Economia de 58%"
    ],
    popular: false,
    active: true,
    description: "Plano anual com maior economia"
  },
];

export default function AdminPlanosVenda() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (authLoading || adminLoading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  if (!isAdmin) {
    navigate("/area-cliente");
    return null;
  }

  const handleToggleActive = (planId: string) => {
    setPlans(prev => prev.map(p => 
      p.id === planId ? { ...p, active: !p.active } : p
    ));
    toast.success("Status do plano atualizado");
  };

  const handleTogglePopular = (planId: string) => {
    setPlans(prev => prev.map(p => ({
      ...p,
      popular: p.id === planId ? !p.popular : false
    })));
    toast.success("Plano destacado atualizado");
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan({ ...plan });
    setIsDialogOpen(true);
  };

  const handleSavePlan = () => {
    if (!editingPlan) return;

    setPlans(prev => prev.map(p => 
      p.id === editingPlan.id ? editingPlan : p
    ));
    setIsDialogOpen(false);
    setEditingPlan(null);
    toast.success("Plano atualizado com sucesso");
  };

  const handleFeatureChange = (index: number, value: string) => {
    if (!editingPlan) return;
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    setEditingPlan({ ...editingPlan, features: newFeatures });
  };

  const handleAddFeature = () => {
    if (!editingPlan) return;
    setEditingPlan({ 
      ...editingPlan, 
      features: [...editingPlan.features, ""] 
    });
  };

  const handleRemoveFeature = (index: number) => {
    if (!editingPlan) return;
    setEditingPlan({ 
      ...editingPlan, 
      features: editingPlan.features.filter((_, i) => i !== index) 
    });
  };

  const calculateMonthlyPrice = (plan: Plan) => {
    return (plan.price / plan.periodMonths).toFixed(2);
  };

  const totalActiveRevenuePotential = plans
    .filter(p => p.active)
    .reduce((sum, p) => sum + p.price, 0);

  return (
    <ClientLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Gerenciar Planos de Venda</h1>
            <p className="text-muted-foreground">Configure preços, features e status dos planos</p>
          </div>
          <Button variant="outline" onClick={() => window.open("https://dashboard.stripe.com/products", "_blank")}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Stripe
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Planos Ativos</p>
                  <p className="text-xl font-bold">{plans.filter(p => p.active).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Menor Preço</p>
                  <p className="text-xl font-bold">R$ {Math.min(...plans.filter(p => p.active).map(p => p.price)).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Crown className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Maior Preço</p>
                  <p className="text-xl font-bold">R$ {Math.max(...plans.filter(p => p.active).map(p => p.price)).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plano Destaque</p>
                  <p className="text-xl font-bold">{plans.find(p => p.popular)?.name || "Nenhum"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all ${
                plan.popular ? "border-primary ring-1 ring-primary/20" : ""
              } ${!plan.active ? "opacity-60" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {plan.maxMembers && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Max {plan.maxMembers}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={plan.active}
                      onCheckedChange={() => handleToggleActive(plan.id)}
                    />
                  </div>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                  {plan.periodMonths > 1 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      (R$ {calculateMonthlyPrice(plan)}/mês)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Features incluídas:</p>
                  <ul className="space-y-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Price ID: <code className="bg-muted px-1 rounded">{plan.priceId}</code>
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditPlan(plan)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTogglePopular(plan.id)}
                    >
                      <Star className={`h-4 w-4 ${plan.popular ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="bg-muted/30">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <ExternalLink className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Alteração de Preços</h3>
                <p className="text-sm text-muted-foreground">
                  Para alterar os preços dos planos, acesse o painel do Stripe e edite os produtos/preços diretamente. 
                  Após criar novos Price IDs, atualize-os aqui para manter a sincronização.
                </p>
                <Button 
                  variant="link" 
                  className="px-0 mt-2"
                  onClick={() => window.open("https://dashboard.stripe.com/products", "_blank")}
                >
                  Acessar Stripe Dashboard
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Plano</DialogTitle>
              <DialogDescription>
                Edite as informações do plano. Alterações de preço devem ser feitas no Stripe.
              </DialogDescription>
            </DialogHeader>

            {editingPlan && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano</Label>
                  <Input
                    id="name"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={editingPlan.description}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={editingPlan.price}
                      onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceId">Price ID (Stripe)</Label>
                    <Input
                      id="priceId"
                      value={editingPlan.priceId}
                      onChange={(e) => setEditingPlan({ ...editingPlan, priceId: e.target.value })}
                      placeholder="price_xxx"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period">Período Label</Label>
                    <Input
                      id="period"
                      value={editingPlan.period}
                      onChange={(e) => setEditingPlan({ ...editingPlan, period: e.target.value })}
                      placeholder="/mês"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodMonths">Duração (meses)</Label>
                    <Input
                      id="periodMonths"
                      type="number"
                      value={editingPlan.periodMonths}
                      onChange={(e) => setEditingPlan({ ...editingPlan, periodMonths: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                {editingPlan.maxMembers !== undefined && (
                  <div className="space-y-2">
                    <Label htmlFor="maxMembers">Limite de Membros</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      value={editingPlan.maxMembers}
                      onChange={(e) => setEditingPlan({ ...editingPlan, maxMembers: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Features</Label>
                    <Button variant="ghost" size="sm" onClick={handleAddFeature}>
                      + Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editingPlan.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => handleFeatureChange(idx, e.target.value)}
                          placeholder="Feature..."
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveFeature(idx)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSavePlan}>
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ClientLayout>
  );
}
