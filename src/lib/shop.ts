import type { Product } from './products';
import { loadProducts, saveProducts } from './products';
import { planLine, type FulfillmentPlan } from './fulfillment';
import { computeQuote, loadPricingConfig, tierFromRole, type QuoteBreakdown, type Tier } from './pricing';
import type { Role, User } from './auth';

// ---------- Shop cart (B2C direct purchase) ----------

export type BagEntry = { productId: string; quantity: number };

const BAG_KEY = 'sklovera.shop.bag.v1';
const BAG_EVT = 'sklovera:shop-bag-updated';
const ORDERS_KEY = 'sklovera.shop.orders.v1';
const ORDERS_EVT = 'sklovera:shop-orders-updated';

export const loadBag = (): BagEntry[] => {
  try {
    const raw = localStorage.getItem(BAG_KEY);
    return raw ? (JSON.parse(raw) as BagEntry[]) : [];
  } catch {
    return [];
  }
};

const saveBag = (entries: BagEntry[]) => {
  localStorage.setItem(BAG_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent(BAG_EVT));
};

export const addToBag = (productId: string, quantity = 1) => {
  const entries = loadBag();
  const existing = entries.find((e) => e.productId === productId);
  if (existing) existing.quantity += quantity;
  else entries.push({ productId, quantity });
  saveBag(entries);
};

export const updateBagQty = (productId: string, quantity: number) => {
  if (quantity <= 0) return removeFromBag(productId);
  saveBag(loadBag().map((e) => (e.productId === productId ? { ...e, quantity } : e)));
};

export const removeFromBag = (productId: string) => {
  saveBag(loadBag().filter((e) => e.productId !== productId));
};

export const clearBag = () => saveBag([]);

export const onBagChange = (cb: () => void): (() => void) => {
  window.addEventListener(BAG_EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(BAG_EVT, cb);
    window.removeEventListener('storage', cb);
  };
};

// ---------- Orders ----------

export type OrderStatus = 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentGateway = 'razorpay' | 'stripe';

export type OrderLine = {
  productId: string;
  sku: string;
  name: string;
  imageKey?: string;
  collection?: string;
  quantity: number;
  fromIndia: number;
  fromIntl: number;
  unitFinalInr: number;
  lineFinalInr: number;
};

export type Order = {
  id: string;
  status: OrderStatus;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  tier: Tier;
  lines: OrderLine[];
  plans: FulfillmentPlan[];
  quote: QuoteBreakdown;
  shipping: {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal: string;
    country: string;
  };
  payment: {
    gateway: PaymentGateway;
    transactionId: string;
    amountInr: number;
    paidAt: number;
  };
  createdAt: number;
  updatedAt: number;
};

export const loadOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
};

const saveOrders = (list: Order[]) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(ORDERS_EVT));
};

export const onOrdersChange = (cb: () => void): (() => void) => {
  window.addEventListener(ORDERS_EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(ORDERS_EVT, cb);
    window.removeEventListener('storage', cb);
  };
};

export const updateOrderStatus = (id: string, status: OrderStatus) => {
  saveOrders(
    loadOrders().map((o) => (o.id === id ? { ...o, status, updatedAt: Date.now() } : o)),
  );
};

// ---------- Hydration + pricing for the bag ----------

export type HydratedBagItem = {
  productId: string;
  sku: string;
  name: string;
  imageKey?: string;
  collection?: string;
  quantity: number;
  priceEurRef?: number;
  inStock: number;
};

export const hydrateBag = (entries: BagEntry[], products: Product[]): HydratedBagItem[] => {
  const byId = new Map(products.map((p) => [p.id, p]));
  const items: HydratedBagItem[] = [];
  for (const e of entries) {
    const p = byId.get(e.productId);
    if (!p) continue;
    items.push({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      imageKey: p.imageKey,
      collection: p.collection,
      quantity: e.quantity,
      priceEurRef: p.priceEur,
      inStock: (p.stockIndia ?? 0) + (p.stockIntl ?? 0),
    });
  }
  return items;
};

export const bagToQuoteInput = (items: HydratedBagItem[]) =>
  items.map((i) => ({
    productId: i.productId,
    sku: i.sku,
    name: i.name,
    collection: i.collection,
    imageKey: i.imageKey,
    priceEurRef: i.priceEurRef,
    quantity: i.quantity,
  }));

// ---------- Order placement ----------

export type PlaceOrderInput = {
  user: User;
  bag: HydratedBagItem[];
  shipping: Order['shipping'];
  gateway: PaymentGateway;
  transactionId: string;
};

/**
 * Decrements India stock first, then international (matching planLine).
 * Products with insufficient total stock are still accepted but create backorder lines —
 * admin can cancel or partial-ship from the order queue.
 */
export const placeOrder = (input: PlaceOrderInput): Order => {
  const { user, bag, shipping, gateway, transactionId } = input;
  const products = loadProducts();
  const byId = new Map(products.map((p) => [p.id, p]));

  const plans: FulfillmentPlan[] = [];
  const orderLines: OrderLine[] = [];
  const quoteItems = bagToQuoteInput(bag);

  // Deduct stock (India first, then intl) and build per-line fulfillment plans.
  for (const item of bag) {
    const p = byId.get(item.productId);
    if (!p) continue;
    const plan = planLine(item.quantity, p.stockIndia ?? 0, p.stockIntl ?? 0);
    plan.productId = item.productId;
    plans.push(plan);
    p.stockIndia = Math.max(0, (p.stockIndia ?? 0) - plan.fromIndia);
    p.stockIntl = Math.max(0, (p.stockIntl ?? 0) - plan.fromIntl);
  }

  const tier: Tier = tierFromRole(user.role);
  const quote = computeQuote(quoteItems, tier, loadPricingConfig(), plans);

  // Zip quote.lines with plans for persisted order lines.
  const planById = new Map(plans.map((p) => [p.productId, p]));
  for (const line of quote.lines) {
    const plan = planById.get(line.productId);
    const item = bag.find((b) => b.productId === line.productId);
    if (!item) continue;
    orderLines.push({
      productId: line.productId,
      sku: line.sku,
      name: line.name,
      imageKey: item.imageKey,
      collection: item.collection,
      quantity: line.quantity,
      fromIndia: plan?.fromIndia ?? 0,
      fromIntl: plan?.fromIntl ?? 0,
      unitFinalInr: line.unitFinalInr,
      lineFinalInr: line.lineFinalInr,
    });
  }

  saveProducts(products);

  const now = Date.now();
  const order: Order = {
    id: `SO-${now.toString(36).toUpperCase()}`,
    status: 'paid',
    buyerId: user.id,
    buyerEmail: user.email,
    buyerName: user.displayName,
    tier,
    lines: orderLines,
    plans,
    quote,
    shipping,
    payment: {
      gateway,
      transactionId,
      amountInr: quote.totalInr,
      paidAt: now,
    },
    createdAt: now,
    updatedAt: now,
  };

  saveOrders([order, ...loadOrders()]);
  clearBag();
  return order;
};

export const isShopper = (role: Role) => role === 'b2c' || role === 'guest';
