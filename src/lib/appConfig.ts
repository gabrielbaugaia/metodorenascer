/**
 * Origem pública canônica da Consultoria Gabriel Baú.
 * Use rotas relativas para navegação interna; este valor serve apenas
 * para links absolutos (e-mails, compartilhamento, metadados, PDFs).
 */
export const PUBLIC_APP_URL = "https://app.gabrielbau.com.br";

export const BRAND_NAME = "Gabriel Baú";
export const BRAND_FULL_NAME = "Consultoria Gabriel Baú";

/** Monta uma URL absoluta pública a partir de um caminho interno. */
export function absoluteUrl(path = "/"): string {
  return `${PUBLIC_APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
