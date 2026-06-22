import * as XLSX from 'xlsx';
import { extractImages, indexImagesByRow } from './xlsxImages';
import { deleteImage, putImage } from './images';
import seededProducts from './seededProducts.json';
import { AMBER_PRODUCTS } from './amberSeed';
import { SOLBIKA_PRODUCTS } from './solbikaSeed';

export type ProductStatus = 'pending' | 'approved' | 'rejected';

export type ProductRevision = {
  patch: Partial<Product>;
  submittedBy: string;     // user id
  submittedByName?: string;
  submittedAt: number;
  note?: string;
};

export type Product = {
  id: string;
  sku: string;
  baseIndex?: string;
  ean?: string;
  name: string;
  collection?: string;
  category?: string;
  productionType?: string;
  logoCapable?: boolean;
  heightOrDiameter?: string;
  usableMl?: number;
  usableOz?: number;
  totalMl?: number;
  totalOz?: number;
  pcsPerBox?: number;
  pcsPerCarton?: number;
  cartonType?: string;
  pcsPerPallet?: number;
  priceEur?: number;
  priceUsd?: number;
  inventory?: number;        // legacy aggregate; prefer stockIntl/stockIndia
  stockIntl?: number;        // international warehouse (supplier inventory)
  stockIndia?: number;       // domestic (India) warehouse, managed by admin
  supplier?: string;
  supplierId?: string;
  status: ProductStatus;
  reviewedAt?: number;
  reviewNote?: string;
  imageKey?: string;
  images?: string[];         // multiple photos → rendered as a carousel
  rowIndex?: number;
  pendingRevision?: ProductRevision;
  createdAt: number;
};

// Field whitelist — what suppliers/admin can edit through the dialog.
export const EDITABLE_FIELDS = [
  'name',
  'collection',
  'category',
  'productionType',
  'heightOrDiameter',
  'usableMl',
  'usableOz',
  'totalMl',
  'totalOz',
  'pcsPerBox',
  'pcsPerCarton',
  'cartonType',
  'pcsPerPallet',
  'priceEur',
  'priceUsd',
  'ean',
  'logoCapable',
  'stockIntl',
] as const;

export type EditablePatch = Partial<Pick<Product, typeof EDITABLE_FIELDS[number]>>;

export type ParseIssue = { row: number; message: string };
export type ParseResult = { products: Product[]; issues: ParseIssue[] };

const STORAGE_KEY = 'sklovera.products.v1';
// Per-vendor seed flags. Bump the version when a vendor's seed changes (e.g.
// new photos/categories) so the upsert re-runs exactly once for existing users.
// Amber v3: HoReCa photos + categories. Solbika v1: initial import.
const VENDOR_SEEDS: { flag: string; products: Product[] }[] = [
  { flag: 'sklovera.products.seed.amber.v3', products: AMBER_PRODUCTS },
  { flag: 'sklovera.products.seed.solbika.v1', products: SOLBIKA_PRODUCTS },
];

/** Suppliers whose seed ships meaningful browse categories (don't re-derive). */
const CATEGORIED_SUPPLIERS = new Set(['sup-amber', 'sup-solbika']);

/**
 * Upsert each vendor's demo catalog into stored products exactly once per seed
 * version. Seed products overwrite any existing entry with the same id (so
 * updated fields like photos land); everything else is preserved.
 */
const seedVendorsOnce = (existing: Product[]): Product[] => {
  try {
    let current = existing;
    let changed = false;
    for (const { flag, products } of VENDOR_SEEDS) {
      if (localStorage.getItem(flag)) continue;
      const byId = new Map(current.map((p) => [p.id, p]));
      for (const p of products) byId.set(p.id, p);
      localStorage.setItem(flag, '1');
      current = Array.from(byId.values());
      changed = true;
    }
    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return current;
  } catch {
    return existing;
  }
};

