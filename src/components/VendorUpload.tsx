import { useEffect, useRef, useState } from 'react';
import { addProducts, parseWorkbookWithImages, type ParseResult, type Product } from '../lib/products';
import { currentUser, onAuthChange, type User } from '../lib/auth';
import { motion, AnimatePresence } from 'framer-motion';

type Props = { onDone?: () => void };

const formatPrice = (v?: number) => (v === undefined ? '—' : v.toFixed(2));

const steps = [
  { label: 'Upload', icon: 'upload_file' },
  { label: 'Review', icon: 'fact_check' },
  { label: 'Submit', icon: 'check_circle' },
];

const VendorUpload = ({ onDone }: Props) => {
  const [user, setUser] = useState<User>(() => currentUser());
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [committed, setCommitted] = useState<{ added: number; updated: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);

  const currentStep = committed ? 2 : result ? 1 : 0;

  const handleFile = async (file: File) => {
    if (user.role !== 'supplier') return;
    setError('');
    setCommitted(null);
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const r = await parseWorkbookWithImages(buf, user.displayName, user.id);
      setFileName(file.name);
      setResult(r);
    } catch (e) {
      setError((e as Error).message || 'Failed to parse file');
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const commit = () => {
    if (!result) return;
    const stamped: Product[] = result.products.map((p) => ({
      ...p,
      supplier: user.displayName,
      supplierId: user.id,
      status: 'pending',
    }));
    const res = addProducts(stamped);
    setCommitted(res);
  };

  if (user.role !== 'supplier') {
    return (
      <section className="py-32 px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }} className="max-w-[720px] mx-auto text-center">
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">Supplier Portal</span>
          <h2 className="font-headline text-5xl italic text-primary mb-4">Supplier access only</h2>
          <p className="text-on-surface-variant">
            Sign in as a supplier to upload catalog spreadsheets. Uploaded products enter a pending
            queue for admin review before appearing on the site.
          </p>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 md:px-12 min-h-[80vh]">
      <div className="max-w-[1100px] mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <span className="text-on-surface-variant font-medium tracking-widest text-xs uppercase block mb-3">Supplier Portal</span>
          <h2 className="font-headline text-4xl md:text-5xl italic text-primary mb-3">Upload Product Catalog</h2>
          <p className="text-on-surface-variant max-w-xl text-sm leading-relaxed">
            Drop a supplier offer spreadsheet. Each row becomes a product that enters the admin approval queue.
          </p>
        </motion.div>

        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-0 mb-12 max-w-md"
        >
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  animate={{
                    backgroundColor: i <= currentStep ? 'var(--md-sys-color-primary, #1a6b5a)' : 'var(--md-sys-color-surface-container, #e8e8e8)',
                    color: i <= currentStep ? 'var(--md-sys-color-surface, #fff)' : 'var(--md-sys-color-on-surface-variant, #888)',
                    scale: i === currentStep ? 1.15 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                >
                  <span className="material-symbols-outlined text-lg" data-icon={s.icon}>{s.icon}</span>
                </motion.div>
                <span className={`text-[10px] font-semibold tracking-wide uppercase ${i <= currentStep ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px mx-2 relative top-[-8px]">
                  <div className="w-full h-full bg-outline-variant/30" />
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-primary"
                    initial={{ width: '0%' }}
                    animate={{ width: i < currentStep ? '100%' : '0%' }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Signed-in badge */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mb-8 inline-flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full text-xs"
        >
          <span className="material-symbols-outlined text-sm text-primary" data-icon="person">person</span>
          Signed in as <span className="font-bold text-primary">{user.displayName}</span>
        </motion.div>

        {/* Drop Zone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <motion.div
            animate={{
              borderColor: dragActive ? 'var(--md-sys-color-primary, #1a6b5a)' : 'transparent',
              backgroundColor: dragActive ? 'var(--md-sys-color-secondary-container, #d0f0e8)' : undefined,
            }}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer rounded-2xl bg-surface-container-low hover:bg-surface-container p-12 md:p-16 text-center transition-all border-2 border-dashed border-outline-variant/40 group relative overflow-hidden"
          >
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}/>

            {/* Animated background icon */}
            <motion.span
              animate={{ rotate: dragActive ? 15 : 0, scale: dragActive ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="material-symbols-outlined text-6xl text-primary/20 mb-4 block group-hover:text-primary/40 transition-colors"
              data-icon="cloud_upload"
            >
              cloud_upload
            </motion.span>

            <div className="font-headline text-xl md:text-2xl italic text-primary mb-2">
              {busy ? 'Parsing rows & extracting images…' : fileName || 'Drop your spreadsheet here'}
            </div>
            <div className="text-on-surface-variant text-sm">
              {busy ? (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  Processing file…
                </motion.span>
              ) : (
                'or click to browse — .xlsx, .xls, .csv supported'
              )}
            </div>

            {fileName && !busy && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full text-xs font-medium"
              >
                <span className="material-symbols-outlined text-sm" data-icon="description">description</span>
                {fileName}
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 rounded-xl bg-error-container text-on-error-container px-5 py-4 text-sm flex items-center gap-3 overflow-hidden"
            >
              <span className="material-symbols-outlined text-lg" data-icon="error">error</span>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Parsed rows', value: result.products.length, icon: 'table_rows' },
                  { label: 'With photos', value: result.products.filter((p) => p.imageKey).length, icon: 'photo_library' },
                  { label: 'Issues', value: result.issues.length, icon: 'warning' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.12, duration: 0.8 }}
                    className="bg-surface-container-low rounded-xl p-5 text-center"
                  >
                    <span className="material-symbols-outlined text-2xl text-secondary mb-2 block" data-icon={stat.icon}>{stat.icon}</span>
                    <div className="font-headline text-3xl text-primary">{stat.value}</div>
                    <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={commit}
                  disabled={!result.products.length}
                  className="bg-primary text-surface px-8 py-4 rounded-full font-medium tracking-wide shadow-xl disabled:opacity-40 flex items-center gap-3 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] rounded-full" />
                  <span className="relative z-10">Submit {result.products.length} for Approval</span>
                  <span className="material-symbols-outlined relative z-10 text-sm group-hover:translate-x-1 transition-transform duration-500" data-icon="arrow_forward">arrow_forward</span>
                </motion.button>

                {committed && onDone && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onDone}
                    className="bg-secondary text-on-secondary px-8 py-4 rounded-full font-medium tracking-wide shadow-lg flex items-center gap-3"
                  >
                    View Catalog
                    <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
                  </motion.button>
                )}
              </div>

              {/* Success message */}
              <AnimatePresence>
                {committed && (
                  <motion.div
                    initial={{ opacity: 0, y: -12, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8 rounded-xl bg-secondary-container text-on-secondary-container px-5 py-4 text-sm flex items-center gap-3 overflow-hidden"
                  >
                    <span className="material-symbols-outlined text-lg" data-icon="check_circle">check_circle</span>
                    Submitted {committed.added} new · updated {committed.updated} existing products. They are now pending admin review.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Validation notes */}
              {result.issues.length > 0 && (
                <details className="mb-8 rounded-xl bg-surface-container-low p-5 group">
                  <summary className="cursor-pointer text-sm font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant group-open:rotate-90 transition-transform" data-icon="chevron_right">chevron_right</span>
                    {result.issues.length} validation notes
                  </summary>
                  <ul className="mt-4 text-sm text-on-surface-variant space-y-1.5 pl-6">
                    {result.issues.slice(0, 100).map((i, idx) => (<li key={idx} className="list-disc">Row {i.row}: {i.message}</li>))}
                  </ul>
                </details>
              )}

              {/* Data table */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl bg-surface-container-lowest overflow-hidden shadow-lg border border-outline-variant/15"
              >
                <div className="max-h-[480px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-container text-on-surface-variant sticky top-0 z-10">
                      <tr>
                        <th className="text-left px-5 py-3.5 font-semibold text-xs tracking-wide uppercase">SKU</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-xs tracking-wide uppercase">Description</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-xs tracking-wide uppercase">Collection</th>
                        <th className="text-right px-5 py-3.5 font-semibold text-xs tracking-wide uppercase">ml</th>
                        <th className="text-right px-5 py-3.5 font-semibold text-xs tracking-wide uppercase">EUR</th>
                        <th className="text-right px-5 py-3.5 font-semibold text-xs tracking-wide uppercase">USD</th>
                        <th className="text-right px-5 py-3.5 font-semibold text-xs tracking-wide uppercase">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.products.slice(0, 200).map((p, idx) => (
                        <motion.tr
                          key={p.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.02 * Math.min(idx, 20) }}
                          className="even:bg-surface-container-low/60 hover:bg-surface-container transition-colors"
                        >
                          <td className="px-5 py-3 font-mono text-xs text-primary">{p.sku}</td>
                          <td className="px-5 py-3">{p.name}</td>
                          <td className="px-5 py-3 text-on-surface-variant">{p.collection ?? '—'}</td>
                          <td className="px-5 py-3 text-right">{p.usableMl ?? '—'}</td>
                          <td className="px-5 py-3 text-right font-medium">{formatPrice(p.priceEur)}</td>
                          <td className="px-5 py-3 text-right font-medium">{formatPrice(p.priceUsd)}</td>
                          <td className="px-5 py-3 text-right">{p.inventory ?? '—'}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.products.length > 200 && (
                  <div className="px-5 py-3 text-xs text-on-surface-variant bg-surface-container text-center">
                    Showing first 200 of {result.products.length} rows.
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default VendorUpload;
