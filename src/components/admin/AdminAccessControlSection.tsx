import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Loader2, Crown, X } from "lucide-react";
import { toast } from "sonner";

interface Entitlement {
  id: string;
  user_id: string;
  access_level: string;
  override_level: string | null;
  override_expires_at: string | null;
  updated_at: string | null;
}

interface TrialUsageData {
  used_workout: boolean | null;
  used_diet: boolean | null;
  used_mindset: boolean | null;
  used_recipe_count: number | null;
  used_support_count: number | null;
}

function computeEffective(ent: Entitlement | null): string {
  if (!ent) return "none";
  if (ent.override_level && ent.override_expires_at) {
    if (new Date(ent.override_expires_at) > new Date()) {
      return ent.override_level;
    }
  }
  return ent.access_level || "none";
}

const LEVEL_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  full: { label: "Completo", variant: "default" },
  trial_limited: { label: "Trial Limitado", variant: "secondary" },
  none: { label: "Sem Acesso", variant: "destructive" },
};

interface AdminAccessControlSectionProps {
  clientId: string;
}

export function AdminAccessControlSection({ clientId }: AdminAccessControlSectionProps) {
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [trialUsageData, setTrialUsageData] = useState<TrialUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideLevel, setOverrideLevel] = useState("trial_limited");
  const [overrideExpires, setOverrideExpires] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);
  const [removingOverride, setRemovingOverride] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [entRes, usageRes] = await Promise.all([
        supabase
          .from("entitlements")
          .select("*")
          .eq("user_id", clientId)
          .maybeSingle(),
        supabase
          .from("trial_usage")
          .select("used_workout, used_diet, used_mindset, used_recipe_count, used_support_count")
          .eq("user_id", clientId)
          .maybeSingle(),
      ]);

      if (entRes.error) console.error("Error fetching entitlement:", entRes.error);
      if (usageRes.error) console.error("Error fetching trial_usage:", usageRes.error);

      setEntitlement(entRes.data);
      setTrialUsageData(usageRes.data);
    } catch (err) {
      console.error("Error fetching access data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchData();
  }, [clientId]);

  const effectiveLevel = computeEffective(entitlement);
  const levelInfo = LEVEL_LABELS[effectiveLevel] || LEVEL_LABELS.none;

  const handleSaveOverride = async () => {
    if (!overrideExpires) {
      toast.error("Defina a data de expiração do override");
      return;
    }

    const expiresDate = new Date(overrideExpires);
    if (expiresDate <= new Date()) {
      toast.error("A data deve ser no futuro");
      return;
    }

    setSavingOverride(true);
    try {
      const { error } = await supabase.from("entitlements").upsert(
        {
          user_id: clientId,
          override_level: overrideLevel,
          override_expires_at: expiresDate.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;

      toast.success("Override aplicado com sucesso!");
      setOverrideOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Error saving override:", err);
      toast.error(err.message || "Erro ao aplicar override");
    } finally {
      setSavingOverride(false);
    }
  };

  const handleRemoveOverride = async () => {
    setRemovingOverride(true);
    try {
      const { error } = await supabase
        .from("entitlements")
        .update({
          override_level: null,
          override_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", clientId);

      if (error) throw error;

      toast.success("Override removido");
      fetchData();
    } catch (err: any) {
      console.error("Error removing override:", err);
      toast.error(err.message || "Erro ao remover override");
    } finally {
      setRemovingOverride(false);
    }
  };

  // Compute minimum date for override (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Controle de Acesso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Level */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Nível efetivo</p>
            <Badge variant={levelInfo.variant} className="mt-1">
              {levelInfo.label}
            </Badge>
          </div>
          {entitlement && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Base</p>
              <Badge variant="outline" className="mt-1">
                {LEVEL_LABELS[entitlement.access_level]?.label || entitlement.access_level}
              </Badge>
            </div>
          )}
        </div>

        {/* Override info */}
        {entitlement?.override_level && entitlement?.override_expires_at && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Crown className="h-4 w-4 text-amber-500" />
                  Override ativo: {LEVEL_LABELS[entitlement.override_level]?.label || entitlement.override_level}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expira em {new Date(entitlement.override_expires_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveOverride}
                disabled={removingOverride}
                className="text-destructive hover:text-destructive"
              >
                {removingOverride ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Trial Usage */}
        {trialUsageData && (
          <div>
            <p className="text-sm font-medium mb-2">Uso do Trial</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-xs">Módulo</TableHead>
                  <TableHead className="h-8 text-xs text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="py-1.5 text-sm">Treino</TableCell>
                  <TableCell className="py-1.5 text-right">
                    <Badge variant={trialUsageData.used_workout ? "default" : "outline"} className="text-xs">
                      {trialUsageData.used_workout ? "Usado" : "Disponível"}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-1.5 text-sm">Nutrição</TableCell>
                  <TableCell className="py-1.5 text-right">
                    <Badge variant={trialUsageData.used_diet ? "default" : "outline"} className="text-xs">
                      {trialUsageData.used_diet ? "Usado" : "Disponível"}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-1.5 text-sm">Mindset</TableCell>
                  <TableCell className="py-1.5 text-right">
                    <Badge variant={trialUsageData.used_mindset ? "default" : "outline"} className="text-xs">
                      {trialUsageData.used_mindset ? "Usado" : "Disponível"}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-1.5 text-sm">Receitas</TableCell>
                  <TableCell className="py-1.5 text-right">
                    <Badge variant={(trialUsageData.used_recipe_count ?? 0) > 0 ? "default" : "outline"} className="text-xs">
                      {trialUsageData.used_recipe_count ?? 0}/1
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-1.5 text-sm">Suporte</TableCell>
                  <TableCell className="py-1.5 text-right">
                    <Badge variant={(trialUsageData.used_support_count ?? 0) > 0 ? "default" : "outline"} className="text-xs">
                      {trialUsageData.used_support_count ?? 0}/1
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* Apply Override Button */}
        <Button
          variant="outline"
          className="w-full"
          size="sm"
          onClick={() => {
            setOverrideLevel("trial_limited");
            setOverrideExpires("");
            setOverrideOpen(true);
          }}
        >
          <Crown className="h-4 w-4 mr-2" />
          Aplicar Override de Cortesia
        </Button>

        {/* Override Dialog */}
        <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Override de Cortesia</DialogTitle>
              <DialogDescription>
                Aplique um nível de acesso temporário para este cliente. O override tem data de expiração obrigatória.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nível de acesso</Label>
                <Select value={overrideLevel} onValueChange={setOverrideLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial_limited">Trial Limitado</SelectItem>
                    <SelectItem value="full">Completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expira em</Label>
                <Input
                  type="date"
                  value={overrideExpires}
                  onChange={(e) => setOverrideExpires(e.target.value)}
                  min={minDate}
                />
                <p className="text-xs text-muted-foreground">
                  Data mínima: amanhã. Nunca pode ser infinito.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOverrideOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="fire"
                onClick={handleSaveOverride}
                disabled={savingOverride || !overrideExpires}
              >
                {savingOverride ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Crown className="h-4 w-4 mr-2" />
                )}
                Aplicar Override
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
