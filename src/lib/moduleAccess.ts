// Centralized module access control system
// Defines module types, access levels, and utilities

export type ModuleName = 
  | 'treino' 
  | 'nutricao' 
  | 'mindset' 
  | 'receitas' 
  | 'dashboard' 
  | 'checkins' 
  | 'suporte' 
  | 'protocolos';

export type AccessLevel = 'full' | 'limited' | 'none';

export interface ModuleLimits {
  // Treino limits
  max_workouts_visible?: number;
  allow_pdf_download?: boolean;
  allow_history?: boolean;
  
  // Nutricao limits
  max_meals_visible?: number;
  show_full_plan?: boolean;
  
  // Mindset limits
  max_modules_visible?: number;
  
  // Receitas limits
  max_recipes_per_day?: number;
  total_recipes_allowed?: number;
}

export interface ModuleAccess {
  level: AccessLevel;
  limits: ModuleLimits;
  usageCount?: number;
  expiresAt?: string | null;
  isTrialing?: boolean;
  trialDaysLeft?: number;
}

export interface ModulesAccessMap {
  treino: AccessLevel;
  nutricao: AccessLevel;
  mindset: AccessLevel;
  receitas: AccessLevel;
  dashboard: AccessLevel;
  checkins: AccessLevel;
  suporte: AccessLevel;
  protocolos?: AccessLevel;
}

// Modules that are always accessible
export const ALWAYS_ACCESSIBLE_MODULES: ModuleName[] = ['dashboard', 'checkins', 'suporte'];

// Module display names
export const MODULE_DISPLAY_NAMES: Record<ModuleName, string> = {
  treino: 'Treino',
  nutricao: 'Nutrição',
  mindset: 'Mindset',
  receitas: 'Receitas',
  dashboard: 'Dashboard',
  checkins: 'Check-ins',
  suporte: 'Suporte',
  protocolos: 'Protocolos'
};

// Module icons (lucide icon names)
export const MODULE_ICONS: Record<ModuleName, string> = {
  treino: 'Dumbbell',
  nutricao: 'Utensils',
  mindset: 'Brain',
  receitas: 'ChefHat',
  dashboard: 'LayoutDashboard',
  checkins: 'ClipboardCheck',
  suporte: 'MessageCircle',
  protocolos: 'FileText'
};

// Default trial limits configuration
export const DEFAULT_TRIAL_LIMITS: Record<ModuleName, ModuleLimits> = {
  treino: {
    max_workouts_visible: 1,
    allow_pdf_download: false,
    allow_history: false
  },
  nutricao: {
    max_meals_visible: 2,
    show_full_plan: false,
    allow_pdf_download: false
  },
  mindset: {
    max_modules_visible: 1
  },
  receitas: {
    max_recipes_per_day: 1,
    total_recipes_allowed: 3
  },
  dashboard: {},
  checkins: {},
  suporte: {},
  protocolos: {}
};

/**
 * Check if a module is always accessible (no restrictions)
 */
export function isAlwaysAccessible(module: ModuleName): boolean {
  return ALWAYS_ACCESSIBLE_MODULES.includes(module);
}

/**
 * Check if user has full access to a module
 */
export function hasFullAccess(access: ModuleAccess | null): boolean {
  return access?.level === 'full';
}

/**
 * Check if user has any access (full or limited) to a module
 */
export function hasAnyAccess(access: ModuleAccess | null): boolean {
  return access?.level === 'full' || access?.level === 'limited';
}

/**
 * Check if user is within usage limits for a module
 */
export function isWithinLimits(access: ModuleAccess | null, usageType: keyof ModuleLimits): boolean {
  if (!access || access.level === 'full') return true;
  if (access.level === 'none') return false;
  
  const limit = access.limits[usageType];
  const usage = access.usageCount ?? 0;
  
  if (typeof limit === 'number') {
    return usage < limit;
  }
  
  return true;
}

/**
 * Calculate trial days remaining
 */
export function calculateTrialDaysLeft(expiresAt: string | null | undefined): number {
  if (!expiresAt) return 0;
  
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffTime = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Get access level from commercial plan
 */
export function getAccessFromPlan(
  modulesAccess: ModulesAccessMap | null | undefined, 
  module: ModuleName
): AccessLevel {
  if (!modulesAccess) return 'none';
  return (modulesAccess[module] as AccessLevel) || 'none';
}

/**
 * Format price in cents to BRL
 */
export function formatPriceBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100);
}
