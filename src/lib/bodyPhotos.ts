import { supabase } from "@/integrations/supabase/client";

export const BODY_PHOTOS_BUCKET = "body-photos" as const;

/**
 * Extract the file path from a URL or path string for the body-photos bucket.
 * Handles:
 * - Direct paths: "userId/frente-123.jpeg"
 * - Public URLs: ".../storage/v1/object/public/body-photos/userId/frente-123.jpeg"
 * - Signed URLs: ".../storage/v1/object/sign/body-photos/userId/frente-123.jpeg?token=..."
 */
export function extractBodyPhotosPath(urlOrPath: string): string {
  if (!urlOrPath) return "";

  // If it's already a simple path (no http), normalize and return
  if (!urlOrPath.startsWith("http")) {
    return urlOrPath.replace(/^\/+/, "");
  }

  // Try to extract path from URLs - handles both /public/ and /sign/ patterns
  // Pattern: .../body-photos/<path>?... or .../body-photos/<path>
  const match = urlOrPath.match(/\/body-photos\/([^?#]+)/);
  if (!match?.[1]) return "";

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/**
 * Create a signed URL for a file in the body-photos bucket.
 * Accepts either a path or an existing URL (which will be converted to path first).
 */
export async function createBodyPhotosSignedUrl(
  urlOrPath: string,
  expiresInSeconds = 60 * 60 * 24 * 7
): Promise<string> {
  const filePath = extractBodyPhotosPath(urlOrPath);
  if (!filePath) throw new Error("Caminho inválido");

  const { data, error } = await supabase.storage
    .from(BODY_PHOTOS_BUCKET)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw error || new Error("Não foi possível gerar a URL da imagem");
  }

  // Cache busting for UI refresh
  const separator = data.signedUrl.includes("?") ? "&" : "?";
  return `${data.signedUrl}${separator}t=${Date.now()}`;
}
