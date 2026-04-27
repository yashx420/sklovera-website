import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  EDITABLE_FIELDS,
  submitRevision,
  updateProduct,
  type EditablePatch,
  type Product,
} from '../lib/products';
import { currentUser } from '../lib/auth';
import ProductImage from './ProductImage';

type Props = {
  product: Product | null;
  onClose: () => void;
};

type FieldDef = {
  key: typeof EDITABLE_FIELDS[number];
  label: string;
  type: 'text' | 'number' | 'bool';
  hint?: string;
};

const FIELDS: FieldDef[] = [
  { key: 'name', label: 'Description / name', type: 'text' },
  { key: 'collection', label: 'Collection', type: 'text' },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'productionType', label: 'Production type', type: 'text' },
  { key: 'heightOrDiameter', label: 'Height / diameter', type: 'text' },
  { key: 'usableMl', label: 'Usable capacity (ml)', type: 'number' },
  { key: 'usableOz', label: 'Usable capacity (oz)', type: 'number' },
  { key: 'totalMl', label: 'Total capacity (ml)', type: 'number' },
  { key: 'totalOz', label: 'Total capacity (oz)', type: 'number' },
  { key: 'pcsPerBox', label: 'Pcs per box', type: 'number' },
  { key: 'pcsPerCarton', label: 'Pcs per carton', type: 'number' },
  { key: 'cartonType', label: 'Carton type', type: 'text' },
  { key: 'pcsPerPallet', label: 'Pcs per pallet', type: 'number' },
  { key: 'priceEur', label: 'Unit price (EUR)', type: 'number', hint: 'EXW' },
  { key: 'priceUsd', label: 'Unit price (USD)', type: 'number', hint: 'EXW' },
  { key: 'ean', label: 'EAN code', type: 'text' },
  { key: 'logoCapable', label: 'Logo capable', type: 'bool' },
  { key: 'stockIntl', label: 'International stock', type: 'number' },
];

const ProductEditDialog = ({ product, onClose }: Props) => {
  const [draft, setDraft] = useState<EditablePatch>({});
  const [note, setNote] = useState('');
  const user = currentUser();
  const isAdmin = user.role === 'admin';
  const isOwnerSupplier = user.role === 'supplier' && product?.supplierId === user.id;
  const canEdit = isAdmin || isOwnerSupplier;

  useEffect(() => {
    setDraft({});
    setNote('');
  }, [product?.id]);

  const baseline = useMemo<Product | null>(() => product, [product]);

  if (!product || !canEdit) return null;

  const get = <K extends FieldDef['key']>(k: K): unknown =>
    draft[k] !== undefined ? draft[k] : (baseline as unknown as Record<string, unknown>)?.[k];

  const change = <K extends FieldDef['key']>(k: K, v: Product[K] | undefined) => {
    setDraft((d) => ({ ...d, [k]: v }));
  };

  const dirtyKeys = Object.keys(draft) as Array<keyof EditablePatch>;
  const dirtyCount = dirtyKeys.filter((k) => {
    const live = (baseline as unknown as Record<string, unknown>)?.[k as string];
    const next = (draft as unknown as Record<string, unknown>)[k as string];
    return live !== next;
  }).length;

  const save = () => {
    if (!dirtyCount) return;
    const cleaned: EditablePatch = {};
    for (const k of dirtyKeys) {
      const v = (draft as Record<string, unknown>)[k as string];
      (cleaned as Record<string, unknown>)[k as string] = v === '' ? undefined : v;
    }
    if (isAdmin) {
      updateProduct(product.id, cleaned);
    } else {
      submitRevision(product.id, cleaned, user.id, user.displayName, note || undefined);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-primary/40 z-[60]"
        onClick={onClose}
      />
      <motion.aside
        key="dialog"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 160, damping: 24 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-[600px] z-[60] overflow-hidden flex flex-col"
        style={{
          background: 'rgba(250, 249, 247, 0.94)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0px 24px 48px rgba(26, 28, 27, 0.12)',
        }}
      >
        <div className="p-8 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">Edit listing</div>
            <h3 className="font-headline italic text-3xl text-primary truncate">{product.name}</h3>
            <div className="font-mono text-[10px] text-on-surface-variant mt-1">{product.sku}</div>
          </div>
          <ProductImage
            imageKey={product.imageKey}
            alt={product.name}
            className="w-20 h-20 object-contain rounded-md bg-surface-container shrink-0"
          />
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary text-xl">✕</button>
        </div>

        {!isAdmin && (
          <div className="mx-8 mb-4 rounded-md bg-tertiary-fixed/30 text-primary px-4 py-3 text-xs">
            Your changes will be submitted for admin approval. The public catalog keeps showing the
            current values until an admin approves your revision.
          </div>
        )}
        {product.pendingRevision && (
          <div className="mx-8 mb-4 rounded-md bg-secondary-container text-on-secondary-container px-4 py-3 text-xs">
            A revision from {product.pendingRevision.submittedByName ?? 'a supplier'} is already
            awaiting admin review. Saving again will overwrite that pending revision.
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-4">
          {FIELDS.map((f) => {
            const value = get(f.key);
            const live = (baseline as unknown as Record<string, unknown>)?.[f.key];
            const changed = draft[f.key] !== undefined && draft[f.key] !== live;
            return (
              <div key={f.key}>
                <label className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant font-semibold flex items-center gap-2">
                  {f.label}
                  {f.hint && <span className="text-[9px] text-on-surface-variant/70">· {f.hint}</span>}
                  {changed && (
                    <span className="text-[9px] text-secondary font-semibold">· edited</span>
                  )}
                </label>
                {f.type === 'bool' ? (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!value}
                      onChange={(e) => change(f.key, e.target.checked as never)}
                    />
                    <span className="text-sm text-primary">{value ? 'Yes' : 'No'}</span>
                  </div>
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={value === undefined || value === null ? '' : String(value)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (f.type === 'number') {
                        const n = raw === '' ? undefined : parseFloat(raw);
                        change(f.key, (Number.isFinite(n!) ? n : undefined) as never);
                      } else {
                        change(f.key, (raw === '' ? undefined : raw) as never);
                      }
                    }}
                    className="mt-2 w-full bg-surface-container-low px-4 py-3 rounded-md outline-none border-b border-outline-variant/30 focus:border-primary text-primary"
                  />
                )}
              </div>
            );
          })}

          {!isAdmin && (
            <div>
              <label className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant font-semibold">
                Note to admin (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Reason for the change…"
                className="mt-2 w-full bg-surface-container-low px-4 py-3 rounded-md outline-none border-b border-outline-variant/30 focus:border-primary text-primary resize-none"
              />
            </div>
          )}
        </div>

        <div className="border-t border-outline-variant/20 p-8 flex items-center gap-3">
          <button
            onClick={save}
            disabled={!dirtyCount}
            className="flex-1 bg-primary text-surface py-3 rounded-md font-semibold disabled:opacity-40"
          >
            {isAdmin
              ? `Save ${dirtyCount} change${dirtyCount === 1 ? '' : 's'}`
              : `Submit ${dirtyCount} change${dirtyCount === 1 ? '' : 's'} for approval`}
          </button>
          <button onClick={onClose} className="px-4 py-3 text-sm text-on-surface-variant hover:text-primary">
            Cancel
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

export default ProductEditDialog;
