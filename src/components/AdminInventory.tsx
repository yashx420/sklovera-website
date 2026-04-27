import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  loadProducts,
  setProductStock,
  type Product,
} from '../lib/products';
import { LOW_STOCK_THRESHOLD, totalStock } from '../lib/fulfillment';
import { currentUser, onAuthChange } from '../lib/auth';

type RowFilter = 'all' | 'low' | 'out';

const AdminInventory = () => {
  const [user, setUser] = useState(() => currentUser());
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RowFilter>('all');
  const [drafts, setDrafts] = useState<Record<string, { india?: string; intl?: string }>>({});

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);

  useEffect(() => {
    const refresh = () => setProducts(loadProducts().filter((p) => p.status === 'approved'));
    refresh();
    window.addEventListener('sklovera:products-updated', refresh);
    return () => window.removeEventListener('sklovera:products-updated', refresh);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === 'low' && totalStock(p) >= LOW_STOCK_THRESHOLD) return false;
      if (filter === 'out' && totalStock(p) > 0) return false;
      if (!q) return true;
      return (
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.collection ?? '').toLowerCase().includes(q)
      );
    });
  }, [products, query, filter]);

  const setDraft = (id: string, which: 'india' | 'intl', value: string) => {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [which]: value } }));
  };

  const commit = (p: Product) => {
    const d = drafts[p.id];
    if (!d) return;
    const patch: { stockIndia?: number; stockIntl?: number } = {};
    if (d.india !== undefined) {
      const n = parseInt(d.india, 10);
      if (!Number.isNaN(n)) patch.stockIndia = n;
    }
    if (d.intl !== undefined) {
      const n = parseInt(d.intl, 10);
      if (!Number.isNaN(n)) patch.stockIntl = n;
    }
    if (Object.keys(patch).length) setProductStock(p.id, patch);
    setDrafts((dd) => {
      const { [p.id]: _, ...rest } = dd;
      void _;
      return rest;
    });
  };

  if (user.role !== 'admin') {
    return (
      <section className="py-32 px-12 text-center">
        <h2 className="font-headline text-4xl italic text-primary mb-4">Admin access only</h2>
        <p className="text-on-surface-variant">Sign in as admin to manage warehouse stock.</p>
      </section>
    );
  }

  const totals = products.reduce(
    (acc, p) => {
      acc.india += p.stockIndia ?? 0;
      acc.intl += p.stockIntl ?? 0;
      acc.low += totalStock(p) < LOW_STOCK_THRESHOLD ? 1 : 0;
      acc.out += totalStock(p) === 0 ? 1 : 0;
      return acc;
    },
    { india: 0, intl: 0, low: 0, out: 0 },
  );

  return (
    <section className="py-20 px-12">
      <div className="max-w-[1600px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">Administration</span>
          <h2 className="font-headline text-5xl italic text-primary mb-2">Inventory</h2>
          <p className="text-on-surface-variant mb-8 max-w-2xl">
            Dual-warehouse stock. India pulls first; import covers the rest. Supplier uploads populate
            international stock automatically.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="India stock" value={totals.india.toLocaleString()} />
          <Stat label="International stock" value={totals.intl.toLocaleString()} />
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
          {(['all', 'low', 'out'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
                filter === f ? 'bg-primary text-surface' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {f === 'all' ? 'All' : f === 'low' ? 'Low stock' : 'Out of stock'}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl bg-surface-container-low p-12 text-center text-on-surface-variant">
            Nothing matches this filter.
          </div>
        ) : (
          <div className="rounded-xl bg-surface-container-lowest overflow-hidden">
            <div className="max-h-[640px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container text-on-surface-variant sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">SKU</th>
                    <th className="text-left px-4 py-3 font-semibold">Description</th>
                    <th className="text-left px-4 py-3 font-semibold">Collection</th>
                    <th className="text-right px-4 py-3 font-semibold">India</th>
                    <th className="text-right px-4 py-3 font-semibold">International</th>
                    <th className="text-right px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const total = totalStock(p);
                    const low = total < LOW_STOCK_THRESHOLD;
                    const draft = drafts[p.id];
                    const dirty = !!draft && (draft.india !== undefined || draft.intl !== undefined);
                    return (
                      <tr key={p.id} className="border-t border-outline-variant/10">
                        <td className="px-4 py-2 font-mono text-xs">{p.sku}</td>
                        <td className="px-4 py-2">{p.name}</td>
                        <td className="px-4 py-2">{p.collection ?? '—'}</td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={draft?.india ?? String(p.stockIndia ?? 0)}
                            onChange={(e) => setDraft(p.id, 'india', e.target.value)}
                            className="w-24 bg-surface-container-low px-2 py-1 rounded-md outline-none text-right"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            value={draft?.intl ?? String(p.stockIntl ?? 0)}
                            onChange={(e) => setDraft(p.id, 'intl', e.target.value)}
                            className="w-24 bg-surface-container-low px-2 py-1 rounded-md outline-none text-right"
                          />
                        </td>
                        <td className={`px-4 py-2 text-right ${total === 0 ? 'text-on-error-container font-semibold' : low ? 'text-tertiary-fixed font-semibold' : ''}`}>
                          {total.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => commit(p)}
                            disabled={!dirty}
                            className="text-xs bg-primary text-surface px-3 py-1 rounded-md font-semibold disabled:opacity-30"
                          >
                            Save
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

export default AdminInventory;
