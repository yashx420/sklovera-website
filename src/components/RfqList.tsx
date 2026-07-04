import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  loadRfqs,
  onRfqChange,
  updateRfqStatus,
  ensureSegments,
  segmentSendToVendor,
  segmentVendorCounter,
  segmentVendorApprove,
  type Rfq,
  type RfqStatus,
  type VendorSegment,
} from '../lib/rfq';
import { currentUser, onAuthChange, type User } from '../lib/auth';
import { loadPricingConfig } from '../lib/pricing';
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

const SEG_COLORS: Record<VendorSegment['status'], string> = {
  pending: 'bg-surface-container-high text-on-surface-variant',
  vendor_review: 'bg-tertiary-fixed/40 text-primary',
  vendor_countered: 'bg-secondary-container text-on-secondary-container',
  approved: 'bg-secondary-container text-on-secondary-container',
};

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
  // Per-segment negotiation drafts, keyed `${rfqId}:${vendorId}`.
  const [segDrafts, setSegDrafts] = useState<Record<string, { total: string; note: string; discount: string }>>({});

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

  // Group an RFQ's line items by owning vendor → segment definitions.
  const rfqGroups = (r: Rfq) => {
    const m = new Map<string, { vendorId: string; vendorName: string; productIds: string[] }>();
    for (const i of r.items) {
      const v = productVendor.get(i.productId);
      if (!v) continue;
      const g = m.get(v.id) ?? { vendorId: v.id, vendorName: v.name, productIds: [] };
      g.productIds.push(i.productId);
      m.set(v.id, g);
    }
    return Array.from(m.values());
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

  // Initialize per-vendor segments for admin/vendor views (idempotent).
  useEffect(() => {
    if (!selected) return;
    if ((scope === 'admin' || scope === 'vendor') && (!selected.segments || !selected.segments.length)) {
      const groups = rfqGroups(selected);
      if (groups.length) ensureSegments(selected.id, groups);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected, scope]);

  const draftKey = (rfqId: string, vendorId: string) => `${rfqId}:${vendorId}`;
  const emptyDraft = { total: '', note: '', discount: '' };
  const getDraft = (rfqId: string, seg: VendorSegment) =>
    segDrafts[draftKey(rfqId, seg.vendorId)] ?? {
      ...emptyDraft,
      total: seg.currentTotalEur !== undefined ? String(seg.currentTotalEur) : '',
    };
  const setDraft = (rfqId: string, vendorId: string, patch: Partial<{ total: string; note: string; discount: string }>) =>
    setSegDrafts((d) => {
      const k = draftKey(rfqId, vendorId);
      return { ...d, [k]: { ...(d[k] ?? emptyDraft), ...patch } };
    });
  const clearDraft = (rfqId: string, vendorId: string) =>
    setSegDrafts((d) => { const n = { ...d }; delete n[draftKey(rfqId, vendorId)]; return n; });

  const segItems = (r: Rfq, seg: VendorSegment) => r.items.filter((i) => seg.productIds.includes(i.productId));
  // List price for a vendor's lines (reference EUR × quantity).
  const segRefSubtotal = (r: Rfq, seg: VendorSegment) =>
    Math.round(segItems(r, seg).reduce((s, i) => s + (i.priceEurRef ?? 0) * i.quantity, 0) * 100) / 100;
  const segDiscountPct = (r: Rfq, seg: VendorSegment) =>
    Math.min(100, Math.max(0, parseFloat(getDraft(r.id, seg).discount || '') || 0));

  // Admin adds a discount % off the vendor's list price and sends it for review.
  const sendSeg = (r: Rfq, seg: VendorSegment) => {
    const list = segRefSubtotal(r, seg);
    const pct = segDiscountPct(r, seg);
    const total = Math.round(list * (1 - pct / 100) * 100) / 100;
    const note = getDraft(r.id, seg).note || `${pct}% off list (€ ${list.toFixed(2)})`;
    segmentSendToVendor(r.id, seg.vendorId, { totalEur: total, note, byName: user.displayName });
    clearDraft(r.id, seg.vendorId);
  };
  const counterSeg = (r: Rfq, seg: VendorSegment) => {
    const n = parseFloat(getDraft(r.id, seg).total);
    if (!Number.isFinite(n)) return;
    segmentVendorCounter(r.id, seg.vendorId, { totalEur: n, note: getDraft(r.id, seg).note || undefined, byName: user.displayName });
    clearDraft(r.id, seg.vendorId);
  };
  const approveSeg = (r: Rfq, seg: VendorSegment) => {
    segmentVendorApprove(r.id, seg.vendorId, { byName: user.displayName, note: getDraft(r.id, seg).note || undefined, fxEurToInr: loadPricingConfig().fxEurToInr });
    clearDraft(r.id, seg.vendorId);
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

                  {scope !== 'vendor' && (
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
                  )}

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

                  {/* Per-vendor negotiation segments (admin sees all, vendor sees their own) */}
                  {(scope === 'admin' || scope === 'vendor') && (() => {
                    const allSegs = selected.segments ?? [];
                    const segs = allSegs.filter((s) => scope === 'admin' || s.vendorId === user.id);
                    if (!segs.length) {
                      return (
                        <div className="border-t border-outline-variant/20 pt-6 text-sm text-on-surface-variant">
                          {scope === 'vendor' ? 'None of your products are on this RFQ.' : 'Preparing vendor segments…'}
                        </div>
                      );
                    }
                    const approvedCount = allSegs.filter((s) => s.status === 'approved').length;
                    return (
                      <div className="border-t border-outline-variant/20 pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                            {scope === 'admin' ? 'Vendor negotiations' : 'Your quote'}
                          </div>
                          {scope === 'admin' && (
                            <div className="text-xs text-on-surface-variant">{approvedCount}/{allSegs.length} vendors approved</div>
                          )}
                        </div>

                        {scope === 'admin' && selected.status === 'quoted' && (
                          <div className="rounded-md bg-secondary-container text-on-secondary-container px-4 py-3 text-sm">
                            ✓ All vendors approved — combined quote € {selected.quoteTotalEur?.toFixed(2)} sent to the buyer.
                          </div>
                        )}

                        {segs.map((seg) => {
                          const draft = getDraft(selected.id, seg);
                          const items = segItems(selected, seg);
                          const canSend = Number.isFinite(parseFloat(draft.total));
                          return (
                            <div key={seg.vendorId} className="rounded-xl bg-surface-container-low p-5 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-headline italic text-xl text-primary">{seg.vendorName}</div>
                                <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded ${SEG_COLORS[seg.status]}`}>
                                  {seg.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-xs text-on-surface-variant">
                                {items.length} line{items.length === 1 ? '' : 's'}
                                {seg.currentTotalEur !== undefined ? ` · standing € ${seg.currentTotalEur.toFixed(2)}` : ''}
                              </div>

                              {scope === 'vendor' && (
                                <div className="space-y-1.5">
                                  {items.map((i) => (
                                    <div key={i.productId} className="flex items-center gap-3 text-sm">
                                      <ProductImage imageKey={i.imageKey} alt={i.name} className="w-10 h-10 object-contain rounded bg-surface-container shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-primary truncate">{i.name}</div>
                                        <div className="text-[10px] text-on-surface-variant">Qty {i.quantity}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {seg.thread.length > 0 && (
                                <div className="space-y-2">
                                  {seg.thread.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.by === 'vendor' ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[85%] rounded-lg px-3 py-1.5 ${m.by === 'vendor' ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-lowest text-primary'}`}>
                                        <div className="text-[9px] uppercase tracking-wider opacity-70">
                                          {m.by === 'vendor' ? (m.byName ?? seg.vendorName) : 'Sklovera'}{m.approved ? ' · approved ✓' : ''}
                                        </div>
                                        <div className="font-headline text-base">€ {m.totalEur.toFixed(2)}</div>
                                        {m.note && <div className="text-xs opacity-80">{m.note}</div>}
                                        <div className="text-[9px] opacity-50 mt-0.5">{fmtDate(m.at)}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {scope === 'admin' ? (
                                seg.status === 'approved' ? (
                                  <div className="text-xs text-secondary font-semibold">✓ Approved by vendor</div>
                                ) : (
                                  <>
                                    {seg.status === 'vendor_review' && (
                                      <div className="text-[11px] text-on-surface-variant">⏳ Awaiting {seg.vendorName}. You can re-send a new discount.</div>
                                    )}
                                    <div className="text-xs text-on-surface-variant">
                                      List price € {segRefSubtotal(selected, seg).toFixed(2)}
                                      {' → '}
                                      <span className="font-semibold text-primary">€ {(segRefSubtotal(selected, seg) * (1 - segDiscountPct(selected, seg) / 100)).toFixed(2)}</span>
                                      {' '}after {segDiscountPct(selected, seg)}% off
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                      <div className="flex items-center bg-surface-container-lowest rounded-md overflow-hidden">
                                        <input type="number" min={0} max={100} value={draft.discount} onChange={(e) => setDraft(selected.id, seg.vendorId, { discount: e.target.value })} placeholder="0" className="w-14 bg-transparent px-3 py-2 outline-none text-sm text-right" />
                                        <span className="px-2 text-xs text-on-surface-variant">% off</span>
                                      </div>
                                      <input value={draft.note} onChange={(e) => setDraft(selected.id, seg.vendorId, { note: e.target.value })} placeholder="Message to vendor (optional)" className="flex-1 min-w-[140px] bg-surface-container-lowest px-3 py-2 rounded-md outline-none text-sm" />
                                      <button onClick={() => sendSeg(selected, seg)} className="px-4 py-2 rounded-md text-xs font-semibold bg-primary text-surface">
                                        {seg.status === 'vendor_countered' ? 'Send back' : 'Send discount for review'}
                                      </button>
                                    </div>
                                  </>
                                )
                              ) : seg.status === 'vendor_review' ? (
                                <>
                                  <div className="rounded-md bg-surface-container-lowest px-3 py-2">
                                    <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Sklovera proposes</div>
                                    <div className="font-headline text-2xl text-primary">€ {seg.currentTotalEur?.toFixed(2)}</div>
                                  </div>
                                  <div className="flex flex-wrap gap-2 items-center">
                                    <input type="number" value={draft.total} onChange={(e) => setDraft(selected.id, seg.vendorId, { total: e.target.value })} placeholder="Counter €" className="w-28 bg-surface-container-lowest px-3 py-2 rounded-md outline-none text-sm" />
                                    <input value={draft.note} onChange={(e) => setDraft(selected.id, seg.vendorId, { note: e.target.value })} placeholder="Message" className="flex-1 min-w-[140px] bg-surface-container-lowest px-3 py-2 rounded-md outline-none text-sm" />
                                    <button onClick={() => approveSeg(selected, seg)} className="px-4 py-2 rounded-md text-xs font-semibold bg-secondary text-on-secondary">Approve</button>
                                    <button onClick={() => counterSeg(selected, seg)} disabled={!canSend} className="px-4 py-2 rounded-md text-xs font-semibold bg-primary text-surface disabled:opacity-40">Counter</button>
                                  </div>
                                  <div className="text-[11px] text-on-surface-variant">Approving adds your lines to the buyer's quote once all vendors approve.</div>
                                </>
                              ) : seg.status === 'vendor_countered' ? (
                                <div className="text-xs text-on-surface-variant">Your counter of € {seg.currentTotalEur?.toFixed(2)} was sent. Awaiting Sklovera.</div>
                              ) : seg.status === 'approved' ? (
                                <div className="text-xs text-secondary font-semibold">✓ You approved this quote.</div>
                              ) : (
                                <div className="text-xs text-on-surface-variant">Awaiting a quote from Sklovera.</div>
                              )}
                            </div>
                          );
                        })}

                        {scope === 'admin' && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/10">
                            {selected.status === 'submitted' && (
                              <button onClick={() => updateRfqStatus(selected.id, 'in_review')} className="px-4 py-2 rounded-md text-xs font-semibold bg-surface-container-low text-primary hover:bg-surface-container">Mark in review</button>
                            )}
                            <button onClick={() => updateRfqStatus(selected.id, 'declined')} className="px-4 py-2 rounded-md text-xs font-semibold bg-error-container text-on-error-container">Decline RFQ</button>
                            <button onClick={() => updateRfqStatus(selected.id, 'closed')} className="px-4 py-2 rounded-md text-xs font-semibold bg-surface-container-low text-on-surface-variant">Close</button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

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
