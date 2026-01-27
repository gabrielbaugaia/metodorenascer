// Centralized plan type and name constants for the entire application
// Use these constants to ensure consistency across all code paths

export const PLAN_TYPES = {
  ELITE_FUNDADOR: "elite_fundador",
  GRATUITO: "gratuito",
  MENSAL: "mensal",
  TRIMESTRAL: "trimestral",
  SEMESTRAL: "semestral",
  ANUAL: "anual"
} as const;

export const PLAN_NAMES: Record<string, string> = {
  [PLAN_TYPES.ELITE_FUNDADOR]: "ELITE FUNDADOR",
  [PLAN_TYPES.GRATUITO]: "GRATUITO",
  [PLAN_TYPES.MENSAL]: "MENSAL",
  [PLAN_TYPES.TRIMESTRAL]: "TRIMESTRAL",
  [PLAN_TYPES.SEMESTRAL]: "SEMESTRAL",
  [PLAN_TYPES.ANUAL]: "ANUAL"
};

export const PLAN_DURATIONS: Record<string, number> = {
  [PLAN_TYPES.ELITE_FUNDADOR]: 30,
  [PLAN_TYPES.GRATUITO]: 365,
  [PLAN_TYPES.MENSAL]: 30,
  [PLAN_TYPES.TRIMESTRAL]: 90,
  [PLAN_TYPES.SEMESTRAL]: 180,
  [PLAN_TYPES.ANUAL]: 365
};

export const PLAN_PRICES_CENTS: Record<string, number> = {
  [PLAN_TYPES.ELITE_FUNDADOR]: 4990,
  [PLAN_TYPES.GRATUITO]: 0,
  [PLAN_TYPES.MENSAL]: 19700,
  [PLAN_TYPES.TRIMESTRAL]: 49700,
  [PLAN_TYPES.SEMESTRAL]: 69700,
  [PLAN_TYPES.ANUAL]: 99700
};

export const STRIPE_PRICE_IDS: Record<string, string> = {
  [PLAN_TYPES.ELITE_FUNDADOR]: "price_1ScZqTCuFZvf5xFdZuOBMzpt",
  [PLAN_TYPES.MENSAL]: "price_1ScZrECuFZvf5xFdfS9W8kvY",
  [PLAN_TYPES.TRIMESTRAL]: "price_1ScZsTCuFZvf5xFdbW8kJeQF",
  [PLAN_TYPES.SEMESTRAL]: "price_1ScZtrCuFZvf5xFd8iXDfbEp",
  [PLAN_TYPES.ANUAL]: "price_1ScZvCCuFZvf5xFdjrs51JQB"
};

// Free duration options for admin invitation
export const FREE_DURATION_OPTIONS = [
  { value: 7, label: "7 dias" },
  { value: 14, label: "14 dias" },
  { value: 21, label: "21 dias" },
  { value: 30, label: "30 dias" },
  { value: 60, label: "60 dias" },
  { value: 90, label: "90 dias" },
  { value: 120, label: "120 dias" },
  { value: 180, label: "180 dias" },
  { value: 365, label: "1 ano" }
];

// Plan options for UI selects
export const PLAN_OPTIONS_ADMIN = [
  { value: PLAN_TYPES.GRATUITO, label: "Gratuito - R$0,00" },
  { value: PLAN_TYPES.ELITE_FUNDADOR, label: "Elite Fundador - R$49,90/mês" },
  { value: PLAN_TYPES.MENSAL, label: "Mensal - R$197,00/mês" },
  { value: PLAN_TYPES.TRIMESTRAL, label: "Trimestral - R$497,00" },
  { value: PLAN_TYPES.SEMESTRAL, label: "Semestral - R$697,00" },
  { value: PLAN_TYPES.ANUAL, label: "Anual - R$997,00" }
];

// Maximum Embaixador members (now Elite Fundador)
export const MAX_ELITE_FUNDADOR_MEMBERS = 25;

// Helper function to normalize legacy plan types
export function normalizePlanType(planType: string | null | undefined): string {
  if (!planType) return PLAN_TYPES.GRATUITO;
  
  // Map legacy values to standardized ones
  const legacyMapping: Record<string, string> = {
    "embaixador": PLAN_TYPES.ELITE_FUNDADOR,
    "free": PLAN_TYPES.GRATUITO,
    "elite_founder": PLAN_TYPES.ELITE_FUNDADOR,
  };
  
  return legacyMapping[planType.toLowerCase()] || planType;
}

// Helper function to get plan name from type
export function getPlanName(planType: string | null | undefined): string {
  const normalized = normalizePlanType(planType);
  return PLAN_NAMES[normalized] || normalized.toUpperCase();
}

// Helper function to get plan duration
export function getPlanDuration(planType: string | null | undefined): number {
  const normalized = normalizePlanType(planType);
  return PLAN_DURATIONS[normalized] || 30;
}

// Helper function to get plan price in cents
export function getPlanPrice(planType: string | null | undefined): number {
  const normalized = normalizePlanType(planType);
  return PLAN_PRICES_CENTS[normalized] || 0;
}

export type PlanType = typeof PLAN_TYPES[keyof typeof PLAN_TYPES];
