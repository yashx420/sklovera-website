import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  loadProducts,
  removeProducts,
  setProductStock,
  type Product,
  type ProductStatus,
} from '../lib/products';
import { LOW_STOCK_THRESHOLD, totalStock } from '../lib/fulfillment';
import { currentUser, onAuthChange, type User } from '../lib/auth';
import ProductImage from './ProductImage';
import ProductEditDialog from './ProductEditDialog';

type StatusFilter = ProductStatus | 'all';

const statusBadge = (s: ProductStatus) => {
  if (s === 'approved') return 'bg-secondary-container text-on-secondary-container';
  if (s === 'rejected') return 'bg-error-container text-on-error-container';
  return 'bg-tertiary-fixed/40 text-primary';
};

const SupplierInventory = () => {
  const [user, setUser] = useState<User>(() => currentUser());
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);

  useEffect(() => {
    const refresh = () => {
      const mine = loadProducts().filter((p) => p.supplierId === currentUser().id);
      setProducts(mine);
    };
    refresh();
    window.addEventListener('sklovera:products-updated', refresh);
    const offAuth = onAuthChange(refresh);
    return () => {
      window.removeEventListener('sklovera:products-updated', refresh);
      offAuth();
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.collection ?? '').toLowerCase().includes(q)
      );
    });
  }, [products, query, statusFilter]);

  const counts = useMemo(() => {
    const c = { all: products.length, pending: 0, approved: 0, rejected: 0 };
    for (const p of products) c[p.status]++;
    return c;
  }, [products]);

  const totals = useMemo(
    () =>
      products.reduce(
        (acc, p) => {
          acc.intl += p.stockIntl ?? 0;
          acc.india += p.stockIndia ?? 0;
          if (totalStock(p) < LOW_STOCK_THRESHOLD) acc.low += 1;
          if (totalStock(p) === 0) acc.out += 1;
          return acc;
        },
        { intl: 0, india: 0, low: 0, out: 0 },
      ),
    [products],
  );

  const setDraft = (id: string, v: string) => setDrafts((d) => ({ ...d, [id]: v }));

  const commit = (p: Product) => {
    const v = drafts[p.id];
    if (v === undefined) return;
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return;
    setProductStock(p.id, { stockIntl: Math.max(0, n) });
    setDrafts((d) => {
      const { [p.id]: _, ...rest } = d;
      void _;
      return rest;
    });
  };

  const del = (p: Product) => {
    if (!confirm(`Delete ${p.sku}? This also removes its photo.`)) return;
    removeProducts([p.id]);
  };

  if (user.role !== 'supplier') {
    return (
      <section className="py-32 px-12 text-center">
        <h2 className="font-headline text-4xl italic text-primary mb-4">Supplier access only</h2>
        <p className="text-on-surface-variant">Sign in as a supplier to manage your inventory.</p>
      </section>
    );
  }

  return (
    <section className="py-20 px-12">
      <div className="max-w-[1600px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">Supplier Portal</span>
          <h2 className="font-headline text-5xl italic text-primary mb-2">My Inventory</h2>
          <p className="text-on-surface-variant mb-8 max-w-2xl">
            Adjust international stock for the SKUs you've submitted. India warehouse stock is managed by
            Sklovera operations. Deleted products are removed from the catalog and cannot be restored.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Your SKUs" value={String(products.length)} />
          <Stat label="International units" value={totals.intl.toLocaleString()} />
          <Stat label={`Low stock (< ${LOW_STOCK_THRESHOLD})`} value={String(totals.low)} />
          <Stat label="Out of stock" value={String(totals.out)} />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SKU or description"
            className="bg-surface-container-low px-4 py-3 rounded-md outline-none w-72"
          />
          {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
                statusFilter === s ? 'bg-primary text-surface' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {s}
              <span className="ml-2 opacity-70">{s === 'all' ? counts.all : counts[s as ProductStatus]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl bg-surface-container-low p-12 text-center text-on-surface-variant">
            {products.length === 0
              ? 'You have not uploaded any products yet. Use the Supplier Portal to submit a catalog spreadsheet.'
              : 'Nothing matches this filter.'}
          </div>
        ) : (
          <div className="rounded-xl bg-surface-container-lowest overflow-hidden">
            <div className="max-h-[640px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container text-on-surface-variant sticky top-0">
                  <tr>
                    <th className="px-3 py-3"></th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">SKU</th>
                    <th className="text-left px-4 py-3 font-semibold">Description</th>
                    <th className="text-left px-4 py-3 font-semibold">Collection</th>
                    <th className="text-right px-4 py-3 font-semibold">International</th>
                    <th className="text-right px-4 py-3 font-semibold">India</th>
                    <th className="text-right px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const total = totalStock(p);
                    const low = total < LOW_STOCK_THRESHOLD;
                    const draftVal = drafts[p.id];
                    const dirty = draftVal !== undefined && draftVal !== String(p.stockIntl ?? 0);
                    return (
                      <tr key={p.id} className="border-t border-outline-variant/10">
                        <td className="px-3 py-2">
                          <ProductImage
                            imageKey={p.imageKey}
                            alt={p.name}
                            className="w-12 h-12 object-contain rounded-md bg-surface-container"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded ${statusBadge(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">{p.sku}</td>
                        <td className="px-4 py-2">{p.name}</td>
                        <td className="px-4 py-2">{p.collection ?? '—'}</td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={draftVal ?? String(p.stockIntl ?? 0)}
                            onChange={(e) => setDraft(p.id, e.target.value)}
                            className="w-24 bg-surface-container-low px-2 py-1 rounded-md outline-none text-right"
                          />
                        </td>
                        <td className="px-4 py-2 text-right text-on-surface-variant">
                          {(p.stockIndia ?? 0).toLocaleString()}
                        </td>
                        <td className={`px-4 py-2 text-right ${total === 0 ? 'text-on-error-container font-semibold' : low ? 'text-tertiary-fixed font-semibold' : ''}`}>
                          {total.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {p.pendingRevision && (
                            <span className="text-[9px] uppercase tracking-wider px-2 py-1 rounded bg-tertiary-fixed/40 text-primary mr-2">
                              Revision pending
                            </span>
                          )}
                          <button
                            onClick={() => commit(p)}
                            disabled={!dirty}
                            className="text-xs bg-primary text-surface px-3 py-1 rounded-md font-semibold disabled:opacity-30 mr-2"
                          >
                            Save stock
                          </button>
                          <button
                            onClick={() => setEditing(p)}
                            className="text-xs text-secondary hover:underline mr-3"
                          >
                            Edit listing
                          </button>
                          <button
                            onClick={() => del(p)}
                            className="text-xs text-on-surface-variant hover:text-primary hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ProductEditDialog product={editing} onClose={() => setEditing(null)} />
      </div>
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-surface-container-lowest rounded-xl p-5">
    <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</div>
    <div className="font-headline text-3xl text-primary">{value}</div>
  </div>
);

export default SupplierInventory;
