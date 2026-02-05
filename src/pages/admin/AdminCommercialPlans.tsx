import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Star,
  Dumbbell,
  Utensils,
  Brain,
  ChefHat,
  LayoutDashboard,
  ClipboardCheck,
  MessageCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPriceBRL, ModuleName, MODULE_DISPLAY_NAMES } from '@/lib/moduleAccess';

interface CommercialPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  stripe_price_id: string | null;
  period_months: number;
  modules_access: Record<string, string>;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
}

const ALL_MODULES: ModuleName[] = ['treino', 'nutricao', 'mindset', 'receitas', 'dashboard', 'checkins', 'suporte', 'protocolos'];

const MODULE_ICONS: Record<ModuleName, React.ReactNode> = {
  treino: <Dumbbell className="w-4 h-4" />,
  nutricao: <Utensils className="w-4 h-4" />,
  mindset: <Brain className="w-4 h-4" />,
  receitas: <ChefHat className="w-4 h-4" />,
  dashboard: <LayoutDashboard className="w-4 h-4" />,
  checkins: <ClipboardCheck className="w-4 h-4" />,
  suporte: <MessageCircle className="w-4 h-4" />,
  protocolos: <FileText className="w-4 h-4" />
};

export default function AdminCommercialPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState<CommercialPlan | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deletePlan, setDeletePlan] = useState<CommercialPlan | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    price_cents: 0,
    stripe_price_id: '',
    period_months: 1,
    modules_access: {} as Record<string, string>,
    features: [] as string[],
    is_active: true,
    is_popular: false,
    sort_order: 0
  });
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('commercial_plans')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      
      setPlans(data?.map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features as string[] : [],
        modules_access: (p.modules_access as Record<string, string>) || {}
      })) || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (plan?: CommercialPlan) => {
    if (plan) {
      setEditPlan(plan);
      setFormData({
        slug: plan.slug,
        name: plan.name,
        description: plan.description || '',
        price_cents: plan.price_cents,
        stripe_price_id: plan.stripe_price_id || '',
        period_months: plan.period_months,
        modules_access: plan.modules_access,
        features: plan.features,
        is_active: plan.is_active,
        is_popular: plan.is_popular,
        sort_order: plan.sort_order
      });
      setFeaturesText(plan.features.join('\n'));
    } else {
      setEditPlan(null);
      setFormData({
        slug: '',
        name: '',
        description: '',
        price_cents: 0,
        stripe_price_id: '',
        period_months: 1,
        modules_access: ALL_MODULES.reduce((acc, m) => ({ ...acc, [m]: 'none' }), {}),
        features: [],
        is_active: true,
        is_popular: false,
        sort_order: plans.length + 1
      });
      setFeaturesText('');
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!formData.slug || !formData.name || formData.price_cents <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const planData = {
        ...formData,
        features: featuresText.split('\n').filter(f => f.trim()),
        updated_at: new Date().toISOString()
      };

      if (editPlan) {
        const { error } = await supabase
          .from('commercial_plans')
          .update(planData)
          .eq('id', editPlan.id);

        if (error) throw error;
        toast.success('Plano atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('commercial_plans')
          .insert(planData);

        if (error) throw error;
        toast.success('Plano criado com sucesso');
      }

      setShowEditor(false);
      fetchPlans();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast.error(error.message || 'Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePlan) return;

    try {
      const { error } = await supabase
        .from('commercial_plans')
        .delete()
        .eq('id', deletePlan.id);

      if (error) throw error;
      
      toast.success('Plano removido com sucesso');
      setDeletePlan(null);
      fetchPlans();
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast.error(error.message || 'Erro ao remover plano');
    }
  };

  const toggleModuleAccess = (module: ModuleName) => {
    const current = formData.modules_access[module] || 'none';
    const next = current === 'full' ? 'none' : 'full';
    setFormData({
      ...formData,
      modules_access: { ...formData.modules_access, [module]: next }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Planos Comerciais</h1>
              <p className="text-muted-foreground">Gerencie os planos de venda</p>
            </div>
          </div>
          <Button onClick={() => openEditor()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted" />
                <CardContent className="h-32 bg-muted/50" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(plan => (
              <Card 
                key={plan.id} 
                className={`relative ${!plan.is_active ? 'opacity-60' : ''} ${plan.is_popular ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.is_popular && (
                  <Badge className="absolute -top-2 -right-2 bg-primary">
                    <Star className="w-3 h-3 mr-1" /> Popular
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        {!plan.is_active && (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatPriceBRL(plan.price_cents)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        /{plan.period_months === 1 ? 'mês' : `${plan.period_months} meses`}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Modules */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ALL_MODULES.slice(0, 4).map(mod => {
                      const hasAccess = plan.modules_access[mod] === 'full';
                      return (
                        <div
                          key={mod}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                            hasAccess 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {MODULE_ICONS[mod]}
                          <span>{MODULE_DISPLAY_NAMES[mod]}</span>
                          {hasAccess ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Features preview */}
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        {f}
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-xs">+{plan.features.length - 3} mais...</li>
                    )}
                  </ul>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditor(plan)}
                    >
                      <Edit className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setDeletePlan(plan)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Slug (identificador)</Label>
                <Input 
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="treino_dieta"
                  disabled={!!editPlan}
                />
              </div>
              <div>
                <Label>Nome</Label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Treino + Dieta"
                />
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Input 
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Treino e plano nutricional completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={(formData.price_cents / 100).toFixed(2)}
                  onChange={e => setFormData({ ...formData, price_cents: Math.round(parseFloat(e.target.value) * 100) })}
                  placeholder="97.00"
                />
              </div>
              <div>
                <Label>Stripe Price ID</Label>
                <Input 
                  value={formData.stripe_price_id}
                  onChange={e => setFormData({ ...formData, stripe_price_id: e.target.value })}
                  placeholder="price_xxxxx"
                />
              </div>
            </div>

            {/* Modules Access */}
            <div>
              <Label className="mb-2 block">Módulos Inclusos</Label>
              <div className="grid grid-cols-4 gap-2">
                {ALL_MODULES.map(mod => {
                  const hasAccess = formData.modules_access[mod] === 'full';
                  return (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => toggleModuleAccess(mod)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                        hasAccess 
                          ? 'bg-primary/10 border-primary text-primary' 
                          : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                      }`}
                    >
                      {MODULE_ICONS[mod]}
                      <span className="text-xs">{MODULE_DISPLAY_NAMES[mod]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Features */}
            <div>
              <Label>Features (uma por linha)</Label>
              <Textarea 
                value={featuresText}
                onChange={e => setFeaturesText(e.target.value)}
                placeholder="Treino personalizado por IA&#10;Plano nutricional completo&#10;Dashboard de progresso"
                rows={5}
              />
            </div>

            {/* Switches */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.is_active}
                    onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={formData.is_popular}
                    onCheckedChange={checked => setFormData({ ...formData, is_popular: checked })}
                  />
                  <Label>Popular</Label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label>Ordem:</Label>
                <Input 
                  type="number"
                  className="w-16"
                  value={formData.sort_order}
                  onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePlan} onOpenChange={() => setDeletePlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o plano "{deletePlan?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
