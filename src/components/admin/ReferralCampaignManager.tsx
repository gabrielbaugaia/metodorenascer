import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Megaphone, Upload, Loader2, Trash2, Plus, Image as ImageIcon } from "lucide-react";

interface BenefitRule {
  benefit_type: "discount_percent" | "consultation" | "custom";
  label: string;
  description: string;
  value?: number;
}

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  banner_image_url: string | null;
  cashback_rules: BenefitRule[];
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export function ReferralCampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [rules, setRules] = useState<BenefitRule[]>([{ benefit_type: "discount_percent", label: "10% de desconto", description: "", value: 10 }]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from("referral_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCampaigns(data.map(c => ({
        ...c,
        cashback_rules: (c.cashback_rules as any[] || []) as BenefitRule[],
      })));
    }
    setLoading(false);
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `referral-banners/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("blog-assets").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("blog-assets").getPublicUrl(path);
      setBannerUrl(urlData.publicUrl);
      toast.success("Banner enviado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar banner");
    } finally { setUploading(false); }
  };

  const addRule = () => {
    setRules([...rules, { benefit_type: "custom", label: "", description: "" }]);
  };

  const removeRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  const updateRule = (idx: number, updates: Partial<BenefitRule>) => {
    const updated = [...rules];
    updated[idx] = { ...updated[idx], ...updates };
    if (updates.benefit_type === "discount_percent") {
      updated[idx].label = `${updated[idx].value || 10}% de desconto`;
    } else if (updates.benefit_type === "consultation" && !updated[idx].label) {
      updated[idx].label = "Consulta 30min com Gabriel Baú";
    }
    if (updates.value !== undefined && updated[idx].benefit_type === "discount_percent") {
      updated[idx].label = `${updates.value}% de desconto`;
    }
    setRules(updated);
  };

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("referral_campaigns")
        .insert([{
          title: title.trim(),
          description: description.trim() || null,
          banner_image_url: bannerUrl || null,
          cashback_rules: rules.filter(r => r.label.trim()) as any,
          active: false,
        }]);
      if (error) throw error;
      toast.success("Campanha criada!");
      setTitle(""); setDescription(""); setBannerUrl("");
      setRules([{ benefit_type: "discount_percent", label: "10% de desconto", description: "", value: 10 }]);
      setShowForm(false);
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar campanha");
    } finally { setSaving(false); }
  };

  const toggleActive = async (campaign: Campaign) => {
    try {
      if (!campaign.active) {
        await supabase.from("referral_campaigns").update({ active: false }).neq("id", campaign.id);
      }
      const { error } = await supabase.from("referral_campaigns").update({ active: !campaign.active }).eq("id", campaign.id);
      if (error) throw error;
      toast.success(campaign.active ? "Campanha desativada" : "Campanha ativada");
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar status");
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase.from("referral_campaigns").delete().eq("id", id);
      if (error) throw error;
      toast.success("Campanha removida");
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover");
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Megaphone className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              Campanhas de Indicação
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Gerencie banners e benefícios para o "Indique e Ganhe"
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nova
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showForm && (
          <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/20">
            <div className="space-y-2">
              <Label className="text-xs">Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Indique e Ganhe" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Indique um amigo e ganhe benefícios..." rows={2} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Banner (imagem)</Label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg px-4 py-2.5 hover:border-primary/50 transition-colors">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm text-muted-foreground">{uploading ? "Enviando..." : "Upload"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadBanner} disabled={uploading} />
                </label>
                {bannerUrl && <img src={bannerUrl} alt="Preview" className="h-12 rounded-md object-cover" />}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Benefícios para indicados</Label>
              {rules.map((rule, idx) => (
                <div key={idx} className="space-y-2 border border-border/50 rounded-lg p-3 bg-background">
                  <div className="flex items-center gap-2">
                    <Select value={rule.benefit_type} onValueChange={(v) => updateRule(idx, { benefit_type: v as BenefitRule["benefit_type"] })}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount_percent">Desconto %</SelectItem>
                        <SelectItem value="consultation">Consulta</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    {rule.benefit_type === "discount_percent" && (
                      <Input
                        type="number"
                        value={rule.value || ""}
                        onChange={(e) => updateRule(idx, { value: Number(e.target.value) })}
                        className="w-20"
                        min={1}
                        max={100}
                        placeholder="%"
                      />
                    )}
                    {rules.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 ml-auto" onClick={() => removeRule(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={rule.label}
                    onChange={(e) => updateRule(idx, { label: e.target.value })}
                    placeholder="Ex: 20% de desconto no plano"
                    className="text-sm"
                  />
                  <Textarea
                    value={rule.description}
                    onChange={(e) => updateRule(idx, { description: e.target.value })}
                    placeholder="Descrição do benefício (texto livre)..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addRule} className="text-xs">
                <Plus className="h-3 w-3 mr-1" /> Adicionar benefício
              </Button>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={saving} size="sm">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Criar Campanha
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {campaigns.length === 0 && !showForm ? (
          <div className="text-center py-6">
            <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma campanha criada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="border border-border/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {c.banner_image_url && <img src={c.banner_image_url} alt="" className="h-10 w-14 object-cover rounded" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={c.active ? "default" : "secondary"} className="text-xs">
                      {c.active ? "Ativa" : "Inativa"}
                    </Badge>
                    <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCampaign(c.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                {c.cashback_rules.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.cashback_rules.map((r: any, idx: number) => (
                      <span key={idx} className="text-[10px] bg-muted/50 px-2 py-0.5 rounded">
                        {r.label || `${r.plan_type}: ${r.cashback_amount}x`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