const num = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const s = String(v).replace(/[^\d.\-]/g, '');
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const str = (v: unknown): string | undefined => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
};

const HEADER_MAP: Record<string, keyof Product> = {
  'krosno reference': 'sku',
  'sku': 'sku',
  'reference': 'sku',
  'base index': 'baseIndex',
  'ean code': 'ean',
  'ean': 'ean',
  'description': 'name',
  'product name': 'name',
  'name': 'name',
  'collection': 'collection',
  'category': 'category',
  'production type': 'productionType',
  'logo': 'logoCapable',
  'height (h)/ diameter (fi)': 'heightOrDiameter',
  'height/diameter': 'heightOrDiameter',
  'usable capacity (ml)': 'usableMl',
  'usable caapcity (ml)': 'usableMl',
  'usable capacity (oz)': 'usableOz',
  'usable caapcity (oz)': 'usableOz',
  'total capacity (ml)': 'totalMl',
  'total caapcity (ml)': 'totalMl',
  'total capacity (oz)': 'totalOz',
  'total caapcity (oz)': 'totalOz',
  'pcs per box': 'pcsPerBox',
  'pcs per box in master carton/foil pack': 'pcsPerCarton',
  'master carton/foil pack': 'cartonType',
  'pcs per pallet': 'pcsPerPallet',
  'unit price (eur)': 'priceEur',
  'unit price (usd)': 'priceUsd',
};

const normKey = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

const findHeaderRow = (rows: unknown[][]): number => {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] ?? [];
    const hits = row.filter((c) => {
      const k = typeof c === 'string' ? normKey(c) : '';
      return k in HEADER_MAP;
    }).length;
    if (hits >= 4) return i;
  }
  return 0;
};

export const parseWorkbook = (data: ArrayBuffer, supplier?: string, supplierId?: string): ParseResult => {
  const wb = XLSX.read(data, { type: 'array' });
  const issues: ParseIssue[] = [];
  const products: Product[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null });
    if (!rows.length) continue;

    const headerIdx = findHeaderRow(rows);
    const headerRow = (rows[headerIdx] ?? []) as unknown[];
    const colMap: Record<number, keyof Product> = {};
    headerRow.forEach((cell, idx) => {
      if (typeof cell !== 'string') return;
      const key = normKey(cell);
      const field = HEADER_MAP[key];
      if (field) colMap[idx] = field;
    });

    // Also capture inventory column (header text contains "inventory")
    let inventoryCol: number | undefined;
    headerRow.forEach((cell, idx) => {
      if (typeof cell === 'string' && /inventory/i.test(cell)) inventoryCol = idx;
    });

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r] as unknown[];
      if (!row || row.every((c) => c === null || c === undefined || c === '')) continue;

      const rec: Partial<Product> = {};
      for (const [idxStr, field] of Object.entries(colMap)) {
        const idx = Number(idxStr);
        const val = row[idx];
        if (field === 'logoCapable') {
          (rec as any)[field] = typeof val === 'string' ? /^(y|yes|true|1)$/i.test(val.trim()) : !!val;
        } else if (
          field === 'usableMl' || field === 'usableOz' ||
          field === 'totalMl' || field === 'totalOz' ||
          field === 'pcsPerBox' || field === 'pcsPerCarton' ||
          field === 'pcsPerPallet' || field === 'priceEur' || field === 'priceUsd'
        ) {
          (rec as any)[field] = num(val);
        } else {
          (rec as any)[field] = str(val);
        }
      }
      if (inventoryCol !== undefined) {
        const intl = num(row[inventoryCol]);
        rec.inventory = intl;
        rec.stockIntl = intl;
      }

      if (!rec.sku) {
        issues.push({ row: r + 1, message: 'Missing SKU/Reference — row skipped' });
        continue;
      }
      if (!rec.name) {
        issues.push({ row: r + 1, message: `SKU ${rec.sku}: missing description — row skipped` });
        continue;
      }
      if (rec.priceEur === undefined && rec.priceUsd === undefined) {
        issues.push({ row: r + 1, message: `SKU ${rec.sku}: no unit price` });
      }

      products.push({
        id: supplierId ? `${supplierId}:${rec.sku}` : `${rec.sku}`,
        sku: rec.sku,
        name: rec.name,
        supplier,
        supplierId,
        status: 'pending',
        rowIndex: r,
        createdAt: Date.now(),
        ...rec,
      } as Product);
    }
  }

  return { products, issues };
};

