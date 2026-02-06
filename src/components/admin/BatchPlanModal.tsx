import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { PLAN_TYPES, PLAN_NAMES, PLAN_PRICES_CENTS, PLAN_DURATIONS } from "@/lib/planConstants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BatchPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onComplete: () => void;
}

const PAID_PLAN_OPTIONS = [
  PLAN_TYPES.ELITE_FUNDADOR,
  PLAN_TYPES.MENSAL,
  PLAN_TYPES.TRIMESTRAL,
  PLAN_TYPES.SEMESTRAL,
  PLAN_TYPES.ANUAL,
];

export function BatchPlanModal({ open, onOpenChange, selectedIds, onComplete }: BatchPlanModalProps) {
  const [targetPlan, setTargetPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!targetPlan) {
      toast.error("Selecione um plano");
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const durationDays = PLAN_DURATIONS[targetPlan] || 30;
      const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      const priceCents = PLAN_PRICES_CENTS[targetPlan] || 0;

      // Process each client in parallel
      const results = await Promise.all(
        selectedIds.map(async (userId) => {
          try {
            // 1. Upsert subscription
            const { error: subError } = await supabase
              .from("subscriptions")
              .upsert(
                {
                  user_id: userId,
                  status: "active",
                  plan_type: targetPlan,
                  plan_name: PLAN_NAMES[targetPlan] || targetPlan.toUpperCase(),
                  current_period_start: now,
                  current_period_end: periodEnd,
                  started_at: now,
                  access_blocked: false,
                  blocked_reason: null,
                  price_cents: priceCents,
                },
                { onConflict: "user_id" }
              );
            if (subError) throw subError;

            // 2. Upsert entitlements to full
            const { error: entError } = await supabase
              .from("entitlements")
              .upsert(
                {
                  user_id: userId,
                  access_level: "full",
                  updated_at: now,
                },
                { onConflict: "user_id" }
              );
            if (entError) throw entError;

            // 3. Update profile status to active
            const { error: profError } = await supabase
              .from("profiles")
              .update({ client_status: "active" })
              .eq("id", userId);
            if (profError) throw profError;

            return { userId, success: true };
          } catch (error) {
            console.error(`Error updating user ${userId}:`, error);
            return { userId, success: false };
          }
        })
      );

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (failCount > 0) {
        toast.warning(`${successCount} atualizados, ${failCount} com erro`);
      } else {
        toast.success(`${successCount} clientes atualizados para ${PLAN_NAMES[targetPlan]}`);
      }

      setTargetPlan("");
      onOpenChange(false);
      onComplete();
    } catch (error) {
      console.error("Batch plan update error:", error);
      toast.error("Erro ao atualizar planos em lote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Plano em Lote</DialogTitle>
          <DialogDescription>
            {selectedIds.length} cliente{selectedIds.length > 1 ? "s" : ""} será{selectedIds.length > 1 ? "ão" : ""} alterado{selectedIds.length > 1 ? "s" : ""} para o plano selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Plano de destino</label>
            <Select value={targetPlan} onValueChange={setTargetPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {PAID_PLAN_OPTIONS.map((plan) => (
                  <SelectItem key={plan} value={plan}>
                    {PLAN_NAMES[plan]} — R${((PLAN_PRICES_CENTS[plan] || 0) / 100).toFixed(2).replace(".", ",")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !targetPlan}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              "Confirmar Alteração"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
