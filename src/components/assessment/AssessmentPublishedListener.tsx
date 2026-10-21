import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** Avisa o aluno e atualiza as telas assim que uma avaliação dele é publicada. */
export function AssessmentPublishedListener({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const channel = supabase
      .channel(`assessments-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "physical_assessments", filter: `user_id=eq.${userId}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["physical-assessments"] });
          const row = payload.new as { id?: string; status?: string } | null;
          const old = payload.old as { status?: string } | null;
          if (row?.id && row.status === "published" && old?.status !== "published" && !seen.current.has(row.id)) {
            seen.current.add(row.id);
            toast.success("Nova avaliação física publicada", {
              description: "A Equipe GB publicou sua avaliação.",
              action: { label: "Ver", onClick: () => navigate("/minhas-avaliacoes") },
            });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc, navigate]);

  return null;
}