export const parseCsv = (text: string, supplier?: string, supplierId?: string): ParseResult => {
  const wb = XLSX.read(text, { type: 'string' });
  return parseWorkbook(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer, supplier, supplierId);
};

// The "Product photo" column in the Krosno template is the 8th column (index 7).
const PRODUCT_PHOTO_COL = 7;

/**
 * Parse + extract embedded product photos and persist them to IndexedDB.
 * Each product gets an `imageKey` if a photo anchored to its row was found.
 */
export const parseWorkbookWithImages = async (
  data: ArrayBuffer,
  supplier?: string,
  supplierId?: string,
): Promise<ParseResult> => {
  const parsed = parseWorkbook(data, supplier, supplierId);
  try {
    const images = await extractImages(data);
    const byRow = indexImagesByRow(images, PRODUCT_PHOTO_COL);
    for (const p of parsed.products) {
      if (p.rowIndex === undefined) continue;
      const img = byRow.get(p.rowIndex);
      if (!img) continue;
      const key = `img:${p.id}`;
      await putImage(key, img.bytes, img.ext);
      p.imageKey = key;
    }
  } catch (e) {
    parsed.issues.push({ row: 0, message: `Image extraction failed: ${(e as Error).message}` });
  }
  return parsed;
};

export const detectCategory = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('wine glass') || n.includes('wine') || n.includes('goblet') || n.includes('tasting')) {
    if (n.includes('decanter')) return 'Decanters & Carafes';
    return 'Wine Glasses';
  }
  if (n.includes('champagne') || n.includes('prosecco') || n.includes('flute')) {
    return 'Champagne Glasses';
  }
  if (n.includes('martini') || n.includes('cocktail') || n.includes('gin') || n.includes('margarita') || n.includes('margharita') || n.includes('drink glass') || n.includes('nick & nora') || n.includes('coupette') || n.includes('copa')) {
    return 'Cocktail Glasses';
  }
  if (n.includes('whisky') || n.includes('whiskey') || n.includes('liqueur') || n.includes('liquer') || n.includes('shot') || n.includes('vodka') || n.includes('cognac') || n.includes('tequila') || n.includes('schnapps')) {
    return 'Spirits & Whisky';
  }
  if (n.includes('beer') || n.includes('cider')) {
    return 'Beer Glasses';
  }
  if (n.includes('tumbler') || n.includes('highball') || n.includes('soft drink') || n.includes('water') || n.includes('juice')) {
    return 'Tumblers & Highballs';
  }
  if (n.includes('decanter') || n.includes('carafe') || n.includes('jug')) {
    return 'Decanters & Carafes';
  }
  if (n.includes('bowl') || n.includes('plate') || n.includes('stand') || n.includes('dome') || n.includes('vessel') || n.includes('vase') || n.includes('cup') || n.includes('dessert') || n.includes('ice cream')) {
    return 'Tableware & Accessories';
  }
  if (n.includes('set')) {
    return 'Glassware Sets';
  }
  return 'Glassware';
};

