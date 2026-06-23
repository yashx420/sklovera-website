import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { User } from '../lib/auth';
import {
  findApplicationByEmail,
  onBusinessChange,
  submitBusinessApplication,
  type BusinessApplication,
  type BusinessType,
} from '../lib/business';

/**
 * Cart-side prompt: invites buyers who are retailers/distributors to apply for
 * a bulk discount. Shows live application status, and the approved discount
 * once an admin grants it.
 */
const BulkPricingPanel = ({ user }: { user: User }) => {
  const signedIn = !!user.email && user.role !== 'guest';
  const [app, setApp] = useState<BusinessApplication | undefined>(() => findApplicationByEmail(user.email));
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<BusinessType>('retailer');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => setApp(findApplicationByEmail(user.email));
    refresh();
    return onBusinessChange(refresh);
  }, [user.email]);

  if (!signedIn) {
    return (
      <div className="rounded-xl bg-surface-container-low p-4 text-xs text-on-surface-variant">
        Buying for a business? <span className="font-semibold text-primary">Sign in</span> to apply for retailer &amp; distributor bulk pricing (20–50% off).
      </div>
    );
  }

  if (app?.status === 'approved') {
    return (
      <div className="rounded-xl bg-secondary-container/70 text-on-secondary-container p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="material-symbols-outlined text-base" data-icon="verified">verified</span>
          Bulk discount active · −{app.discountPct}%
        </div>
        <div className="text-xs mt-1 opacity-80">Applied automatically to every price in your bag and at checkout.</div>
      </div>
    );
  }

  if (app?.status === 'pending') {
    return (
      <div className="rounded-xl bg-tertiary-fixed/30 text-primary p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="material-symbols-outlined text-base" data-icon="hourglass_top">hourglass_top</span>
          Bulk-pricing application under review
        </div>
        <div className="text-xs mt-1 opacity-80">
          Submitted as a {app.businessType}. We'll apply your discount as soon as it's approved.
        </div>
      </div>
    );
  }

  const submit = () => {
    setError('');
    if (!companyName.trim() || !description.trim()) {
      setError('Business name and a short description are required.');
      return;
    }
    submitBusinessApplication({
      userId: user.id,
      email: user.email,
      businessType: type,
      companyName,
      website,
      description,
    });
    setShowForm(false);
  };

  return (
    <div className="rounded-xl bg-surface-container-low p-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-secondary" data-icon="storefront">storefront</span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-primary">Are you a retailer or distributor?</div>
          <div className="text-xs text-on-surface-variant mt-0.5">
            Bulk buyers qualify for <span className="font-semibold text-secondary">20% to 50% off</span>. Once approved you'll see
            <span className="font-semibold text-primary"> per-unit pricing</span> (alongside box pricing) with your discount applied to every order.
          </div>
          {app?.status === 'rejected' && (
            <div className="text-[11px] text-on-error-container bg-error-container/60 rounded px-2 py-1 mt-2">
              Your previous application wasn't approved{app.reviewNote ? `: ${app.reviewNote}` : '.'} You can re-apply below.
            </div>
          )}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-xs bg-secondary text-on-secondary px-4 py-2 rounded-md font-semibold"
            >
              Apply for bulk pricing
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                {(['retailer', 'distributor'] as BusinessType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 text-xs font-semibold uppercase tracking-wider py-2 rounded-md border transition ${
                      type === t
                        ? 'bg-primary text-surface border-transparent'
                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Business name"
                className="w-full bg-surface-container-lowest px-3 py-2.5 rounded-md outline-none text-sm"
              />
              <input
                value={user.email}
                disabled
                className="w-full bg-surface-container-lowest/60 px-3 py-2.5 rounded-md outline-none text-sm text-on-surface-variant"
              />
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Website (optional)"
                className="w-full bg-surface-container-lowest px-3 py-2.5 rounded-md outline-none text-sm"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your business — what you sell, where, typical order volumes…"
                rows={3}
                className="w-full bg-surface-container-lowest px-3 py-2.5 rounded-md outline-none text-sm resize-none"
              />
              {error && <div className="text-[11px] text-on-error-container bg-error-container px-2 py-1 rounded">{error}</div>}
              <div className="flex gap-2">
                <button onClick={submit} className="flex-1 bg-secondary text-on-secondary py-2.5 rounded-md font-semibold text-sm">
                  Submit for approval
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-on-surface-variant hover:text-primary text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BulkPricingPanel;
