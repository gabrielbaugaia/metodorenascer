// Centralized price ID to plan type mappings
// Used by check-subscription, create-checkout, and stripe-webhook

export const PRICE_TO_PLAN: Record<string, { type: string; name: string }> = {
  "price_1ScZqTCuFZvf5xFdZuOBMzpt": { type: "embaixador", name: "ELITE Fundador" },
  "price_1ScZrECuFZvf5xFdfS9W8kvY": { type: "mensal", name: "Mensal" },
  "price_1ScZsTCuFZvf5xFdbW8kJeQF": { type: "trimestral", name: "Trimestral" },
  "price_1ScZtrCuFZvf5xFd8iXDfbEp": { type: "semestral", name: "Semestral" },
  "price_1ScZvCCuFZvf5xFdjrs51JQB": { type: "anual", name: "Anual" },
};

// Map price to MRR value in cents (normalized to monthly)
export const PRICE_TO_MRR: Record<string, number> = {
  "price_1ScZqTCuFZvf5xFdZuOBMzpt": 4990,      // R$49,90/mês
  "price_1ScZrECuFZvf5xFdfS9W8kvY": 19700,     // R$197/mês
  "price_1ScZsTCuFZvf5xFdbW8kJeQF": 16567,     // R$497/3 = ~R$165,67/mês
  "price_1ScZtrCuFZvf5xFd8iXDfbEp": 11617,     // R$697/6 = ~R$116,17/mês
  "price_1ScZvCCuFZvf5xFdjrs51JQB": 8308,      // R$997/12 = ~R$83,08/mês
};

// Price IDs for validation
export const VALID_PRICE_IDS = Object.keys(PRICE_TO_PLAN);

// Embaixador plan ID
export const EMBAIXADOR_PRICE_ID = "price_1ScZqTCuFZvf5xFdZuOBMzpt";

// Maximum number of Embaixador subscribers
export const MAX_EMBAIXADOR_MEMBERS = 25;

// Helper to get plan info from price ID
export function getPlanFromPriceId(priceId: string): { type: string; name: string } | null {
  return PRICE_TO_PLAN[priceId] || null;
}

// Helper to get MRR from price ID
export function getMrrFromPriceId(priceId: string): number | null {
  return PRICE_TO_MRR[priceId] || null;
}
