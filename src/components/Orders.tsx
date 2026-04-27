import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  loadOrders,
  onOrdersChange,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from '../lib/shop';
import { gatewayLabel } from '../lib/payments';
import { currentUser, onAuthChange, type User } from '../lib/auth';
import ProductImage from './ProductImage';

type Props = { scope: 'mine' | 'admin' };

const STATUS_FLOW: OrderStatus[] = ['paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const STATUS_COLORS: Record<OrderStatus, string> = {
  paid: 'bg-tertiary-fixed/40 text-primary',
  processing: 'bg-secondary-container text-on-secondary-container',
  shipped: 'bg-primary text-surface',
  delivered: 'bg-secondary text-on-secondary',
  cancelled: 'bg-error-container text-on-error-container',
  refunded: 'bg-surface-container-high text-on-surface-variant',
};

const fmt = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const Orders = ({ scope }: Props) => {
  const [user, setUser] = useState<User>(() => currentUser());
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);
  useEffect(() => {
    const refresh = () => setOrders(loadOrders());
    refresh();
    return onOrdersChange(refresh);
  }, []);

  const visible = useMemo(() => {
    let list = orders;
    if (scope === 'mine') list = list.filter((o) => o.buyerId === user.id);
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);
    return list;
  }, [orders, scope, statusFilter, user.id]);

  const selected = useMemo(() => orders.find((o) => o.id === selectedId) ?? null, [orders, selectedId]);

  const counts = useMemo(() => {
    const base = scope === 'mine' ? orders.filter((o) => o.buyerId === user.id) : orders;
    const c: Record<OrderStatus | 'all', number> = {
      all: base.length,
      paid: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, refunded: 0,
    };
    for (const o of base) c[o.status]++;
    return c;
  }, [orders, scope, user.id]);

  if (scope === 'mine' && (user.role === 'guest' || user.role === 'supplier')) {
    return (
      <section className="py-32 px-12 text-center">
        <h2 className="font-headline text-4xl italic text-primary mb-4">Sign in to see your orders</h2>
      </section>
    );
  }
  if (scope === 'admin' && user.role !== 'admin') {
    return (
      <section className="py-32 px-12 text-center">
        <h2 className="font-headline text-4xl italic text-primary mb-4">Admin access only</h2>
      </section>
    );
  }

  return (
    <section className="py-20 px-12">
      <div className="max-w-[1600px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">
            {scope === 'admin' ? 'Administration' : 'Account'}
          </span>
          <h2 className="font-headline text-5xl italic text-primary mb-8">
            {scope === 'admin' ? 'Orders Queue' : 'My Orders'}
          </h2>
        </motion.div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {(['all', ...STATUS_FLOW] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
                statusFilter === s ? 'bg-primary text-surface' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {s}
              <span className="ml-2 opacity-70">{counts[s]}</span>
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-xl bg-surface-container-low p-12 text-center text-on-surface-variant">
            No orders in this view.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ul className="lg:col-span-1 space-y-3">
              {visible.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => setSelectedId(o.id)}
                    className={`w-full text-left p-5 rounded-xl transition ${
                      selectedId === o.id
                        ? 'bg-primary text-surface'
                        : 'bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono text-[11px] ${selectedId === o.id ? 'text-surface/80' : 'text-on-surface-variant'}`}>
                        {o.id}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_COLORS[o.status]}`}>
                        {o.status}
                      </span>
                    </div>
                    <div className={`font-headline italic text-xl ${selectedId === o.id ? 'text-surface' : 'text-primary'}`}>
                      ₹ {o.payment.amountInr.toLocaleString('en-IN')}
                    </div>
                    {scope === 'admin' && (
                      <div className={`text-xs mt-1 ${selectedId === o.id ? 'text-surface/70' : 'text-on-surface-variant'}`}>
                        {o.buyerName} · {gatewayLabel[o.payment.gateway]}
                      </div>
                    )}
                    <div className={`text-xs mt-2 ${selectedId === o.id ? 'text-surface/70' : 'text-on-surface-variant'}`}>
                      {fmt(o.createdAt)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <div className="lg:col-span-2">
              {selected ? (
                <div className="bg-surface-container-lowest rounded-xl p-8 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-xs text-on-surface-variant">{selected.id}</div>
                      <h3 className="font-headline text-3xl italic text-primary">
                        ₹ {selected.payment.amountInr.toLocaleString('en-IN')}
                      </h3>
                      <div className="text-xs text-on-surface-variant mt-1">
                        Placed {fmt(selected.createdAt)} · {gatewayLabel[selected.payment.gateway]} txn{' '}
                        <span className="font-mono">{selected.payment.transactionId}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded ${STATUS_COLORS[selected.status]}`}>
                      {selected.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2">
                      <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Ship to</div>
                      <div className="text-primary">
                        {selected.shipping.name} · {selected.shipping.phone}<br />
                        {selected.shipping.line1}{selected.shipping.line2 ? `, ${selected.shipping.line2}` : ''}<br />
                        {selected.shipping.city}, {selected.shipping.state} {selected.shipping.postal}<br />
                        {selected.shipping.country}
                      </div>
                    </div>
                    {scope === 'admin' && (
                      <div className="col-span-2">
                        <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Buyer</div>
                        <div className="text-primary">{selected.buyerName} · {selected.buyerEmail}</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {selected.lines.map((l) => (
                      <div key={l.productId} className="flex gap-4 p-3 rounded-lg bg-surface-container-low">
                        <ProductImage
                          imageKey={l.imageKey}
                          alt={l.name}
                          className="w-16 h-16 object-contain rounded-md bg-surface-container shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[10px] text-on-surface-variant">{l.sku}</div>
                          <div className="font-semibold text-primary">{l.name}</div>
                          <div className="text-xs text-on-surface-variant">Qty {l.quantity}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {l.fromIndia > 0 && (
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container">
                                {l.fromIndia.toLocaleString()} ex India
                              </span>
                            )}
                            {l.fromIntl > 0 && (
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-tertiary-fixed/40 text-primary">
                                {l.fromIntl.toLocaleString()} import
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Line</div>
                          <div className="text-sm font-semibold text-primary">
                            ₹ {l.lineFinalInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {scope === 'admin' && (
                    <div className="border-t border-outline-variant/20 pt-6 space-y-3">
                      <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                        Admin actions
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(['processing', 'shipped', 'delivered'] as OrderStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateOrderStatus(selected.id, s)}
                            className="px-3 py-2 rounded-md text-xs font-semibold bg-surface-container-low text-primary hover:bg-surface-container"
                          >
                            Mark {s}
                          </button>
                        ))}
                        <button
                          onClick={() => updateOrderStatus(selected.id, 'cancelled')}
                          className="px-3 py-2 rounded-md text-xs font-semibold bg-error-container text-on-error-container"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => updateOrderStatus(selected.id, 'refunded')}
                          className="px-3 py-2 rounded-md text-xs font-semibold bg-surface-container-low text-on-surface-variant"
                        >
                          Refund
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-surface-container-low rounded-xl p-12 text-center text-on-surface-variant">
                  Select an order to view details.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Orders;
