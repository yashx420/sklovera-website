// Live FX rates. Fetches ECB reference rates (via Frankfurter, free + no key,
// CORS-enabled) and keeps the pricing engine's EUR→INR rate current. Also
// stores USD→EUR for any dollar-priced sources. Falls back silently to the
// last known / configured rate when offline or blocked.
import { loadPricingConfig, savePricingConfig } from './pricing';

const KEY = 'sklovera.fx.v1';
const MAX_AGE_MS = 6 * 60 * 60 * 1000; // ECB updates daily; 6h is plenty fresh
const DEFAULT_USD_TO_EUR = 0.92;

type FxCache = { ts: number; eurToInr: number; usdToEur?: number };

const readCache = (): FxCache | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null') as FxCache | null;
  } catch {
    return null;
  }
};

/** EUR per 1 USD, from the latest fetched rates (default ~0.92 if unknown). */
export const getUsdToEur = (): number => readCache()?.usdToEur ?? DEFAULT_USD_TO_EUR;

/**
 * Refresh live rates at most once per MAX_AGE_MS. On success, patches the
 * pricing config's fxEurToInr and notifies the app so prices re-render.
 */
export const refreshFxRates = async (): Promise<void> => {
  try {
    const cached = readCache();
    if (cached && Date.now() - cached.ts < MAX_AGE_MS) return;

    const res = await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=INR,USD');
    if (!res.ok) return;
    const data = (await res.json()) as { rates?: { INR?: number; USD?: number } };
    const inr = data.rates?.INR;
    const usd = data.rates?.USD;
    if (!inr || inr <= 0) return;

    localStorage.setItem(
      KEY,
      JSON.stringify({ ts: Date.now(), eurToInr: inr, usdToEur: usd ? 1 / usd : undefined } satisfies FxCache),
    );

    const cfg = loadPricingConfig();
    const rounded = Math.round(inr * 100) / 100;
    if (rounded !== cfg.fxEurToInr) {
      savePricingConfig({ ...cfg, fxEurToInr: rounded });
      // Nudge price-showing views to recompute.
      window.dispatchEvent(new CustomEvent('sklovera:products-updated'));
    }
  } catch {
    /* offline or blocked — keep the last known rate */
  }
};
