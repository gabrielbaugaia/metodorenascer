import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PhotoPosition } from "@/lib/physicalAssessment";

export const ASSESSMENT_BUCKET = "assessment-photos";

export interface AssessmentRow {
  id: string;
  user_id: string;
  root_id: string | null;
  version: number;
  supersedes_id: string | null;
  status: "draft" | "published" | "unpublished" | "superseded";
  assessed_at: string;
  birth_date: string | null;
  age_years: number | null;
  sex: "male" | "female" | null;
  weight_kg: number | null;
  height_cm: number | null;
  skinfolds: Record<string, number>;
  circumferences: Record<string, number>;
  results: {
    skinfold_sum: number; density: number; body_fat_pct: number; fat_mass_kg: number;
    lean_mass_kg: number; bmi: number; whr: number | null; whtr: number | null; method: string; version: string;
  } | null;
  calc_method: string | null;
  calc_version: string | null;
  notes: string | null;
  recommendations: string | null;
  correction_reason: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  published_by: string | null;
}

export interface AssessmentPhoto {
  id: string;
  assessment_id: string;
  position: PhotoPosition;
  storage_path: string;
  url?: string;
}

export const assessmentKeys = {
  list: (userId: string, scope: "admin" | "student") => ["physical-assessments", scope, userId] as const,
  photos: (assessmentId: string) => ["physical-assessment-photos", assessmentId] as const,
};

/** Admin vê todas as versões; aluno recebe apenas publicadas (garantido também por RLS). */
export function useAssessments(userId: string | undefined, scope: "admin" | "student") {
  return useQuery({
    queryKey: assessmentKeys.list(userId ?? "", scope),
    enabled: !!userId,
    refetchOnWindowFocus: true,
    refetchInterval: scope === "student" ? 60_000 : false,
    queryFn: async () => {
      let q = (supabase as any)
        .from("physical_assessments")
        .select("*")
        .eq("user_id", userId)
        .order("assessed_at", { ascending: true })
        .order("version", { ascending: true });
      if (scope === "student") q = q.eq("status", "published");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AssessmentRow[];
    },
  });
}

export async function fetchPhotos(assessmentId: string): Promise<AssessmentPhoto[]> {
  const { data, error } = await (supabase as any)
    .from("physical_assessment_photos")
    .select("id, assessment_id, position, storage_path")
    .eq("assessment_id", assessmentId);
  if (error) throw error;
  const rows = (data ?? []) as AssessmentPhoto[];
  if (!rows.length) return rows;
  const { data: signed } = await supabase.storage
    .from(ASSESSMENT_BUCKET)
    .createSignedUrls(rows.map((r) => r.storage_path), 60 * 30);
  return rows.map((r) => ({ ...r, url: signed?.find((s) => s.path === r.storage_path)?.signedUrl ?? undefined }));
}

export function useAssessmentPhotos(assessmentId: string | undefined) {
  return useQuery({
    queryKey: assessmentKeys.photos(assessmentId ?? ""),
    enabled: !!assessmentId,
    staleTime: 20 * 60_000,
    queryFn: () => fetchPhotos(assessmentId!),
  });
}
