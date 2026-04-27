import type { RfqItem } from './rfq';
import type { Role } from './auth';
import type { FulfillmentPlan } from './fulfillment';

export type Tier = 'b2b' | 'retail' | 'b2c';

export type VolumeBreak = { minUnits: number; discountPct: number };

export type PricingConfig = {
  fxEurToInr: number;       // 1 EUR = X INR
  freightPct: number;       // applied to EXW
  dutyPct: number;          // applied to EXW + freight
  handlingPct: number;      // applied to EXW + freight + duty
  margin: Record<Tier, number>; // fraction, e.g. 0.15 = 15% on landed
  volumeBreaks: VolumeBreak[];  // sorted ascending by minUnits
};

export const DEFAULT_CONFIG: PricingConfig = {
  fxEurToInr: 92.5,
  freightPct: 0.08,
  dutyPct: 0.1,
  handlingPct: 0.03,
  margin: { b2b: 0.18, retail: 0.32, b2c: 0.55 },
  volumeBreaks: [
    { minUnits: 0, discountPct: 0 },
    { minUnits: 500, discountPct: 0.03 },
    { minUnits: 2000, discountPct: 0.06 },
    { minUnits: 5000, discountPct: 0.09 },
  ],
};

const KEY = 'sklovera.pricing.v1';
const EVT = 'sklovera:pricing-updated';

export const loadPricingConfig = (): PricingConfig => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<PricingConfig>;
    return { ...DEFAULT_CONFIG, ...parsed, margin: { ...DEFAULT_CONFIG.margin, ...(parsed.margin ?? {}) } };
  } catch {
    return DEFAULT_CONFIG;
  }
};

export const savePricingConfig = (cfg: PricingConfig): void => {
  localStorage.setItem(KEY, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent(EVT));
};

export const onPricingChange = (cb: () => void): (() => void) => {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
};

export const tierFromRole = (role: Role): Tier => {
  if (role === 'b2b') return 'b2b';
  if (role === 'retail') return 'retail';
  return 'b2c';
};

const volumeDiscount = (breaks: VolumeBreak[], units: number): VolumeBreak => {
  const sorted = [...breaks].sort((a, b) => a.minUnits - b.minUnits);
  let best: VolumeBreak = { minUnits: 0, discountPct: 0 };
  for (const b of sorted) if (units >= b.minUnits) best = b;
  return best;
};

export type LineBreakdown = {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  fromIndia: number;
  fromIntl: number;
  shortfall: number;
  exwEur: number;                 // supplier EXW (reference)
  landedEur: number;              // after freight + duty + handling
  marginedEur: number;            // landed * (1 + margin)
  discountPct: number;
  unitFinalEur: number;
  unitFinalInr: number;
  lineFinalEur: number;
  lineFinalInr: number;
};

