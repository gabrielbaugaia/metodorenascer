// Configuração central de domínio/marca para as edge functions.
// Origem pública canônica após a migração Renascer -> Gabriel Baú.
export const PUBLIC_APP_URL = "https://app.gabrielbau.com.br";

export const BRAND_NAME = "Gabriel Baú";
export const BRAND_FULL_NAME = "Consultoria Gabriel Baú";

// Domínio verificado no provedor de e-mail (Resend). Mantido por compatibilidade:
// trocar para gabrielbau.com.br exige verificar o domínio de envio antes.
export const EMAIL_SENDER_DOMAIN = "renascerapp.com.br";
export const EMAIL_FROM_NOREPLY = `${BRAND_FULL_NAME} <noreply@${EMAIL_SENDER_DOMAIN}>`;

export function appUrl(path = "/"): string {
  return `${PUBLIC_APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
