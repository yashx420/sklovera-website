import type { Product } from './products';
import type { QuoteBreakdown, Tier } from './pricing';

export type RfqStatus =
  | 'submitted'
  | 'in_review'
  | 'quoted'
  | 'accepted'
  | 'declined'
  | 'closed';

export type RfqItem = {
  productId: string;
  sku: string;
  name: string;
  collection?: string;
  imageKey?: string;
  priceEurRef?: number; // reference at time of submission, not the quote
  quantity: number;
};

export type Rfq = {
  id: string;
  status: RfqStatus;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  items: RfqItem[];
  shipCountry: string;
  shipCity?: string;
  targetDate?: string; // ISO yyyy-mm-dd
  notes?: string;
  createdAt: number;
  updatedAt: number;
  adminNote?: string;
  quoteTotalEur?: number;
  quoteTotalInr?: number;
  quoteBreakdown?: QuoteBreakdown;
  quoteTier?: Tier;
};

const CART_KEY = 'sklovera.rfq.cart.v1';
const RFQ_KEY = 'sklovera.rfq.list.v1';
const CART_EVT = 'sklovera:rfq-cart-updated';
const RFQ_EVT = 'sklovera:rfq-list-updated';

// ---------- Cart (unsubmitted) ----------

export type CartEntry = { productId: string; quantity: number };

export const loadCart = (): CartEntry[] => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartEntry[]) : [];
  } catch {
    return [];
  }
};

const saveCart = (entries: CartEntry[]): void => {
  localStorage.setItem(CART_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent(CART_EVT));
};

export const addToCart = (productId: string, quantity = 1): void => {
  const entries = loadCart();
  const existing = entries.find((e) => e.productId === productId);
  if (existing) existing.quantity += quantity;
  else entries.push({ productId, quantity });
  saveCart(entries);
};

export const updateCartQty = (productId: string, quantity: number): void => {
  if (quantity <= 0) return removeFromCart(productId);
  const entries = loadCart().map((e) => (e.productId === productId ? { ...e, quantity } : e));
  saveCart(entries);
};

export const removeFromCart = (productId: string): void => {
  saveCart(loadCart().filter((e) => e.productId !== productId));
};

export const clearCart = (): void => saveCart([]);

export const onCartChange = (cb: () => void): (() => void) => {
  window.addEventListener(CART_EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(CART_EVT, cb);
    window.removeEventListener('storage', cb);
  };
};

// ---------- RFQs (submitted) ----------

export const loadRfqs = (): Rfq[] => {
  try {
    const raw = localStorage.getItem(RFQ_KEY);
    return raw ? (JSON.parse(raw) as Rfq[]) : [];
  } catch {
    return [];
  }
};

const saveRfqs = (list: Rfq[]): void => {
  localStorage.setItem(RFQ_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(RFQ_EVT));
};

export const onRfqChange = (cb: () => void): (() => void) => {
  window.addEventListener(RFQ_EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(RFQ_EVT, cb);
    window.removeEventListener('storage', cb);
  };
};

export type SubmitRfqInput = {
  items: RfqItem[];
  buyer: { id: string; email: string; name: string };
  shipCountry: string;
  shipCity?: string;
  targetDate?: string;
  notes?: string;
};

export const submitRfq = (input: SubmitRfqInput): Rfq => {
  const now = Date.now();
  const rfq: Rfq = {
    id: `RFQ-${now.toString(36).toUpperCase()}`,
    status: 'submitted',
    buyerId: input.buyer.id,
    buyerEmail: input.buyer.email,
    buyerName: input.buyer.name,
    items: input.items,
    shipCountry: input.shipCountry,
    shipCity: input.shipCity,
    targetDate: input.targetDate,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  saveRfqs([rfq, ...loadRfqs()]);
  clearCart();
  return rfq;
};

export const updateRfqStatus = (
  id: string,
  status: RfqStatus,
  patch?: {
    adminNote?: string;
    quoteTotalEur?: number;
    quoteTotalInr?: number;
    quoteBreakdown?: QuoteBreakdown;
    quoteTier?: Tier;
  },
): void => {
  const list = loadRfqs().map((r) =>
    r.id === id
      ? {
          ...r,
          status,
          adminNote: patch?.adminNote ?? r.adminNote,
          quoteTotalEur: patch?.quoteTotalEur ?? r.quoteTotalEur,
          quoteTotalInr: patch?.quoteTotalInr ?? r.quoteTotalInr,
          quoteBreakdown: patch?.quoteBreakdown ?? r.quoteBreakdown,
          quoteTier: patch?.quoteTier ?? r.quoteTier,
          updatedAt: Date.now(),
        }
      : r,
  );
  saveRfqs(list);
};

// ---------- Hydration helper ----------

export const hydrateCart = (entries: CartEntry[], products: Product[]): RfqItem[] => {
  const byId = new Map(products.map((p) => [p.id, p]));
  const items: RfqItem[] = [];
  for (const e of entries) {
    const p = byId.get(e.productId);
    if (!p) continue;
    items.push({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      collection: p.collection,
      imageKey: p.imageKey,
      priceEurRef: p.priceEur,
      quantity: e.quantity,
    });
  }
  return items;
};