export type QuoteBreakdown = {
  tier: Tier;
  totalUnits: number;
  totalUnitsIndia: number;
  totalUnitsIntl: number;
  volumeBreak: VolumeBreak;
  lines: LineBreakdown[];
  subtotalExwEur: number;
  freightEur: number;
  dutyEur: number;
  handlingEur: number;
  landedSubtotalEur: number;
  marginEur: number;
  discountEur: number;
  totalEur: number;
  totalInr: number;
  fxEurToInr: number;
  computedAt: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Storefront unit price for a single SKU at a given tier.
 * Assumes worst-case (imported) landed cost, no volume discount.
 * Actual cart total is re-computed with the real fulfillment split at checkout.
 */
export const computeUnitPrice = (
  exwEur: number | undefined,
  tier: Tier,
  cfg: PricingConfig = loadPricingConfig(),
): { eur: number; inr: number } => {
  const exw = exwEur ?? 0;
  const freight = exw * cfg.freightPct;
  const duty = (exw + freight) * cfg.dutyPct;
  const handling = (exw + freight + duty) * cfg.handlingPct;
  const landed = exw + freight + duty + handling;
  const margined = landed * (1 + (cfg.margin[tier] ?? 0));
  return { eur: round2(margined), inr: round2(margined * cfg.fxEurToInr) };
};

export const computeQuote = (
  items: RfqItem[],
  tier: Tier,
  cfg: PricingConfig = loadPricingConfig(),
  plans?: FulfillmentPlan[],
): QuoteBreakdown => {
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
  const vb = volumeDiscount(cfg.volumeBreaks, totalUnits);
  const margin = cfg.margin[tier] ?? 0;
  const planById = new Map((plans ?? []).map((p) => [p.productId, p]));

  let subtotalExwEur = 0;
  let freightEur = 0;
  let dutyEur = 0;
  let handlingEur = 0;
  let landedSubtotalEur = 0;
  let marginEur = 0;
  let discountEur = 0;
  let totalEur = 0;
  let fulfilledUnitsIndia = 0;
  let fulfilledUnitsIntl = 0;

  const lines: LineBreakdown[] = items.map((i) => {
    const plan = planById.get(i.productId);
    // Default (no plan given): treat everything as import — matches pre-Part-6 behavior.
    const fromIndia = plan?.fromIndia ?? 0;
    const fromIntl = plan?.fromIntl ?? (i.quantity - fromIndia);
    const shortfall = plan?.shortfall ?? 0;
    const billableQty = fromIndia + fromIntl;
    const importShare = billableQty > 0 ? fromIntl / billableQty : 0;
    fulfilledUnitsIndia += fromIndia;
    fulfilledUnitsIntl += fromIntl;

    const exw = i.priceEurRef ?? 0;
    const lineExw = exw * billableQty;
    // Freight + duty apply only to the imported portion.
    const importExw = exw * fromIntl;
    const lineFreight = importExw * cfg.freightPct;
    const lineDuty = (importExw + lineFreight) * cfg.dutyPct;
    // Handling applied on whole landed subtotal (domestic + imported, post-freight/duty).
    const lineHandlingBase = lineExw + lineFreight + lineDuty;
    const lineHandling = lineHandlingBase * cfg.handlingPct;
    const lineLanded = lineHandlingBase + lineHandling;
    const lineMargined = lineLanded * (1 + margin);
    const lineDiscount = lineMargined * vb.discountPct;
    const lineFinal = lineMargined - lineDiscount;
    const unitFinal = billableQty > 0 ? lineFinal / billableQty : 0;
    void importShare;

    subtotalExwEur += lineExw;
    freightEur += lineFreight;
    dutyEur += lineDuty;
    handlingEur += lineHandling;
    landedSubtotalEur += lineLanded;
    marginEur += lineMargined - lineLanded;
    discountEur += lineDiscount;
    totalEur += lineFinal;

    return {
      productId: i.productId,
      sku: i.sku,
      name: i.name,
      quantity: i.quantity,
      fromIndia,
      fromIntl,
      shortfall,
      exwEur: round2(exw),
      landedEur: round2(lineLanded),
      marginedEur: round2(lineMargined),
      discountPct: vb.discountPct,
      unitFinalEur: round2(unitFinal),
      unitFinalInr: round2(unitFinal * cfg.fxEurToInr),
      lineFinalEur: round2(lineFinal),
      lineFinalInr: round2(lineFinal * cfg.fxEurToInr),
    };
  });

  return {
    tier,
    totalUnits,
    totalUnitsIndia: fulfilledUnitsIndia,
    totalUnitsIntl: fulfilledUnitsIntl,
    volumeBreak: vb,
    lines,
    subtotalExwEur: round2(subtotalExwEur),
    freightEur: round2(freightEur),
    dutyEur: round2(dutyEur),
    handlingEur: round2(handlingEur),
    landedSubtotalEur: round2(landedSubtotalEur),
    marginEur: round2(marginEur),
    discountEur: round2(discountEur),
    totalEur: round2(totalEur),
    totalInr: round2(totalEur * cfg.fxEurToInr),
    fxEurToInr: cfg.fxEurToInr,
    computedAt: Date.now(),
  };
};
