// Estimation settings for the projection engine.
// Persisted in localStorage so the administrator can tune the rates
// per client / niche without touching code. Every rate here is a lever
// used by campaign-estimates.ts.

import { useSyncExternalStore } from "react";

export interface EstimationSettings {
  // Core spec rates (from the official MVP 1.0 document)
  viewsShareOfImpressions: number;   // 0.10 → Views representam 10% das impressões
  engagementRate: number;             // 0.03 → Curtidas + Comentários = 3% das views
  savesRate: number;                  // 0.02 → Salvamentos = 2% das views
  ctrOnImpressions: number;           // 0.015 → Cliques = 1,5% das impressões
  purchaseConversion: number;         // 0.03 → Compras = 3% dos cliques
  upsellRate: number;                 // 0.30 → 30% dos compradores
  crossSellRate: number;              // 0.20 → 20% dos compradores

  // Product economics — used quando o gestor não informa valor médio de upsell/cross
  upsellValueRatio: number;           // 0.5 → upsell = 50% do ticket médio
  crossSellValueRatio: number;        // 0.3 → cross sell = 30% do ticket médio

  // Funnel-only projections (para etapas intermediárias do funil)
  remarketingReachRate: number;       // 0.6 → das views voltam a ser impactadas
  ctaViewRate: number;                // 0.4 → veem CTA reforçado
  offerViewRate: number;              // 0.9 → dos cliques visualizam oferta
  checkoutInitiationRate: number;     // 0.4 → dos cliques iniciam checkout
  recurringCustomerRate: number;      // 0.2 → dos compradores viram recorrentes
}

export const DEFAULT_SETTINGS: EstimationSettings = {
  viewsShareOfImpressions: 0.1,
  engagementRate: 0.03,
  savesRate: 0.02,
  ctrOnImpressions: 0.015,
  purchaseConversion: 0.03,
  upsellRate: 0.3,
  crossSellRate: 0.2,
  upsellValueRatio: 0.5,
  crossSellValueRatio: 0.3,
  remarketingReachRate: 0.6,
  ctaViewRate: 0.4,
  offerViewRate: 0.9,
  checkoutInitiationRate: 0.4,
  recurringCustomerRate: 0.2,
};

const KEY = "pubgrowth.settings.v1";
const listeners = new Set<() => void>();

function read(): EstimationSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<EstimationSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function write(s: EstimationSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

let cache: EstimationSettings | null = null;
function shallowEq(a: EstimationSettings, b: EstimationSettings) {
  const keys = Object.keys(a) as (keyof EstimationSettings)[];
  return keys.every((k) => a[k] === b[k]);
}

export function useEstimationSettings(): EstimationSettings {
  return useSyncExternalStore(
    subscribe,
    () => {
      const next = read();
      if (cache && shallowEq(cache, next)) return cache;
      cache = next;
      return cache;
    },
    () => DEFAULT_SETTINGS,
  );
}

export function getEstimationSettings(): EstimationSettings {
  return read();
}

export function saveEstimationSettings(s: EstimationSettings) {
  write(s);
}

export function resetEstimationSettings() {
  write(DEFAULT_SETTINGS);
}
