import { useEffect, useMemo, useState } from 'react';
import { currentUser, onAuthChange } from '../lib/auth';
import {
  approveRevision,
  loadProducts,
  rejectRevision,
  removeProducts,
  setProductStatus,
  type Product,
  type ProductStatus,
} from '../lib/products';
import { motion } from 'framer-motion';
import ProductEditDialog from './ProductEditDialog';

type Tab = ProductStatus | 'all' | 'revisions';

const STATUSES: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'revisions', label: 'Revisions' },
  { key: 'all', label: 'All' },
];

const statusBadge = (s: ProductStatus) => {
  if (s === 'approved') return 'bg-secondary-container text-on-secondary-container';
  if (s === 'rejected') return 'bg-error-container text-on-error-container';
  return 'bg-tertiary-fixed/40 text-primary';
};

const AdminApprovals = () => {
  const [user, setUser] = useState(() => currentUser());
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<Tab>('pending');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);
  useEffect(() => {
    const refresh = () => setProducts(loadProducts());
    refresh();
    window.addEventListener('sklovera:products-updated', refresh);
    return () => window.removeEventListener('sklovera:products-updated', refresh);
  }, []);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      revisions: 0,
      all: products.length,
    };
    for (const p of products) {
      c[p.status]++;
      if (p.pendingRevision) c.revisions++;
    }
    return c;
  }, [products]);

  const list = useMemo(() => {
    if (tab === 'all') return products;
    if (tab === 'revisions') return products.filter((p) => p.pendingRevision);
    return products.filter((p) => p.status === tab);
  }, [products, tab]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === list.length) setSelected(new Set());
    else setSelected(new Set(list.map((p) => p.id)));
  };

  const act = (status: ProductStatus) => {
    if (!selected.size) return;
    setProductStatus(Array.from(selected), status);
    setSelected(new Set());
  };

  const del = (ids: string[]) => {
    if (!ids.length) return;
    const msg = ids.length === 1 ? 'Delete this product permanently? This also removes its photo.' : `Delete ${ids.length} products permanently? This also removes their photos.`;
    if (!confirm(msg)) return;
    removeProducts(ids);
    setSelected(new Set());
  };

  if (user.role !== 'admin') {
    return (
      <section className="py-32 px-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-headline text-4xl italic text-primary mb-4">Admin access only</h2>
          <p className="text-on-surface-variant">Sign in as admin to review supplier submissions.</p>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="py-20 px-12">
      <div className="max-w-[1600px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">Administration</span>
          <h2 className="font-headline text-5xl italic text-primary mb-8">Product Approvals</h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap items-center gap-2 mb-6">
          {STATUSES.map((s) => (
            <motion.button
              key={s.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setTab(s.key); setSelected(new Set()); }}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                tab === s.key ? 'bg-primary text-surface' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {s.label}
              <span className="ml-2 text-xs opacity-70">{s.key === 'all' ? counts.all : counts[s.key]}</span>
            </motion.button>
          ))}
          <div className="ml-auto flex gap-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => act('approved')} disabled={!selected.size} className="bg-secondary text-on-secondary px-4 py-2 rounded-md font-semibold text-sm disabled:opacity-40">
              Approve {selected.size || ''}
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => act('rejected')} disabled={!selected.size} className="bg-error-container text-on-error-container px-4 py-2 rounded-md font-semibold text-sm disabled:opacity-40">
              Reject {selected.size || ''}
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => del(Array.from(selected))} disabled={!selected.size} className="bg-primary text-surface px-4 py-2 rounded-md font-semibold text-sm disabled:opacity-40">
              Delete {selected.size || ''}
            </motion.button>
          </div>
        </motion.div>

        {list.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-surface-container-low p-12 text-center text-on-surface-variant">
            No products in this view.
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl bg-surface-container-lowest overflow-hidden">
            <div className="max-h-[640px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container text-on-surface-variant sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-left"><input type="checkbox" checked={selected.size === list.length && list.length > 0} onChange={toggleAll}/></th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">SKU</th>
                    <th className="text-left px-4 py-3 font-semibold">Description</th>
                    <th className="text-left px-4 py-3 font-semibold">Supplier</th>
                    <th className="text-left px-4 py-3 font-semibold">Collection</th>
                    <th className="text-right px-4 py-3 font-semibold">EUR</th>
                    <th className="text-right px-4 py-3 font-semibold">Inventory</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => {
                    const rev = p.pendingRevision;
                    return (
                      <>
                        <tr key={p.id} className="even:bg-surface-container-low/60 hover:bg-surface-container-low/80 transition-colors">
                          <td className="px-3 py-2"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} /></td>
                          <td className="px-4 py-2">
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded ${statusBadge(p.status)}`}>{p.status}</span>
                            {rev && (
                              <span className="ml-1 text-[9px] uppercase tracking-wider px-2 py-1 rounded bg-tertiary-fixed/40 text-primary">
                                revision
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">{p.sku}</td>
                          <td className="px-4 py-2">{p.name}</td>
                          <td className="px-4 py-2">{p.supplier ?? '—'}</td>
                          <td className="px-4 py-2">{p.collection ?? '—'}</td>
                          <td className="px-4 py-2 text-right">{p.priceEur?.toFixed(2) ?? '—'}</td>
                          <td className="px-4 py-2 text-right">{p.inventory?.toLocaleString() ?? '—'}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {p.status !== 'approved' && (<button onClick={() => setProductStatus([p.id], 'approved')} className="text-xs text-secondary font-semibold mr-3 hover:underline">Approve</button>)}
                            {p.status !== 'rejected' && (<button onClick={() => setProductStatus([p.id], 'rejected')} className="text-xs text-on-surface-variant hover:text-primary hover:underline mr-3">Reject</button>)}
                            <button onClick={() => setEditing(p)} className="text-xs text-secondary hover:underline mr-3">Edit</button>
                            <button onClick={() => del([p.id])} className="text-xs text-on-surface-variant hover:text-primary hover:underline">Delete</button>
                          </td>
                        </tr>
                        {rev && (
                          <tr key={`${p.id}-rev`} className="bg-tertiary-fixed/15">
                            <td></td>
                            <td colSpan={7} className="px-4 py-3">
                              <div className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">
                                Pending revision · submitted by {rev.submittedByName ?? rev.submittedBy} ·{' '}
                                {new Date(rev.submittedAt).toLocaleDateString()}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                                {Object.entries(rev.patch).map(([k, v]) => {
                                  const live = (p as unknown as Record<string, unknown>)[k];
                                  return (
                                    <div key={k} className="flex justify-between gap-3">
                                      <span className="text-on-surface-variant">{k}</span>
                                      <span className="text-primary text-right truncate">
                                        <span className="line-through text-on-surface-variant/60 mr-2">
                                          {live === undefined || live === null || live === '' ? '—' : String(live)}
                                        </span>
                                        {v === undefined || v === null || v === '' ? '—' : String(v)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              {rev.note && (
                                <div className="mt-2 text-xs text-on-surface-variant italic">"{rev.note}"</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap align-top">
                              <button onClick={() => approveRevision(p.id)} className="text-xs bg-secondary text-on-secondary px-3 py-1 rounded-md font-semibold mr-2">
                                Approve revision
                              </button>
                              <button onClick={() => rejectRevision(p.id)} className="text-xs text-on-surface-variant hover:text-primary hover:underline">
                                Reject
                              </button>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        <ProductEditDialog product={editing} onClose={() => setEditing(null)} />
      </div>
    </section>
  );
};

export default AdminApprovals;
