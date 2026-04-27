import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  hydrateBag,
  loadBag,
  onBagChange,
  placeOrder,
  type HydratedBagItem,
  type Order,
  type PaymentGateway,
} from '../lib/shop';
import { loadProducts } from '../lib/products';
import { computeUnitPrice, tierFromRole } from '../lib/pricing';
import { gatewayBlurb, gatewayLabel, processPayment } from '../lib/payments';
import { currentUser, onAuthChange, type User } from '../lib/auth';
import ProductImage from './ProductImage';

type Props = { onSignIn: () => void; onOrderPlaced: () => void };

const GATEWAYS: PaymentGateway[] = ['razorpay', 'stripe'];

const Checkout = ({ onSignIn, onOrderPlaced }: Props) => {
  const [user, setUser] = useState<User>(() => currentUser());
  const [items, setItems] = useState<HydratedBagItem[]>([]);
  const [shipping, setShipping] = useState<Order['shipping']>({
    name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal: '',
    country: 'India',
  });
  const [gateway, setGateway] = useState<PaymentGateway>('razorpay');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState<Order | null>(null);

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);
  useEffect(() => {
    const refresh = () => setItems(hydrateBag(loadBag(), loadProducts()));
    refresh();
    return onBagChange(refresh);
  }, []);
  useEffect(() => {
    if (user.displayName && !shipping.name) setShipping((s) => ({ ...s, name: user.displayName }));
  }, [user, shipping.name]);

  const tier = tierFromRole(user.role);
  const totalInr = useMemo(
    () =>
      items.reduce((s, i) => s + computeUnitPrice(i.priceEurRef, tier).inr * i.quantity, 0),
    [items, tier],
  );

  const canPay =
    user.role !== 'guest' &&
    user.role !== 'supplier' &&
    items.length > 0 &&
    shipping.name.trim().length > 0 &&
    shipping.phone.trim().length > 0 &&
    shipping.line1.trim().length > 0 &&
    shipping.city.trim().length > 0 &&
    shipping.state.trim().length > 0 &&
    shipping.postal.trim().length > 0 &&
    shipping.country.trim().length > 0 &&
    !paying;

  const pay = async () => {
    if (!canPay) return;
    setError('');
    setPaying(true);
    try {
      const result = await processPayment(gateway, Math.round(totalInr));
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const order = placeOrder({
        user,
        bag: items,
        shipping,
        gateway: result.gateway,
        transactionId: result.transactionId,
      });
      setPlaced(order);
    } catch (e) {
      setError((e as Error).message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (placed) {
    return (
      <section className="py-24 px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-[720px] mx-auto text-center"
        >
          <span className="text-secondary font-semibold tracking-widest text-xs uppercase block mb-4">
            Payment confirmed
          </span>
          <h2 className="font-headline text-5xl italic text-primary mb-4">Thank you.</h2>
          <p className="text-on-surface-variant mb-8">
            Order <span className="font-mono text-primary">{placed.id}</span> is paid. We've sent a
            receipt to {placed.buyerEmail}. You can track fulfilment from My Orders.
          </p>
          <div className="inline-block bg-surface-container-lowest rounded-xl p-6 text-left mb-8">
            <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Amount</div>
            <div className="font-headline text-4xl text-primary">
              ₹ {placed.payment.amountInr.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-on-surface-variant mt-2">
              {gatewayLabel[placed.payment.gateway]} · txn {placed.payment.transactionId}
            </div>
          </div>
          <div>
            <button
              onClick={onOrderPlaced}
              className="bg-primary text-surface px-8 py-3 rounded-md font-semibold"
            >
              View My Orders →
            </button>
          </div>
        </motion.div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="py-32 px-12">
        <div className="max-w-[720px] mx-auto text-center">
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">Checkout</span>
          <h2 className="font-headline text-5xl italic text-primary mb-4">Your bag is empty</h2>
          <p className="text-on-surface-variant">Browse the catalog to add glassware.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-12">
      <div className="max-w-[1200px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">Checkout</span>
          <h2 className="font-headline text-5xl italic text-primary mb-2">Ship &amp; Pay</h2>
          <p className="text-on-surface-variant mb-10 max-w-2xl">
            Pricing includes freight, duty, and handling. Stock ships from India warehouse first; any
            shortfall is filled via our international supplier network.
          </p>
        </motion.div>

        {user.role === 'guest' && (
          <div className="mb-8 rounded-lg bg-error-container text-on-error-container px-4 py-3 text-sm flex items-center justify-between">
            <span>You must be signed in to place an order. Your bag will be preserved.</span>
            <button onClick={onSignIn} className="underline font-semibold">Sign in</button>
          </div>
        )}
        {user.role === 'supplier' && (
          <div className="mb-8 rounded-lg bg-error-container text-on-error-container px-4 py-3 text-sm">
            Suppliers cannot place orders. Sign in as a customer.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-6">
              <h3 className="font-headline italic text-2xl text-primary mb-4">Shipping address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full name" value={shipping.name} onChange={(v) => setShipping({ ...shipping, name: v })} />
                <Field label="Phone" value={shipping.phone} onChange={(v) => setShipping({ ...shipping, phone: v })} />
                <Field label="Address line 1" value={shipping.line1} onChange={(v) => setShipping({ ...shipping, line1: v })} className="md:col-span-2" />
                <Field label="Address line 2 (optional)" value={shipping.line2 ?? ''} onChange={(v) => setShipping({ ...shipping, line2: v })} className="md:col-span-2" />
                <Field label="City" value={shipping.city} onChange={(v) => setShipping({ ...shipping, city: v })} />
                <Field label="State / region" value={shipping.state} onChange={(v) => setShipping({ ...shipping, state: v })} />
                <Field label="Postal code" value={shipping.postal} onChange={(v) => setShipping({ ...shipping, postal: v })} />
                <Field label="Country" value={shipping.country} onChange={(v) => setShipping({ ...shipping, country: v })} />
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6">
              <h3 className="font-headline italic text-2xl text-primary mb-4">Payment method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {GATEWAYS.map((g) => {
                  const active = gateway === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setGateway(g)}
                      className={`text-left p-5 rounded-lg transition ${
                        active ? 'bg-primary text-surface' : 'bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <div className={`text-[10px] uppercase tracking-widest mb-2 ${active ? 'text-tertiary-fixed' : 'text-secondary'}`}>
                        Secure gateway
                      </div>
                      <div className={`font-headline italic text-2xl ${active ? 'text-surface' : 'text-primary'}`}>
                        {gatewayLabel[g]}
                      </div>
                      <div className={`text-xs mt-1 ${active ? 'text-surface/80' : 'text-on-surface-variant'}`}>
                        {gatewayBlurb[g]}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="text-[11px] text-on-surface-variant mt-4">
                Payment is processed by {gatewayLabel[gateway]}. Sklovera does not store card details.
                (Demo environment — no real charge is made.)
              </div>
            </div>
          </div>

          <aside className="bg-surface-container-low rounded-xl p-6 h-fit sticky top-24 space-y-4">
            <h3 className="font-headline italic text-2xl text-primary">Order summary</h3>
            <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
              {items.map((i) => {
                const unit = computeUnitPrice(i.priceEurRef, tier).inr;
                return (
                  <li key={i.productId} className="flex gap-3">
                    <ProductImage
                      imageKey={i.imageKey}
                      alt={i.name}
                      className="w-14 h-14 object-contain rounded-md bg-surface-container shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="font-mono text-[10px] text-on-surface-variant">{i.sku}</div>
                      <div className="text-primary truncate">{i.name}</div>
                      <div className="text-xs text-on-surface-variant">Qty {i.quantity}</div>
                    </div>
                    <div className="text-right text-sm font-semibold text-primary">
                      ₹ {(unit * i.quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="pt-4 border-t border-outline-variant/20">
              <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Total ({tier.toUpperCase()})</div>
              <div className="font-headline text-3xl text-primary">
                ₹ {totalInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-on-surface-variant mt-1">
                Recomputed against live stock at confirmation.
              </div>
            </div>
            {error && (
              <div className="rounded-md bg-error-container text-on-error-container px-3 py-2 text-xs">
                {error}
              </div>
            )}
            <button
              onClick={pay}
              disabled={!canPay}
              className="w-full bg-primary text-surface py-3 rounded-md font-semibold disabled:opacity-40"
            >
              {paying ? `Contacting ${gatewayLabel[gateway]}…` : `Pay ₹ ${Math.round(totalInr).toLocaleString('en-IN')}`}
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
};

const Field = ({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) => (
  <label className={`block ${className ?? ''}`}>
    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">{label}</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full bg-surface-container-low px-4 py-3 rounded-md outline-none border-b border-outline-variant/30 focus:border-primary"
    />
  </label>
);

export default Checkout;
