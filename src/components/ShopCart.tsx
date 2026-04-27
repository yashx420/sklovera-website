import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  clearBag,
  hydrateBag,
  loadBag,
  onBagChange,
  removeFromBag,
  updateBagQty,
  type HydratedBagItem,
} from '../lib/shop';
import { loadProducts } from '../lib/products';
import { computeUnitPrice, tierFromRole } from '../lib/pricing';
import { currentUser, onAuthChange, type User } from '../lib/auth';
import ProductImage from './ProductImage';

type Props = { open: boolean; onClose: () => void; onCheckout: () => void };

const ShopCart = ({ open, onClose, onCheckout }: Props) => {
  const [user, setUser] = useState<User>(() => currentUser());
  const [items, setItems] = useState<HydratedBagItem[]>([]);

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);
  useEffect(() => {
    const refresh = () => setItems(hydrateBag(loadBag(), loadProducts()));
    refresh();
    const off = onBagChange(refresh);
    window.addEventListener('sklovera:products-updated', refresh);
    return () => {
      off();
      window.removeEventListener('sklovera:products-updated', refresh);
    };
  }, []);

  const tier = tierFromRole(user.role);
  const totalInr = useMemo(
    () =>
      items.reduce(
        (s, i) => s + computeUnitPrice(i.priceEurRef, tier).inr * i.quantity,
        0,
      ),
    [items, tier],
  );
  const totalQty = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/30 z-50"
            onClick={onClose}
          />
          <motion.aside
            key="bag"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 160, damping: 24 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] z-50 overflow-hidden flex flex-col"
            style={{
              background: 'rgba(250, 249, 247, 0.94)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0px 24px 48px rgba(26, 28, 27, 0.12)',
            }}
          >
            <div className="p-8 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-on-surface-variant">Shopping bag</div>
                <h3 className="font-headline text-3xl italic text-primary">
                  {totalQty} {totalQty === 1 ? 'item' : 'items'}
                </h3>
              </div>
              <button onClick={onClose} className="text-on-surface-variant hover:text-primary text-xl">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-4">
              {items.length === 0 ? (
                <div className="text-center text-on-surface-variant py-20">
                  <div className="text-sm">Your bag is empty.</div>
                  <div className="text-xs mt-2">Browse the catalog to add glassware.</div>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((i) => {
                    const unit = computeUnitPrice(i.priceEurRef, tier).inr;
                    return (
                      <li key={i.productId} className="flex gap-4 p-3 rounded-lg bg-surface-container-lowest">
                        <ProductImage
                          imageKey={i.imageKey}
                          alt={i.name}
                          className="w-20 h-20 object-contain rounded-md bg-surface-container shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[10px] text-on-surface-variant">{i.sku}</div>
                          <div className="font-headline italic text-lg text-primary leading-tight truncate">
                            {i.name}
                          </div>
                          {i.inStock === 0 && (
                            <div className="text-[10px] uppercase tracking-wider text-on-error-container">
                              Out of stock — will ship as backorder
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center bg-surface-container rounded-md overflow-hidden">
                              <button onClick={() => updateBagQty(i.productId, i.quantity - 1)} className="px-2 py-1 text-primary hover:bg-surface-container-high">–</button>
                              <input
                                type="number"
                                min={1}
                                value={i.quantity}
                                onChange={(e) => {
                                  const n = parseInt(e.target.value, 10);
                                  if (!Number.isNaN(n)) updateBagQty(i.productId, n);
                                }}
                                className="w-12 bg-transparent text-center text-sm outline-none"
                              />
                              <button onClick={() => updateBagQty(i.productId, i.quantity + 1)} className="px-2 py-1 text-primary hover:bg-surface-container-high">+</button>
                            </div>
                            <button
                              onClick={() => removeFromBag(i.productId)}
                              className="text-[11px] text-on-surface-variant hover:text-primary hover:underline"
                            >
                              Remove
                            </button>
                            <div className="ml-auto text-right">
                              <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Line</div>
                              <div className="text-sm font-semibold text-primary">
                                ₹ {(unit * i.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-outline-variant/20 p-8 space-y-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Subtotal · {tier.toUpperCase()} pricing</div>
                  <div className="font-headline text-3xl text-primary">
                    ₹ {totalInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px] text-on-surface-variant mt-1">
                    Inclusive of freight, duty, and handling. Final total is re-calculated at checkout using live inventory split.
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onCheckout}
                    className="flex-1 bg-primary text-surface py-3 rounded-md font-semibold"
                  >
                    Checkout
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Clear all items from your bag?')) clearBag();
                    }}
                    className="px-4 py-3 rounded-md text-on-surface-variant hover:text-primary text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShopCart;
