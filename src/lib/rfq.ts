import type { Product } from './products';
import type { QuoteBreakdown, Tier } from './pricing';

export type RfqStatus =
  | 'submitted'       // buyer submitted; awaiting admin
  | 'in_review'       // admin looking at it
  | 'vendor_review'   // admin sent a quote to the vendor; awaiting vendor
  | 'vendor_countered'// vendor countered; awaiting admin
  | 'vendor_approved' // all vendors approved; awaiting admin's final send to buyer
  | 'quoted'          // admin sent the approved quote to the buyer
  | 'accepted'
  | 'declined'
  | 'closed';

// One entry in the admin↔vendor counter-quote negotiation.
export type QuoteParty = 'admin' | 'vendor';
export type QuoteProposal = {
  by: QuoteParty;
  byName?: string;
  totalEur: number;
  note?: string;
  approved?: boolean; // set on the vendor's final approval
  at: number;
};

// A per-vendor slice of an RFQ. Each vendor negotiates only their own line
// items; the RFQ finalizes to the buyer once every segment is approved.
export type VendorSegmentStatus = 'pending' | 'vendor_review' | 'vendor_countered' | 'approved';
export type VendorSegment = {
  vendorId: string;
  vendorName: string;
  productIds: string[];       // RFQ line items owned by this vendor
  status: VendorSegmentStatus;
  currentTotalEur?: number;   // standing proposed total for this vendor's lines
  thread: QuoteProposal[];
};

export type RfqItem = {
  productId: string;
  sku: string;
  name: string;
  collection?: string;
  imageKey?: string;
  priceEurRef?: number; // reference at time of submission, not the quote
  pcsPerPallet?: number;
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
  vendorId?: string;              // vendor the negotiation is routed to
  vendorThread?: QuoteProposal[]; // admin↔vendor counter-quote history
  segments?: VendorSegment[];     // per-vendor negotiation slices
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

// ---------- Vendor counter-quote negotiation ----------

const patchRfq = (id: string, fn: (r: Rfq) => Rfq): void => {
  saveRfqs(loadRfqs().map((r) => (r.id === id ? fn(r) : r)));
};

export type VendorGroup = { vendorId: string; vendorName: string; productIds: string[] };

/** Initialize per-vendor segments from the RFQ's line-item ownership (idempotent). */
export const ensureSegments = (id: string, groups: VendorGroup[]): void => {
  patchRfq(id, (r) => {
    if (r.segments && r.segments.length) return r;
    const segments: VendorSegment[] = groups.map((g) => ({
      vendorId: g.vendorId,
      vendorName: g.vendorName,
      productIds: g.productIds,
      status: 'pending',
      thread: [],
    }));
    return { ...r, segments, status: r.status === 'submitted' ? 'in_review' : r.status, updatedAt: now() };
  });
};

const now = () => Date.now();

const patchSegment = (
  id: string,
  vendorId: string,
  fn: (s: VendorSegment) => VendorSegment,
  afterAll?: (r: Rfq) => Rfq,
): void => {
  patchRfq(id, (r) => {
    const segments = (r.segments ?? []).map((s) => (s.vendorId === vendorId ? fn(s) : s));
    const next: Rfq = { ...r, segments, updatedAt: now() };
    return afterAll ? afterAll(next) : next;
  });
};

/** Admin sends a proposed quote to one vendor for approval (or re-counters). */
export const segmentSendToVendor = (
  id: string,
  vendorId: string,
  input: { totalEur: number; note?: string; byName?: string },
): void => {
  patchSegment(id, vendorId, (s) => ({
    ...s,
    status: 'vendor_review',
    currentTotalEur: input.totalEur,
    thread: [...s.thread, { by: 'admin', byName: input.byName, totalEur: input.totalEur, note: input.note, at: now() }],
  }));
};

/** Vendor counters the admin's proposal for their own segment. */
export const segmentVendorCounter = (
  id: string,
  vendorId: string,
  input: { totalEur: number; note?: string; byName?: string },
): void => {
  patchSegment(id, vendorId, (s) => ({
    ...s,
    status: 'vendor_countered',
    currentTotalEur: input.totalEur,
    thread: [...s.thread, { by: 'vendor', byName: input.byName, totalEur: input.totalEur, note: input.note, at: now() }],
  }));
};

/**
 * Vendor approves their segment. Once every segment is approved, the RFQ is
 * finalized and the combined quote is sent to the buyer (status → quoted).
 */
export const segmentVendorApprove = (
  id: string,
  vendorId: string,
  input: { byName?: string; note?: string; fxEurToInr: number },
): void => {
  patchSegment(
    id,
    vendorId,
    (s) => ({
      ...s,
      status: 'approved',
      thread: [...s.thread, { by: 'vendor', byName: input.byName, totalEur: s.currentTotalEur ?? 0, note: input.note, approved: true, at: now() }],
    }),
    (r) => {
      const segs = r.segments ?? [];
      if (!segs.length || !segs.every((s) => s.status === 'approved')) return r;
      // All vendors approved — hold for the admin to make the final call and
      // send the combined quote to the buyer.
      const total = segs.reduce((sum, s) => sum + (s.currentTotalEur ?? 0), 0);
      return {
        ...r,
        status: 'vendor_approved',
        quoteTotalEur: Math.round(total * 100) / 100,
        quoteTotalInr: Math.round(total * input.fxEurToInr * 100) / 100,
      };
    },
  );
};

/** Admin's final approval — sends the vendor-approved quote to the buyer. */
export const sendQuoteToBuyer = (id: string, note?: string): void => {
  patchRfq(id, (r) => ({ ...r, status: 'quoted', adminNote: note ?? r.adminNote, updatedAt: now() }));
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
      pcsPerPallet: p.pcsPerPallet,
      quantity: e.quantity,
    });
  }
  return items;
};
