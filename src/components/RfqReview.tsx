import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  hydrateCart,
  loadCart,
  onCartChange,
  submitRfq,
  type RfqItem,
} from '../lib/rfq';
import { loadProducts } from '../lib/products';
import { currentUser, onAuthChange, type User } from '../lib/auth';
import ProductImage from './ProductImage';

type Props = { onSignIn: () => void; onSubmitted: () => void };

const RfqReview = ({ onSignIn, onSubmitted }: Props) => {
  const [user, setUser] = useState<User>(() => currentUser());
  const [items, setItems] = useState<RfqItem[]>([]);
  const [shipCountry, setShipCountry] = useState('India');
  const [shipCity, setShipCity] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);

  useEffect(() => {
    const refresh = () => setItems(hydrateCart(loadCart(), loadProducts()));
    refresh();
    const off = onCartChange(refresh);
    window.addEventListener('sklovera:products-updated', refresh);
    return () => {
      off();
      window.removeEventListener('sklovera:products-updated', refresh);
    };
  }, []);

  const totalEur = useMemo(
    () => items.reduce((sum, i) => sum + (i.priceEurRef ?? 0) * i.quantity, 0),
    [items],
  );

  const canSubmit =
    user.role !== 'guest' &&
    user.role !== 'supplier' &&
    items.length > 0 &&
    shipCountry.trim().length > 0;

  const onSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      submitRfq({
        items,
        buyer: { id: user.id, email: user.email, name: user.displayName },
        shipCountry: shipCountry.trim(),
        shipCity: shipCity.trim() || undefined,
        targetDate: targetDate || undefined,
        notes: notes.trim() || undefined,
      });
      onSubmitted();
    } catch (e) {
      setError((e as Error).message || 'Failed to submit RFQ');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <section className="py-32 px-12">
        <div className="max-w-[720px] mx-auto text-center">
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">RFQ</span>
          <h2 className="font-headline text-5xl italic text-primary mb-4">Your cart is empty</h2>
          <p className="text-on-surface-variant">Browse the catalog and add SKUs to request a quote.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-12">
      <div className="max-w-[1200px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">Request for Quotation</span>
          <h2 className="font-headline text-5xl italic text-primary mb-2">Review & Submit</h2>
          <p className="text-on-surface-variant mb-10 max-w-2xl">
            Your RFQ goes to the Sklovera sourcing desk. Final pricing (freight, duties, tier margins) is
            returned as a formal quote — supplier identities are not shared.
          </p>
        </motion.div>

        {user.role === 'guest' && (
          <div className="mb-8 rounded-lg bg-error-container text-on-error-container px-4 py-3 text-sm flex items-center justify-between">
            <span>You must be signed in to submit an RFQ. Your cart will be preserved.</span>
            <button onClick={onSignIn} className="underline font-semibold">
              Sign in
            </button>
          </div>
        )}
        {user.role === 'supplier' && (
          <div className="mb-8 rounded-lg bg-error-container text-on-error-container px-4 py-3 text-sm">
            Suppliers cannot submit RFQs from this account. Sign in as a buyer.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {items.map((i) => (
              <div key={i.productId} className="flex gap-4 p-4 rounded-lg bg-surface-container-lowest">
                <ProductImage
                  imageKey={i.imageKey}
                  alt={i.name}
                  className="w-24 h-24 object-contain rounded-md bg-surface-container shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] text-on-surface-variant">{i.sku}</div>
                  <div className="font-headline italic text-xl text-primary">{i.name}</div>
                  {i.collection && (
                    <div className="text-[10px] uppercase tracking-wider text-secondary font-semibold">
                      {i.collection}
                    </div>
                  )}
                  <div className="text-sm text-on-surface-variant mt-1">Qty: {i.quantity}</div>
                </div>
                {i.priceEurRef !== undefined && (
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Ref</div>
                    <div className="font-headline text-2xl text-primary">
                      € {(i.priceEurRef * i.quantity).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <aside className="bg-surface-container-low rounded-xl p-6 h-fit sticky top-24 space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                Ship to — country
              </label>
              <input
                value={shipCountry}
                onChange={(e) => setShipCountry(e.target.value)}
                className="mt-2 w-full bg-surface-container-lowest px-4 py-3 rounded-md outline-none border-b border-outline-variant/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                City / port (optional)
              </label>
              <input
                value={shipCity}
                onChange={(e) => setShipCity(e.target.value)}
                placeholder="e.g. Mumbai"
                className="mt-2 w-full bg-surface-container-lowest px-4 py-3 rounded-md outline-none border-b border-outline-variant/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                Target in-hand date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="mt-2 w-full bg-surface-container-lowest px-4 py-3 rounded-md outline-none border-b border-outline-variant/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                Notes to sourcing team
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Branding, packaging, volume flexibility…"
                className="mt-2 w-full bg-surface-container-lowest px-4 py-3 rounded-md outline-none border-b border-outline-variant/30 focus:border-primary resize-none"
              />
            </div>

            <div className="pt-4 border-t border-outline-variant/20">
              <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                Reference subtotal
              </div>
              <div className="font-headline text-3xl text-primary">€ {totalEur.toFixed(2)}</div>
              <div className="text-[10px] text-on-surface-variant mt-1">
                Indicative only. Binding quote returned by sourcing desk.
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-error-container text-on-error-container px-3 py-2 text-xs">
                {error}
              </div>
            )}

            <button
              onClick={onSubmit}
              disabled={!canSubmit || submitting}
              className="w-full bg-primary text-surface py-3 rounded-md font-semibold disabled:opacity-40"
            >
              {submitting ? 'Submitting…' : 'Submit RFQ'}
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default RfqReview;
