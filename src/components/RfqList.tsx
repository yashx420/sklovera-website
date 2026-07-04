import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  loadRfqs,
  onRfqChange,
  updateRfqStatus,
  sendToVendor,
  vendorCounter,
  vendorApprove,
  type Rfq,
  type RfqStatus,
} from '../lib/rfq';
import { currentUser, onAuthChange, type User } from '../lib/auth';
import { computeQuote, loadPricingConfig, type Tier } from '../lib/pricing';
import { generateQuotePdf } from '../lib/quotePdf';
import { planFulfillment, type FulfillmentPlan } from '../lib/fulfillment';
import { loadProducts } from '../lib/products';
import ProductImage from './ProductImage';

type Props = { scope: 'mine' | 'admin' | 'vendor' };

const STATUS_COLORS: Record<RfqStatus, string> = {
  submitted: 'bg-tertiary-fixed/40 text-primary',
  in_review: 'bg-secondary-container text-on-secondary-container',
  vendor_review: 'bg-tertiary-fixed/40 text-primary',
  vendor_countered: 'bg-secondary-container text-on-secondary-container',
  quoted: 'bg-primary text-surface',
  accepted: 'bg-secondary-container text-on-secondary-container',
  declined: 'bg-error-container text-on-error-container',
  closed: 'bg-surface-container-high text-on-surface-variant',
};

const STATUS_FLOW: RfqStatus[] = ['submitted', 'in_review', 'vendor_review', 'vendor_countered', 'quoted', 'accepted', 'declined', 'closed'];

const fmtDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const RfqList = ({ scope }: Props) => {
  const [user, setUser] = useState<User>(() => currentUser());
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RfqStatus | 'all'>('all');
  const [quoteTotal, setQuoteTotal] = useState<string>('');
  const [negNote, setNegNote] = useState<string>('');
  const [tierOverride, setTierOverride] = useState<Tier>('b2b');

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);
  useEffect(() => {
    const refresh = () => setRfqs(loadRfqs());
    refresh();
    return onRfqChange(refresh);
  }, []);

  // productId → owning vendor (id + name), for vendor scoping and routing.
  const productVendor = useMemo(() => {
    const m = new Map<string, { id: string; name: string }>();
    for (const p of loadProducts()) if (p.supplierId) m.set(p.id, { id: p.supplierId, name: p.supplier ?? p.supplierId });
    return m;
  }, [rfqs]);

  const rfqVendors = (r: Rfq) => {
    const seen = new Map<string, string>();
    for (const i of r.items) {
      const v = productVendor.get(i.productId);
      if (v) seen.set(v.id, v.name);
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  };

  const visible = useMemo(() => {
    let list = rfqs;
    if (scope === 'mine') list = list.filter((r) => r.buyerId === user.id);
    if (scope === 'vendor') list = list.filter((r) => r.items.some((i) => productVendor.get(i.productId)?.id === user.id));
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    return list;
  }, [rfqs, scope, statusFilter, user.id, productVendor]);

  const selected = useMemo(() => rfqs.find((r) => r.id === selectedId) ?? null, [rfqs, selectedId]);

  const fulfillmentPlans: FulfillmentPlan[] = useMemo(() => {
    if (!selected) return [];
    return planFulfillment(selected.items, loadProducts());
  }, [selected, rfqs]);
  const planById = useMemo(
    () => new Map(fulfillmentPlans.map((p) => [p.productId, p])),
    [fulfillmentPlans],
  );
  const hasShortfall = fulfillmentPlans.some((p) => p.shortfall > 0);

  useEffect(() => {
    if (!selected) {
      setQuoteTotal('');
      setNegNote('');
      return;
    }
    setQuoteTotal(selected.quoteTotalEur !== undefined ? String(selected.quoteTotalEur) : '');
    setNegNote('');
    setTierOverride(selected.quoteTier ?? 'b2b');
  }, [selectedId, selected]);

  const suggestQuote = () => {
    if (!selected) return;
    const plans = planFulfillment(selected.items, loadProducts());
    const q = computeQuote(selected.items, tierOverride, loadPricingConfig(), plans);
    setQuoteTotal(String(q.totalEur));
  };

  const parsedTotal = () => {
    const n = parseFloat(quoteTotal);
    return Number.isFinite(n) ? n : NaN;
  };

  const doSendToVendor = () => {
    if (!selected) return;
    const n = parsedTotal();
    if (!Number.isFinite(n)) return;
    sendToVendor(selected.id, { totalEur: n, note: negNote || undefined, byName: user.displayName, vendorId: rfqVendors(selected)[0]?.id });
    setNegNote('');
  };

  const doVendorCounter = () => {
    if (!selected) return;
    const n = parsedTotal();
    if (!Number.isFinite(n)) return;
    vendorCounter(selected.id, { totalEur: n, note: negNote || undefined, byName: user.displayName });
    setNegNote('');
  };

  const doVendorApprove = () => {
    if (!selected) return;
    vendorApprove(selected.id, { byName: user.displayName, note: negNote || undefined, fxEurToInr: loadPricingConfig().fxEurToInr });
    setNegNote('');
  };

  const downloadPdf = () => {
    if (!selected || !selected.quoteBreakdown) return;
    generateQuotePdf(selected, selected.quoteBreakdown);
  };

  const counts = useMemo(() => {
    const base = scope === 'mine' ? rfqs.filter((r) => r.buyerId === user.id) : rfqs;
    const c: Record<RfqStatus | 'all', number> = {
      all: base.length,
      submitted: 0, in_review: 0, vendor_review: 0, vendor_countered: 0, quoted: 0, accepted: 0, declined: 0, closed: 0,
    };
    for (const r of base) c[r.status]++;
    return c;
  }, [rfqs, scope, user.id]);

  if (scope === 'mine' && (user.role === 'guest' || user.role === 'supplier')) {
    return (
      <section className="py-20 sm:py-32 px-5 sm:px-8 lg:px-12 text-center">
        <h2 className="font-headline text-3xl sm:text-4xl italic text-primary mb-4">Sign in to see your RFQs</h2>
        <p className="text-on-surface-variant">Only buyers can submit and track RFQs.</p>
      </section>
    );
  }
  if (scope === 'admin' && user.role !== 'admin') {
    return (
      <section className="py-20 sm:py-32 px-5 sm:px-8 lg:px-12 text-center">
        <h2 className="font-headline text-3xl sm:text-4xl italic text-primary mb-4">Admin access only</h2>
        <p className="text-on-surface-variant">Sign in as admin to manage the RFQ queue.</p>
      </section>
    );
  }
  if (scope === 'vendor' && user.role !== 'supplier') {
    return (
      <section className="py-20 sm:py-32 px-5 sm:px-8 lg:px-12 text-center">
        <h2 className="font-headline text-3xl sm:text-4xl italic text-primary mb-4">Supplier access only</h2>
        <p className="text-on-surface-variant">Sign in as a supplier to review RFQ quotes.</p>
      </section>
    );
  }

  return (
    <section className="py-20 px-5 sm:px-8 lg:px-12">
      <div className="max-w-[1600px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">
            {scope === 'admin' ? 'Administration' : scope === 'vendor' ? 'Supplier Portal' : 'Procurement'}
          </span>
          <h2 className="font-headline text-3xl sm:text-5xl italic text-primary mb-8">
            {scope === 'admin' ? 'RFQ Queue' : scope === 'vendor' ? 'Quote Approvals' : 'My RFQs'}
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
              {s.replace('_', ' ')}
              <span className="ml-2 opacity-70">{counts[s]}</span>
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-xl bg-surface-container-low p-12 text-center text-on-surface-variant">
            No RFQs in this view.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ul className="lg:col-span-1 space-y-3">
              {visible.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left p-5 rounded-xl transition ${
                      selectedId === r.id
                        ? 'bg-primary text-surface'
                        : 'bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono text-[11px] ${selectedId === r.id ? 'text-surface/80' : 'text-on-surface-variant'}`}>
                        {r.id}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_COLORS[r.status]}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className={`font-headline italic text-xl ${selectedId === r.id ? 'text-surface' : 'text-primary'}`}>
                      {r.items.length} {r.items.length === 1 ? 'line' : 'lines'} · {r.shipCountry}
                    </div>
                    {scope === 'admin' && (
                      <div className={`text-xs mt-1 ${selectedId === r.id ? 'text-surface/70' : 'text-on-surface-variant'}`}>
                        {r.buyerName}
                      </div>
                    )}
                    <div className={`text-xs mt-2 ${selectedId === r.id ? 'text-surface/70' : 'text-on-surface-variant'}`}>
                      Submitted {fmtDate(r.createdAt)}
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
                        {selected.items.length} {selected.items.length === 1 ? 'line item' : 'line items'}
                      </h3>
                      <div className="text-xs text-on-surface-variant mt-1">
                        Submitted {fmtDate(selected.createdAt)}
                        {selected.updatedAt !== selected.createdAt &&
                          ` · updated ${fmtDate(selected.updatedAt)}`}
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded ${STATUS_COLORS[selected.status]}`}>
                      {selected.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Ship to</div>
                      <div className="text-primary">
                        {selected.shipCity ? `${selected.shipCity}, ` : ''}
                        {selected.shipCountry}
                      </div>
                    </div>
                    {selected.targetDate && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Target date</div>
                        <div className="text-primary">{selected.targetDate}</div>
                      </div>
                    )}
                    {scope === 'admin' && (
                      <div className="col-span-2">
                        <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Buyer</div>
                        <div className="text-primary">{selected.buyerName} · {selected.buyerEmail}</div>
                      </div>
                    )}
                    {selected.notes && (
                      <div className="col-span-2">
                        <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Notes</div>
                        <div className="text-primary">{selected.notes}</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {selected.items.map((i) => {
                      const plan = planById.get(i.productId);
                      return (
                        <div key={i.productId} className="flex gap-4 p-3 rounded-lg bg-surface-container-low">
                          <ProductImage
                            imageKey={i.imageKey}
                            alt={i.name}
                            className="w-16 h-16 object-contain rounded-md bg-surface-container shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-[10px] text-on-surface-variant">{i.sku}</div>
                            <div className="font-semibold text-primary">{i.name}</div>
                            <div className="text-xs text-on-surface-variant">Qty {i.quantity}</div>
                            {plan && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {plan.fromIndia > 0 && (
                                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container">
                                    {plan.fromIndia.toLocaleString()} ex India
                                  </span>
                                )}
                                {plan.fromIntl > 0 && (
                                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-tertiary-fixed/40 text-primary">
                                    {plan.fromIntl.toLocaleString()} import
                                  </span>
                                )}
                                {plan.shortfall > 0 && (
                                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-error-container text-on-error-container">
                                    {plan.shortfall.toLocaleString()} backorder
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {i.priceEurRef !== undefined && (
                            <div className="text-right">
                              <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Ref</div>
                              <div className="text-sm font-semibold text-primary">
                                € {(i.priceEurRef * i.quantity).toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {scope === 'admin' && hasShortfall && (
                    <div className="rounded-md bg-error-container text-on-error-container px-4 py-3 text-xs">
                      One or more lines are on backorder — combined India + import stock is insufficient.
                      The quote below prices only the fulfillable portion.
                    </div>
                  )}

                  {selected.status === 'quoted' && selected.quoteBreakdown && (
                    <div className="p-5 rounded-lg bg-secondary-container text-on-secondary-container space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider mb-1">
                            Quote total · Tier {selected.quoteBreakdown.tier.toUpperCase()}
                          </div>
                          <div className="font-headline text-3xl sm:text-4xl">
                            € {selected.quoteBreakdown.totalEur.toFixed(2)}
                          </div>
                          <div className="text-sm opacity-80">
                            ₹ {selected.quoteBreakdown.totalInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            {' · '}FX 1 EUR = {selected.quoteBreakdown.fxEurToInr}
                          </div>
                        </div>
                        <button
                          onClick={downloadPdf}
                          className="text-xs font-semibold px-3 py-2 rounded-md bg-primary text-surface"
                        >
                          Download PDF
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="bg-secondary text-on-secondary px-2 py-1 rounded uppercase tracking-wider">
                          {selected.quoteBreakdown.totalUnitsIndia.toLocaleString()} ex India
                        </span>
                        <span className="bg-primary text-surface px-2 py-1 rounded uppercase tracking-wider">
                          {selected.quoteBreakdown.totalUnitsIntl.toLocaleString()} import
                        </span>
                      </div>
                      <details className="text-xs">
                        <summary className="cursor-pointer font-semibold uppercase tracking-wider">
                          Breakdown
                        </summary>
                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                          <span>Subtotal EXW</span><span className="text-right">€ {selected.quoteBreakdown.subtotalExwEur.toFixed(2)}</span>
                          <span>Freight (import only)</span><span className="text-right">€ {selected.quoteBreakdown.freightEur.toFixed(2)}</span>
                          <span>Duty (import only)</span><span className="text-right">€ {selected.quoteBreakdown.dutyEur.toFixed(2)}</span>
                          <span>Handling</span><span className="text-right">€ {selected.quoteBreakdown.handlingEur.toFixed(2)}</span>
                          <span>Landed subtotal</span><span className="text-right">€ {selected.quoteBreakdown.landedSubtotalEur.toFixed(2)}</span>
                          <span>Margin</span><span className="text-right">€ {selected.quoteBreakdown.marginEur.toFixed(2)}</span>
                          {selected.quoteBreakdown.discountEur > 0 && (
                            <>
                              <span>
                                Volume discount ({(selected.quoteBreakdown.volumeBreak.discountPct * 100).toFixed(1)}%)
                              </span>
                              <span className="text-right">– € {selected.quoteBreakdown.discountEur.toFixed(2)}</span>
                            </>
                          )}
                          {selected.quoteBreakdown.palletCount > 0 && (
                            <>
                              <span>
                                Pallet surcharge ({selected.quoteBreakdown.palletCount} pallet{selected.quoteBreakdown.palletCount === 1 ? '' : 's'})
                              </span>
                              <span className="text-right">
                                ₹ {selected.quoteBreakdown.palletSurchargeInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </span>
                            </>
                          )}
                        </div>
                      </details>
                      {selected.adminNote && <div className="text-sm">{selected.adminNote}</div>}
                    </div>
                  )}
                  {selected.status === 'quoted' && !selected.quoteBreakdown && selected.quoteTotalEur !== undefined && (
                    <div className="p-4 rounded-lg bg-secondary-container text-on-secondary-container">
                      <div className="text-[10px] uppercase tracking-wider mb-1">Quote total</div>
                      <div className="font-headline text-3xl">€ {selected.quoteTotalEur.toFixed(2)}</div>
                      {selected.adminNote && <div className="text-sm mt-2">{selected.adminNote}</div>}
                    </div>
                  )}

                  {/* Admin ↔ vendor counter-quote history */}
                  {(scope === 'admin' || scope === 'vendor') && selected.vendorThread && selected.vendorThread.length > 0 && (
                    <div className="border-t border-outline-variant/20 pt-6 space-y-3">
                      <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Vendor negotiation</div>
                      <div className="space-y-2">
                        {selected.vendorThread.map((m, idx) => (
                          <div key={idx} className={`flex ${m.by === 'vendor' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${m.by === 'vendor' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-low text-primary'}`}>
                              <div className="text-[10px] uppercase tracking-wider opacity-70">
                                {m.by === 'vendor' ? (m.byName ?? 'Vendor') : 'Sklovera'}{m.approved ? ' · approved ✓' : ''}
                              </div>
                              <div className="font-headline text-lg">€ {m.totalEur.toFixed(2)}</div>
                              {m.note && <div className="text-xs opacity-80 mt-0.5">{m.note}</div>}
                              <div className="text-[9px] opacity-50 mt-1">{fmtDate(m.at)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {scope === 'admin' && (
                    <div className="border-t border-outline-variant/20 pt-6 space-y-4">
                      <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Admin actions</div>
                      <div className="text-xs text-on-surface-variant">
                        Vendor(s): <span className="text-primary font-medium">{rfqVendors(selected).map((v) => v.name).join(', ') || '—'}</span>
                      </div>

                      {selected.status === 'quoted' ? (
                        <div className="rounded-md bg-secondary-container text-on-secondary-container px-4 py-3 text-sm">
                          ✓ Vendor approved — the quote is now with the buyer.
                        </div>
                      ) : selected.status === 'vendor_review' ? (
                        <div className="rounded-md bg-tertiary-fixed/30 text-primary px-4 py-3 text-sm">
                          ⏳ Awaiting vendor approval · proposed € {selected.quoteTotalEur?.toFixed(2)}. You can re-send a new figure below.
                        </div>
                      ) : null}

                      {selected.status !== 'quoted' && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-on-surface-variant">Pricing tier</label>
                              <select
                                value={tierOverride}
                                onChange={(e) => setTierOverride(e.target.value as Tier)}
                                className="mt-1 w-full bg-surface-container-low px-3 py-2 rounded-md outline-none text-sm"
                              >
                                <option value="b2b">B2B</option>
                                <option value="retail">Retail</option>
                                <option value="b2c">B2C</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-on-surface-variant">Quote total (EUR)</label>
                              <input
                                type="number"
                                value={quoteTotal}
                                onChange={(e) => setQuoteTotal(e.target.value)}
                                placeholder="Suggest from engine"
                                className="mt-1 w-full bg-surface-container-low px-3 py-2 rounded-md outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-on-surface-variant">Message to vendor</label>
                              <input
                                value={negNote}
                                onChange={(e) => setNegNote(e.target.value)}
                                placeholder="Target landed price…"
                                className="mt-1 w-full bg-surface-container-low px-3 py-2 rounded-md outline-none text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={suggestQuote} className="px-4 py-2 rounded-md text-xs font-semibold bg-surface-container-low text-primary hover:bg-surface-container">
                              Suggest from engine
                            </button>
                            <button
                              onClick={doSendToVendor}
                              disabled={!Number.isFinite(parsedTotal())}
                              className="px-4 py-2 rounded-md text-xs font-semibold bg-primary text-surface disabled:opacity-40"
                            >
                              {selected.status === 'vendor_countered' ? 'Send back to vendor' : 'Send to vendor for approval'}
                            </button>
                          </div>
                          <div className="text-[11px] text-on-surface-variant">The vendor must approve before the quote is sent to the buyer.</div>
                        </>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/10">
                        {selected.status === 'submitted' && (
                          <button onClick={() => updateRfqStatus(selected.id, 'in_review')} className="px-4 py-2 rounded-md text-xs font-semibold bg-surface-container-low text-primary hover:bg-surface-container">
                            Mark in review
                          </button>
                        )}
                        <button onClick={() => updateRfqStatus(selected.id, 'declined', { adminNote: negNote || undefined })} className="px-4 py-2 rounded-md text-xs font-semibold bg-error-container text-on-error-container">
                          Decline
                        </button>
                        <button onClick={() => updateRfqStatus(selected.id, 'closed')} className="px-4 py-2 rounded-md text-xs font-semibold bg-surface-container-low text-on-surface-variant">
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {scope === 'vendor' && (
                    <div className="border-t border-outline-variant/20 pt-6 space-y-4">
                      <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Your response</div>
                      {selected.status === 'vendor_review' ? (
                        <>
                          <div className="rounded-md bg-surface-container-low px-4 py-3">
                            <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Sklovera proposes</div>
                            <div className="font-headline text-3xl text-primary">€ {selected.quoteTotalEur?.toFixed(2)}</div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-on-surface-variant">Counter total (EUR)</label>
                              <input
                                type="number"
                                value={quoteTotal}
                                onChange={(e) => setQuoteTotal(e.target.value)}
                                className="mt-1 w-full bg-surface-container-lowest px-3 py-2 rounded-md outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-on-surface-variant">Message</label>
                              <input
                                value={negNote}
                                onChange={(e) => setNegNote(e.target.value)}
                                placeholder="Lead time 6 weeks…"
                                className="mt-1 w-full bg-surface-container-lowest px-3 py-2 rounded-md outline-none text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={doVendorApprove} className="px-4 py-2 rounded-md text-xs font-semibold bg-secondary text-on-secondary">
                              Approve &amp; send to buyer
                            </button>
                            <button
                              onClick={doVendorCounter}
                              disabled={!Number.isFinite(parsedTotal())}
                              className="px-4 py-2 rounded-md text-xs font-semibold bg-primary text-surface disabled:opacity-40"
                            >
                              Counter
                            </button>
                          </div>
                          <div className="text-[11px] text-on-surface-variant">Approving sends the quote to the buyer at € {selected.quoteTotalEur?.toFixed(2)}.</div>
                        </>
                      ) : selected.status === 'vendor_countered' ? (
                        <div className="rounded-md bg-secondary-container text-on-secondary-container px-4 py-3 text-sm">
                          Your counter of € {selected.quoteTotalEur?.toFixed(2)} was sent. Awaiting Sklovera's response.
                        </div>
                      ) : selected.status === 'quoted' ? (
                        <div className="rounded-md bg-secondary-container text-on-secondary-container px-4 py-3 text-sm">
                          ✓ You approved this quote — it's now with the buyer.
                        </div>
                      ) : (
                        <div className="text-sm text-on-surface-variant">No action needed yet. Sklovera will send a quote for your approval.</div>
                      )}
                    </div>
                  )}

                  {scope === 'mine' && selected.status === 'quoted' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateRfqStatus(selected.id, 'accepted')}
                        className="flex-1 bg-secondary text-on-secondary py-3 rounded-md font-semibold"
                      >
                        Accept quote
                      </button>
                      <button
                        onClick={() => updateRfqStatus(selected.id, 'declined')}
                        className="flex-1 bg-error-container text-on-error-container py-3 rounded-md font-semibold"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-surface-container-low rounded-xl p-12 text-center text-on-surface-variant">
                  Select an RFQ to view details.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RfqList;
