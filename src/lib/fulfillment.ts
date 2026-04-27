import type { Product } from './products';
import type { RfqItem } from './rfq';

export type FulfillmentSource = 'domestic' | 'import' | 'split' | 'backorder';

export type FulfillmentPlan = {
  productId: string;
  requested: number;
  fromIndia: number;
  fromIntl: number;
  shortfall: number; // requested - (fromIndia + fromIntl) — negative stock scenario
  source: FulfillmentSource;
};

/**
 * BRD rule:
 *   if India stock >= order qty => fulfill from India
 *   else => fulfill via import (or split if partial India stock exists)
 * Shortfall is reported separately so admin can decide (backorder, partial ship, etc.).
 */
export const planLine = (requested: number, stockIndia: number, stockIntl: number): FulfillmentPlan => {
  const india = Math.max(0, stockIndia);
  const intl = Math.max(0, stockIntl);
  const req = Math.max(0, requested);

  const fromIndia = Math.min(req, india);
  const remaining = req - fromIndia;
  const fromIntl = Math.min(remaining, intl);
  const shortfall = remaining - fromIntl;

  let source: FulfillmentSource;
  if (fromIndia === req) source = 'domestic';
  else if (fromIndia === 0 && fromIntl > 0 && shortfall === 0) source = 'import';
  else if (shortfall > 0 && fromIndia === 0 && fromIntl === 0) source = 'backorder';
  else if (shortfall > 0) source = 'backorder';
  else source = 'split';

  return { productId: '', requested: req, fromIndia, fromIntl, shortfall, source };
};

export const planFulfillment = (items: RfqItem[], products: Product[]): FulfillmentPlan[] => {
  const byId = new Map(products.map((p) => [p.id, p]));
  return items.map((i) => {
    const p = byId.get(i.productId);
    const plan = planLine(i.quantity, p?.stockIndia ?? 0, p?.stockIntl ?? 0);
    return { ...plan, productId: i.productId };
  });
};

export const LOW_STOCK_THRESHOLD = 50;

export const totalStock = (p: Product): number => (p.stockIndia ?? 0) + (p.stockIntl ?? 0);
