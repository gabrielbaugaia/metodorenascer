import { supabase } from "@/integrations/supabase/client";

export const BODY_PHOTOS_BUCKET = "body-photos" as const;

export function extractBodyPhotosPath(urlOrPath: string): string {
  if (!urlOrPath) return "";

  // If it's already a path, normalize and return
  if (!urlOrPath.startsWith("http")) {
    return urlOrPath.replace(/^\/+/, "");
  }

  // URLs can be:
  // - .../storage/v1/object/public/body-photos/<path>
  // - .../storage/v1/object/sign/body-photos/<path>?token=...
  // - .../body-photos/<path>?...
  const match = urlOrPath.match(/\/body-photos\/([^?]+)(\?|$)/);
  if (!match?.[1]) return "";

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

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
