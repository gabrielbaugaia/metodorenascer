import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { checkpoints } from "@/lib/hyrox90";
import { format } from "date-fns";
export function HyroxReminders({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const seen = useRef(new Set<string>());
  const { data } = useQuery({
    queryKey: ["hyrox-reminders", userId],
    staleTime: 60000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const p = await supabase
        .from("hyrox_programs")
        .select("id,start_date")
        .eq("user_id", userId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1);
      if (p.error) throw p.error;
      const program = p.data?.[0];
      if (!program) return 0;
      const r = await supabase
        .from("hyrox_reviews")
        .select("checkpoint,submitted_at")
        .eq("program_id", program.id);
      if (r.error) throw r.error;
      const today = format(new Date(), "yyyy-MM-dd");
      return checkpoints(program.start_date).filter(
        (c) =>
          c.date <= today &&
          !r.data?.some((r) => r.checkpoint === c.day && r.submitted_at),
      ).length;
    },
  });
  useEffect(() => {
    const ch = supabase
      .channel(`hyrox-reminders-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hyrox_programs",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["hyrox-programs"] });
          queryClient.invalidateQueries({ queryKey: ["hyrox-reminders"] });
          const row = payload.new as { id?: string; status?: string };
          if (
            row.id &&
            row.status === "published" &&
            !seen.current.has(row.id)
          ) {
            seen.current.add(row.id);
            toast.success("Seu protocolo revisado está disponível.");
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hyrox_reviews" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["hyrox-data"] });
          queryClient.invalidateQueries({ queryKey: ["hyrox-reminders"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [queryClient, userId]);
  return data ? (
    <aside className="border-l-2 border-primary pl-4 mb-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm">
        Você tem {data}{" "}
        {data === 1
          ? "revisão de acompanhamento pendente"
          : "revisões de acompanhamento pendentes"}
        .
      </p>
      <Button variant="link" asChild>
        <Link to="/meu-protocolo">Abrir meu protocolo</Link>
      </Button>
    </aside>
  ) : null;
}
