import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WorkoutNotesProps {
  protocoloId: string;
  workoutDay: string;
}

export function WorkoutNotes({ protocoloId, workoutDay }: WorkoutNotesProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: existingNote } = useQuery({
    queryKey: ["workout-note", protocoloId, workoutDay, user?.id],
    enabled: !!user?.id && !!protocoloId,
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_notes" as any)
        .select("id, note, created_at")
        .eq("user_id", user!.id)
        .eq("protocolo_id", protocoloId)
        .eq("workout_day", workoutDay)
        .maybeSingle();
      return data as { id: string; note: string; created_at: string } | null;
    },
  });

  useEffect(() => {
    if (existingNote?.note) {
      setNote(existingNote.note);
      setIsOpen(true);
    }
  }, [existingNote]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !note.trim()) return;
      const { error } = await supabase
        .from("workout_notes" as any)
        .upsert(
          {
            user_id: user.id,
            protocolo_id: protocoloId,
            workout_day: workoutDay,
            note: note.trim(),
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: "user_id,protocolo_id,workout_day" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-note", protocoloId, workoutDay] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Anotação salva!");
    },
    onError: () => toast.error("Erro ao salvar anotação"),
  });

  const maxChars = 500;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-3 w-full justify-center py-2 rounded-lg border border-dashed border-border/50 hover:border-primary/30"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {existingNote ? "Ver anotação" : "Adicionar anotação sobre este treino"}
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2 border-t border-border/30 pt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          Anotação do treino
        </span>
        <span className="text-[10px] text-muted-foreground">{note.length}/{maxChars}</span>
      </div>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, maxChars))}
        placeholder="Quer trocar algum exercício? Sentiu dor? Dúvidas sobre execução? Feedback geral..."
        className="min-h-[80px] max-h-[120px] text-sm bg-muted/30 resize-none"
        rows={4}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={() => setIsOpen(false)}
        >
          Fechar
        </Button>
        <Button
          size="sm"
          className="flex-1 text-xs gap-1.5"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !note.trim() || saved}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Salvo
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Salvar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