export const loadProducts = (): Product[] => {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seededProducts));
      raw = JSON.stringify(seededProducts);
    }
    const arr = seedVendorsOnce(JSON.parse(raw) as Product[]);
    return arr.map((p) => {
      const next: Product = { ...p };
      if (!next.status) next.status = 'approved' as ProductStatus; // Part 1 records
      // Amber/Solbika ship meaningful seed categories; Krosno's stored category
      // is a tier label ("PREMIUM"…), so re-derive those from the product name.
      next.category =
        next.supplierId && CATEGORIED_SUPPLIERS.has(next.supplierId) && next.category
          ? next.category
          : detectCategory(next.name);
      // Part 6: split legacy aggregate inventory onto international warehouse.
      if (next.stockIntl === undefined && next.inventory !== undefined) next.stockIntl = next.inventory;
      if (next.stockIndia === undefined) next.stockIndia = 0;
      return next;
    });
  } catch {
    return [];
  }
};

export const saveProducts = (products: Product[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent('sklovera:products-updated'));
};

export const addProducts = (incoming: Product[]): { added: number; updated: number } => {
  const existing = loadProducts();
  const byId = new Map(existing.map((p) => [p.id, p]));
  let added = 0;
  let updated = 0;
  for (const p of incoming) {
    if (byId.has(p.id)) updated++;
    else added++;
    byId.set(p.id, p);
  }
  saveProducts(Array.from(byId.values()));
  return { added, updated };
};

export const clearProducts = (): void => {
  const all = loadProducts();
  for (const p of all) if (p.imageKey) void deleteImage(p.imageKey);
  saveProducts([]);
};

export const removeProducts = (ids: string[]): void => {
  const idSet = new Set(ids);
  const all = loadProducts();
  for (const p of all) {
    if (idSet.has(p.id) && p.imageKey) void deleteImage(p.imageKey);
  }
  saveProducts(all.filter((p) => !idSet.has(p.id)));
};

/**
 * Apply a patch directly. Used by admin (immediate) and internally on revision approval.
 */
export const updateProduct = (id: string, patch: EditablePatch): void => {
  const all = loadProducts();
  saveProducts(
    all.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  );
};

/**
 * Submit a revision proposal for an approved product. Lives on the product as
 * `pendingRevision` until an admin approves or rejects. The public catalog keeps
 * showing the original until approval lands.
 */
export const submitRevision = (
  id: string,
  patch: EditablePatch,
  submittedBy: string,
  submittedByName?: string,
  note?: string,
): void => {
  if (!Object.keys(patch).length) return;
  const all = loadProducts();
  saveProducts(
    all.map((p) =>
      p.id === id
        ? {
            ...p,
            pendingRevision: {
              patch,
              submittedBy,
              submittedByName,
              submittedAt: Date.now(),
              note,
            },
          }
        : p,
    ),
  );
};

export const approveRevision = (id: string): void => {
  const all = loadProducts();
  saveProducts(
    all.map((p) => {
      if (p.id !== id || !p.pendingRevision) return p;
      const merged = { ...p, ...p.pendingRevision.patch } as Product;
      delete merged.pendingRevision;
      return merged;
    }),
  );
};

export const rejectRevision = (id: string): void => {
  const all = loadProducts();
  saveProducts(
    all.map((p) => {
      if (p.id !== id || !p.pendingRevision) return p;
      const next = { ...p };
      delete next.pendingRevision;
      return next;
    }),
  );
};

export const setProductStock = (
  id: string,
  patch: { stockIndia?: number; stockIntl?: number },
): void => {
  const all = loadProducts();
  saveProducts(
    all.map((p) =>
      p.id === id
        ? {
            ...p,
            stockIndia: patch.stockIndia !== undefined ? Math.max(0, patch.stockIndia) : p.stockIndia,
            stockIntl: patch.stockIntl !== undefined ? Math.max(0, patch.stockIntl) : p.stockIntl,
          }
        : p,
    ),
  );
};

export const setProductStatus = (ids: string[], status: ProductStatus, note?: string): void => {
  const all = loadProducts();
  const idSet = new Set(ids);
  const now = Date.now();
  saveProducts(
    all.map((p) =>
      idSet.has(p.id) ? { ...p, status, reviewedAt: now, reviewNote: note } : p,
    ),
  );
};

