import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Finding } from "@/lib/movementAssessment";

export type MovementReport = { summary: string; recommendations: string; limitations: string; observations: { media_id: string; second: number | null; observation: string; confidence: string }[]; analyzed_at?: string };
export type MovementAssessment = { id: string; user_id: string; assessed_at: string; assessment_type: string; findings: Finding[]; restrictions: string | null; notes: string | null; status: string; published_at: string | null; version: number; root_id: string | null; report: MovementReport | null; reviewed_at: string | null; excluded_exercises: string[] };
export function useMovementAssessments(userId?: string) {
  return useQuery({ queryKey: ["movement-assessments", userId], enabled: !!userId, refetchOnWindowFocus: true, refetchInterval: 60000, queryFn: async () => {
    if (!userId) return [];
    const { data, error } = await supabase.from("movement_assessments").select("*").eq("user_id", userId).eq("status", "published").order("assessed_at", { ascending: false }).order("version", { ascending: false });
    if (error) throw error;
    return data as unknown as MovementAssessment[];
  } });
}
export function useMovementMedia(id: string) {
  return useQuery({ queryKey: ["mv-media", id], staleTime: 4 * 60 * 1000, refetchInterval: 4 * 60 * 1000, queryFn: async () => {
    const { data, error } = await supabase.from("movement_assessment_media").select("*").eq("assessment_id", id).order("created_at");
    if (error) throw error;
    return Promise.all((data ?? []).map(async m => {
      const { data: signed, error: signError } = await supabase.storage.from("movement-media").createSignedUrl(m.storage_path, 600);
      if (signError) throw signError;
      return { ...m, url: signed?.signedUrl };
    }));
  } });
}