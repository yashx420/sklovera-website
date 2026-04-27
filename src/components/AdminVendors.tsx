import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  currentUser,
  demoUsers,
  onAuthChange,
  onUsersChange,
  removeUser,
  upsertUser,
  type User,
} from '../lib/auth';
import { loadProducts, type Product } from '../lib/products';
import {
  loadApplications,
  onApplicationsChange,
  setApplicationStatus,
  type VendorApplication,
} from '../lib/vendorApplications';

const AdminVendors = () => {
  const [user, setUser] = useState(() => currentUser());
  const [users, setUsers] = useState<User[]>(() => demoUsers());
  const [products, setProducts] = useState<Product[]>([]);
  const [applications, setApplications] = useState<VendorApplication[]>(() => loadApplications());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftEmail, setDraftEmail] = useState('');
  const [draftName, setDraftName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);
  useEffect(() => {
    const refresh = () => setUsers(demoUsers());
    return onUsersChange(refresh);
  }, []);
  useEffect(() => {
    const refresh = () => setProducts(loadProducts());
    refresh();
    window.addEventListener('sklovera:products-updated', refresh);
    return () => window.removeEventListener('sklovera:products-updated', refresh);
  }, []);
  useEffect(() => {
    const refresh = () => setApplications(loadApplications());
    refresh();
    return onApplicationsChange(refresh);
  }, []);

  const vendors = useMemo(() => users.filter((u) => u.role === 'supplier'), [users]);

  const productsBySupplier = useMemo(() => {
    const m = new Map<string, { total: number; pending: number; approved: number; rejected: number }>();
    for (const p of products) {
      const id = p.supplierId ?? '';
      if (!id) continue;
      const cur = m.get(id) ?? { total: 0, pending: 0, approved: 0, rejected: 0 };
      cur.total++;
      cur[p.status]++;
      m.set(id, cur);
    }
    return m;
  }, [products]);

  const startEdit = (v: User) => {
    setEditingId(v.id);
    setDraftName(v.displayName);
    setDraftEmail(v.email);
    setError('');
  };

  const saveEdit = (v: User) => {
    if (!draftEmail.trim() || !draftName.trim()) {
      setError('Name and email are required.');
      return;
    }
    upsertUser({ role: 'supplier', email: draftEmail.trim(), displayName: draftName.trim() }, v.id);
    setEditingId(null);
  };

  const removeVendor = (v: User) => {
    const stats = productsBySupplier.get(v.id);
    const msg = stats?.total
      ? `Remove ${v.displayName}? Their ${stats.total} product${stats.total === 1 ? '' : 's'} will stay in the catalog but be unowned. (Admin can later delete or reassign them.)`
      : `Remove ${v.displayName}?`;
    if (!confirm(msg)) return;
    removeUser(v.id);
  };

  const addVendor = () => {
    setError('');
    if (!newEmail.trim() || !newName.trim()) {
      setError('Both name and email are required.');
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      setError('A user with that email already exists.');
      return;
    }
    upsertUser({ role: 'supplier', email: newEmail.trim(), displayName: newName.trim() });
    setNewEmail('');
    setNewName('');
  };

  if (user.role !== 'admin') {
    return (
      <section className="py-32 px-12 text-center">
        <h2 className="font-headline text-4xl italic text-primary mb-4">Admin access only</h2>
      </section>
    );
  }

  return (
    <section className="py-20 px-12">
      <div className="max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">Administration</span>
          <h2 className="font-headline text-5xl italic text-primary mb-2">Vendors</h2>
          <p className="text-on-surface-variant mb-10 max-w-2xl">
            Onboard new suppliers and manage existing ones. Sign-in for the demo is by account
            selection on the login page; production auth comes with the backend.
          </p>
        </motion.div>

        {applications.some((a) => a.status === 'pending') && (
          <div className="bg-surface-container-lowest rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline italic text-2xl text-primary">
                Pending applications
                <span className="ml-3 text-xs uppercase tracking-wider text-on-surface-variant">
                  {applications.filter((a) => a.status === 'pending').length} awaiting review
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {applications
                .filter((a) => a.status === 'pending')
                .map((a) => (
                  <div key={a.id} className="rounded-lg bg-surface-container-low p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] text-on-surface-variant">{a.id}</div>
                        <div className="font-headline italic text-2xl text-primary">{a.companyName}</div>
                        <div className="text-sm text-on-surface-variant mt-1">
                          {a.contactName} · {a.email}
                          {a.phone && ` · ${a.phone}`}
                        </div>
                        <div className="text-xs text-on-surface-variant mt-1">
                          {a.country}
                          {a.website && (
                            <>
                              {' · '}
                              <a className="underline" href={a.website} target="_blank" rel="noreferrer">
                                {a.website}
                              </a>
                            </>
                          )}
                        </div>
                        {a.categories.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {a.categories.map((c) => (
                              <span
                                key={c}
                                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-tertiary-fixed/40 text-primary"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                        {a.message && (
                          <div className="mt-3 text-xs text-on-surface-variant italic">"{a.message}"</div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => {
                            upsertUser({
                              role: 'supplier',
                              email: a.email,
                              displayName: a.companyName,
                            });
                            setApplicationStatus(a.id, 'approved');
                          }}
                          className="text-xs bg-secondary text-on-secondary px-4 py-2 rounded-md font-semibold"
                        >
                          Approve &amp; onboard
                        </button>
                        <button
                          onClick={() => {
                            const note = prompt('Reason (sent in admin log only):') ?? undefined;
                            setApplicationStatus(a.id, 'rejected', note);
                          }}
                          className="text-xs text-on-surface-variant hover:text-primary hover:underline"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-xl p-6 mb-8">
          <h3 className="font-headline italic text-2xl text-primary mb-4">Onboard a new vendor</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Vendor display name (e.g. Atelier Murano)"
              className="bg-surface-container-low px-4 py-3 rounded-md outline-none"
            />
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="contact@vendor.com"
              className="bg-surface-container-low px-4 py-3 rounded-md outline-none"
            />
            <button
              onClick={addVendor}
              className="bg-primary text-surface px-4 py-3 rounded-md font-semibold"
            >
              Add vendor
            </button>
          </div>
          {error && (
            <div className="mt-3 text-xs text-on-error-container bg-error-container px-3 py-2 rounded-md">
              {error}
            </div>
          )}
        </div>

        {vendors.length === 0 ? (
          <div className="rounded-xl bg-surface-container-low p-12 text-center text-on-surface-variant">
            No vendors yet. Add one above.
          </div>
        ) : (
          <div className="rounded-xl bg-surface-container-lowest overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-container text-on-surface-variant">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Vendor</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-right px-4 py-3 font-semibold">SKUs</th>
                  <th className="text-right px-4 py-3 font-semibold">Pending</th>
                  <th className="text-right px-4 py-3 font-semibold">Approved</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => {
                  const stats = productsBySupplier.get(v.id) ?? { total: 0, pending: 0, approved: 0, rejected: 0 };
                  const editing = editingId === v.id;
                  return (
                    <tr key={v.id} className="border-t border-outline-variant/10">
                      <td className="px-4 py-3">
                        {editing ? (
                          <input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            className="w-full bg-surface-container-low px-3 py-2 rounded-md outline-none"
                          />
                        ) : (
                          <div className="font-headline italic text-lg text-primary">{v.displayName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {editing ? (
                          <input
                            value={draftEmail}
                            onChange={(e) => setDraftEmail(e.target.value)}
                            className="w-full bg-surface-container-low px-3 py-2 rounded-md outline-none"
                          />
                        ) : (
                          v.email
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{stats.total}</td>
                      <td className="px-4 py-3 text-right">{stats.pending}</td>
                      <td className="px-4 py-3 text-right">{stats.approved}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {editing ? (
                          <>
                            <button onClick={() => saveEdit(v)} className="text-xs bg-primary text-surface px-3 py-1 rounded-md font-semibold mr-2">Save</button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-on-surface-variant hover:underline">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(v)} className="text-xs text-secondary hover:underline mr-3">Edit</button>
                            <button onClick={() => removeVendor(v)} className="text-xs text-on-surface-variant hover:text-primary hover:underline">Remove</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminVendors;
