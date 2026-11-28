import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";
import type { ProgramConfig } from "@/lib/hyrox90";
export type Program = Omit<
  Database["public"]["Tables"]["hyrox_programs"]["Row"],
  "config"
> & { config: ProgramConfig };
export type Activity = Database["public"]["Tables"]["hyrox_activities"]["Row"];
export type Review = Database["public"]["Tables"]["hyrox_reviews"]["Row"];
export function useHyroxPrograms(userId?: string, admin = false) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["hyrox-programs", user?.id, userId, admin],
    enabled: !!user && (!!userId || admin),
    staleTime: 0,
    queryFn: async () => {
      let q = supabase
        .from("hyrox_programs")
        .select("*")
        .order("created_at", { ascending: false });
      if (userId) q = q.eq("user_id", userId);
      if (!admin) q = q.eq("status", "published");
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Program[];
    },
  });
}
export function useHyroxData(programId: string) {
  return useQuery({
    queryKey: ["hyrox-data", programId],
    staleTime: 0,
    queryFn: async () => {
      const [a, r, d] = await Promise.all([
        supabase
          .from("hyrox_activities")
          .select("*")
          .eq("program_id", programId)
          .order("planned_date")
          .order("planned_time"),
        supabase
          .from("hyrox_reviews")
          .select("*")
          .eq("program_id", programId)
          .order("checkpoint"),
        supabase
          .from("hyrox_documents")
          .select("*")
          .eq("program_id", programId)
          .order("created_at"),
      ]);
      if (a.error || r.error || d.error) throw a.error || r.error || d.error;
      return {
        activities: a.data ?? [],
        reviews: r.data ?? [],
        documents: d.data ?? [],
      };
    },
  });
}
export function useRefreshHyrox() {
  const q = useQueryClient();
  return async () => {
    await Promise.all([
      q.invalidateQueries({ queryKey: ["hyrox-programs"] }),
      q.invalidateQueries({ queryKey: ["hyrox-data"] }),
    ]);
  };
}
