import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Archive, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ArchiveClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** IDs to archive (single or batch) */
  clientIds: string[];
  /** For single mode, optional name shown in confirmation */
  clientName?: string;
  /** Mode: 'archive' marks archived, 'restore' clears, 'delete' permanently removes */
  mode: "archive" | "restore" | "delete";
  /** Email required to confirm permanent deletion (single only) */
  clientEmail?: string;
  onComplete: () => void;
}

const REASONS = [
  { value: "never_accessed", label: "Nunca acessou" },
  { value: "plan_expired", label: "Plano expirou" },
  { value: "inactive_90d", label: "Inativo 90+ dias" },
  { value: "guest_invite_unused", label: "Convidado nunca entrou" },
  { value: "other", label: "Outro" },
];

export function ArchiveClientModal({
  open,
  onOpenChange,
  clientIds,
  clientName,
  mode,
  clientEmail,
  onComplete,
}: ArchiveClientModalProps) {
  const [reason, setReason] = useState<string>("never_accessed");
  const [notes, setNotes] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const isBatch = clientIds.length > 1;
  const count = clientIds.length;

  const reset = () => {
    setReason("never_accessed");
    setNotes("");
    setEmailConfirm("");
  };

  const handleConfirm = async () => {
    if (clientIds.length === 0) return;

    setLoading(true);
    try {
      if (mode === "archive") {
        const reasonLabel = REASONS.find((r) => r.value === reason)?.label || reason;
        const fullReason = notes.trim() ? `${reasonLabel} — ${notes.trim()}` : reasonLabel;

        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
          .from("profiles")
          .update({
            archived_at: new Date().toISOString(),
            archived_reason: fullReason,
            archived_by: user?.id ?? null,
          })
          .in("id", clientIds);

        if (error) throw error;
        toast.success(`${count} cliente${count > 1 ? "s arquivados" : " arquivado"} com sucesso`);
      } else if (mode === "restore") {
        const { error } = await supabase
          .from("profiles")
          .update({
            archived_at: null,
            archived_reason: null,
            archived_by: null,
          })
          .in("id", clientIds);

        if (error) throw error;
        toast.success(`${count} cliente${count > 1 ? "s restaurados" : " restaurado"}`);
      } else if (mode === "delete") {
        if (!clientEmail || emailConfirm.trim().toLowerCase() !== clientEmail.toLowerCase()) {
          toast.error("Email de confirmação não confere");
          setLoading(false);
          return;
        }
        const { error } = await supabase.functions.invoke("admin-delete-user", {
          body: { email: clientEmail },
        });
        if (error) throw error;
        toast.success("Cliente excluído permanentemente");
      }

      reset();
      onOpenChange(false);
      onComplete();
    } catch (error) {
      console.error(`Error in ${mode}:`, error);
      toast.error(`Erro ao ${mode === "archive" ? "arquivar" : mode === "restore" ? "restaurar" : "excluir"} cliente`);
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    archive: isBatch ? `Arquivar ${count} clientes` : `Arquivar ${clientName ?? "cliente"}`,
    restore: isBatch ? `Restaurar ${count} clientes` : `Restaurar ${clientName ?? "cliente"}`,
    delete: `Excluir permanentemente ${clientName ?? "cliente"}`,
  };

  const descriptions = {
    archive:
      "O cliente sai da contagem de ativos e não aparece nas métricas, mas todos os dados (anamnese, histórico, email) ficam preservados. Pode ser restaurado a qualquer momento.",
    restore: "O cliente volta para a lista de ativos e contará novamente nas métricas.",
    delete:
      "Esta ação é IRREVERSÍVEL. Todos os dados do cliente, incluindo conta de acesso, anamnese, treinos e histórico, serão removidos permanentemente.",
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "delete" ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Archive className="h-5 w-5" />
            )}
            {titles[mode]}
          </DialogTitle>
          <DialogDescription>{descriptions[mode]}</DialogDescription>
        </DialogHeader>

        {mode === "archive" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observação (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: cliente pediu pausa..."
                rows={2}
              />
            </div>
          </div>
        )}

        {mode === "delete" && clientEmail && (
          <div className="space-y-2 py-2">
            <Label htmlFor="email-confirm">
              Digite o email <strong>{clientEmail}</strong> para confirmar
            </Label>
            <Input
              id="email-confirm"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              placeholder={clientEmail}
              autoComplete="off"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={mode === "delete" ? "destructive" : mode === "restore" ? "default" : "default"}
            onClick={handleConfirm}
            disabled={
              loading ||
              (mode === "delete" &&
                (!clientEmail || emailConfirm.trim().toLowerCase() !== clientEmail.toLowerCase()))
            }
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "archive" ? "Arquivar" : mode === "restore" ? "Restaurar" : "Excluir permanentemente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
