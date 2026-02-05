import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Play,
  Pause,
  Users,
  Calendar,
  Clock,
  Dumbbell,
  Utensils,
  Brain,
  ChefHat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ModuleName, MODULE_DISPLAY_NAMES, DEFAULT_TRIAL_LIMITS } from '@/lib/moduleAccess';

interface TrialCampaign {
  id: string;
  name: string;
  duration_days: number;
  is_active: boolean;
  module_limits: Record<string, Record<string, unknown>>;
  max_participants: number | null;
  current_participants: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

const TRIAL_MODULES: ModuleName[] = ['treino', 'nutricao', 'mindset', 'receitas'];

const MODULE_ICONS: Record<string, React.ReactNode> = {
  treino: <Dumbbell className="w-4 h-4" />,
  nutricao: <Utensils className="w-4 h-4" />,
  mindset: <Brain className="w-4 h-4" />,
  receitas: <ChefHat className="w-4 h-4" />
};

export default function AdminTrialCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<TrialCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCampaign, setEditCampaign] = useState<TrialCampaign | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleteCampaign, setDeleteCampaign] = useState<TrialCampaign | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    duration_days: 7,
    is_active: false,
    module_limits: DEFAULT_TRIAL_LIMITS as Record<string, Record<string, unknown>>,
    max_participants: null as number | null,
    starts_at: '',
    ends_at: ''
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('trial_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCampaigns(data?.map(c => ({
        ...c,
        module_limits: (c.module_limits as Record<string, Record<string, unknown>>) || {}
      })) || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (campaign?: TrialCampaign) => {
    if (campaign) {
      setEditCampaign(campaign);
      setFormData({
        name: campaign.name,
        duration_days: campaign.duration_days,
        is_active: campaign.is_active,
        module_limits: campaign.module_limits,
        max_participants: campaign.max_participants,
        starts_at: campaign.starts_at ? format(new Date(campaign.starts_at), 'yyyy-MM-dd') : '',
        ends_at: campaign.ends_at ? format(new Date(campaign.ends_at), 'yyyy-MM-dd') : ''
      });
    } else {
      setEditCampaign(null);
      setFormData({
        name: '',
        duration_days: 7,
        is_active: false,
        module_limits: DEFAULT_TRIAL_LIMITS as Record<string, Record<string, unknown>>,
        max_participants: null,
        starts_at: '',
        ends_at: ''
      });
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!formData.name || formData.duration_days <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const campaignData = {
        name: formData.name,
        duration_days: formData.duration_days,
        is_active: formData.is_active,
        module_limits: formData.module_limits as unknown as Record<string, unknown>,
        max_participants: formData.max_participants,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
        updated_at: new Date().toISOString()
      };

      if (editCampaign) {
        const { error } = await supabase
          .from('trial_campaigns')
          .update(campaignData as any)
          .eq('id', editCampaign.id);

        if (error) throw error;
        toast.success('Campanha atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('trial_campaigns')
          .insert(campaignData as any);

        if (error) throw error;
        toast.success('Campanha criada com sucesso');
      }

      setShowEditor(false);
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      toast.error(error.message || 'Erro ao salvar campanha');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCampaign) return;

    try {
      const { error } = await supabase
        .from('trial_campaigns')
        .delete()
        .eq('id', deleteCampaign.id);

      if (error) throw error;
      
      toast.success('Campanha removida com sucesso');
      setDeleteCampaign(null);
      fetchCampaigns();
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast.error(error.message || 'Erro ao remover campanha');
    }
  };

  const toggleCampaignActive = async (campaign: TrialCampaign) => {
    try {
      const { error } = await supabase
        .from('trial_campaigns')
        .update({ is_active: !campaign.is_active, updated_at: new Date().toISOString() })
        .eq('id', campaign.id);

      if (error) throw error;
      
      toast.success(campaign.is_active ? 'Campanha desativada' : 'Campanha ativada');
      fetchCampaigns();
    } catch (error) {
      console.error('Error toggling campaign:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const updateModuleLimit = (module: string, field: string, value: unknown) => {
    setFormData({
      ...formData,
      module_limits: {
        ...formData.module_limits,
        [module]: {
          ...formData.module_limits[module],
          [field]: value
        }
      }
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
              <h1 className="text-2xl font-bold">Campanhas de Trial</h1>
              <p className="text-muted-foreground">Gerencie períodos de teste gratuito</p>
            </div>
          </div>
          <Button onClick={() => openEditor()}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Campanhas Ativas</span>
              </div>
              <div className="text-2xl font-bold">
                {campaigns.filter(c => c.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Total Participantes</span>
              </div>
              <div className="text-2xl font-bold">
                {campaigns.reduce((acc, c) => acc + c.current_participants, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-32 bg-muted" />
              </Card>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma campanha criada ainda</p>
              <Button className="mt-4" onClick={() => openEditor()}>
                Criar Primeira Campanha
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map(campaign => (
              <Card key={campaign.id} className={!campaign.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {campaign.name}
                        <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                          {campaign.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {campaign.duration_days} dias
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {campaign.current_participants}
                          {campaign.max_participants && `/${campaign.max_participants}`} participantes
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCampaignActive(campaign)}
                      >
                        {campaign.is_active ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditor(campaign)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteCampaign(campaign)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Module Limits Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TRIAL_MODULES.map(mod => {
                      const limits = campaign.module_limits[mod] || {};
                      return (
                        <div 
                          key={mod} 
                          className="flex items-center gap-2 p-2 rounded bg-muted"
                        >
                          {MODULE_ICONS[mod]}
                          <div className="text-xs">
                            <div className="font-medium">{MODULE_DISPLAY_NAMES[mod]}</div>
                            <div className="text-muted-foreground">
                              {limits.access_level === 'limited' ? 'Limitado' : 'Nenhum'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
              {editCampaign ? 'Editar Campanha' : 'Nova Campanha'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome da Campanha</Label>
              <Input 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="7 Dias Grátis - Lançamento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duração (dias)</Label>
                <Input 
                  type="number"
                  value={formData.duration_days}
                  onChange={e => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 7 })}
                />
              </div>
              <div>
                <Label>Máximo de Participantes (opcional)</Label>
                <Input 
                  type="number"
                  value={formData.max_participants || ''}
                  onChange={e => setFormData({ ...formData, max_participants: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Ilimitado"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Início (opcional)</Label>
                <Input 
                  type="date"
                  value={formData.starts_at}
                  onChange={e => setFormData({ ...formData, starts_at: e.target.value })}
                />
              </div>
              <div>
                <Label>Data de Término (opcional)</Label>
                <Input 
                  type="date"
                  value={formData.ends_at}
                  onChange={e => setFormData({ ...formData, ends_at: e.target.value })}
                />
              </div>
            </div>

            {/* Module Limits */}
            <div>
              <Label className="mb-3 block">Limites por Módulo</Label>
              <div className="space-y-4">
                {TRIAL_MODULES.map(mod => {
                  const limits = formData.module_limits[mod] || {};
                  return (
                    <div key={mod} className="p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-3">
                        {MODULE_ICONS[mod]}
                        <span className="font-medium">{MODULE_DISPLAY_NAMES[mod]}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {mod === 'treino' && (
                          <>
                            <div>
                              <Label className="text-xs">Treinos visíveis</Label>
                              <Input 
                                type="number"
                                value={(limits.max_workouts_visible as number) || 1}
                                onChange={e => updateModuleLimit(mod, 'max_workouts_visible', parseInt(e.target.value))}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={!!(limits.allow_pdf_download)}
                                onCheckedChange={v => updateModuleLimit(mod, 'allow_pdf_download', v)}
                              />
                              <Label className="text-xs">PDF Download</Label>
                            </div>
                          </>
                        )}
                        {mod === 'nutricao' && (
                          <>
                            <div>
                              <Label className="text-xs">Refeições visíveis</Label>
                              <Input 
                                type="number"
                                value={(limits.max_meals_visible as number) || 2}
                                onChange={e => updateModuleLimit(mod, 'max_meals_visible', parseInt(e.target.value))}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={!!(limits.show_full_plan)}
                                onCheckedChange={v => updateModuleLimit(mod, 'show_full_plan', v)}
                              />
                              <Label className="text-xs">Plano Completo</Label>
                            </div>
                          </>
                        )}
                        {mod === 'mindset' && (
                          <div>
                            <Label className="text-xs">Módulos visíveis</Label>
                            <Input 
                              type="number"
                              value={(limits.max_modules_visible as number) || 1}
                              onChange={e => updateModuleLimit(mod, 'max_modules_visible', parseInt(e.target.value))}
                            />
                          </div>
                        )}
                        {mod === 'receitas' && (
                          <>
                            <div>
                              <Label className="text-xs">Receitas por dia</Label>
                              <Input 
                                type="number"
                                value={(limits.max_recipes_per_day as number) || 1}
                                onChange={e => updateModuleLimit(mod, 'max_recipes_per_day', parseInt(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Total permitido</Label>
                              <Input 
                                type="number"
                                value={(limits.total_recipes_allowed as number) || 3}
                                onChange={e => updateModuleLimit(mod, 'total_recipes_allowed', parseInt(e.target.value))}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.is_active}
                onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Campanha Ativa</Label>
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
      <AlertDialog open={!!deleteCampaign} onOpenChange={() => setDeleteCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a campanha "{deleteCampaign?.name}"? 
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
