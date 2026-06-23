// Bulk-discount business accounts. A signed-in buyer who is a retailer or
// distributor applies with their business details; an admin reviews and assigns
// a discount (5–50%). Once approved, that discount is applied to every price
// shown to (and charged to) that user, keyed by email.

export type BusinessType = 'retailer' | 'distributor';
export type BusinessStatus = 'pending' | 'approved' | 'rejected';

export type BusinessApplication = {
  id: string;
  userId: string;
  email: string;          // lowercased — the key prices are discounted against
  businessType: BusinessType;
  companyName: string;
  website?: string;
  description: string;
  status: BusinessStatus;
  discountPct: number;    // 0 until an admin approves with a value
  createdAt: number;
  reviewedAt?: number;
  reviewNote?: string;
};

const KEY = 'sklovera.business-accounts.v1';
const EVT = 'sklovera:business-accounts-updated';

export const MIN_DISCOUNT = 5;
export const MAX_DISCOUNT = 50;

export const loadBusinessApplications = (): BusinessApplication[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BusinessApplication[]) : [];
  } catch {
    return [];
  }
};

const save = (list: BusinessApplication[]) => {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
};

export const onBusinessChange = (cb: () => void): (() => void) => {
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', cb);
  };
};

/** The most recent application for an email (any status), if any. */
export const findApplicationByEmail = (email?: string): BusinessApplication | undefined => {
  if (!email) return undefined;
  const e = email.trim().toLowerCase();
  return loadBusinessApplications().find((a) => a.email === e);
};

/** Approved discount fraction-as-percent for an email; 0 if none/pending/rejected. */
export const getApprovedDiscount = (email?: string): number => {
  const app = findApplicationByEmail(email);
  return app && app.status === 'approved' ? app.discountPct : 0;
};

export type SubmitBusinessInput = {
  userId: string;
  email: string;
  businessType: BusinessType;
  companyName: string;
  website?: string;
  description: string;
};

/** Create or replace the application for this email (resets to pending). */
export const submitBusinessApplication = (input: SubmitBusinessInput): BusinessApplication => {
  const now = Date.now();
  const email = input.email.trim().toLowerCase();
  const app: BusinessApplication = {
    id: `BA-${now.toString(36).toUpperCase()}`,
    userId: input.userId,
    email,
    businessType: input.businessType,
    companyName: input.companyName.trim(),
    website: input.website?.trim() || undefined,
    description: input.description.trim(),
    status: 'pending',
    discountPct: 0,
    createdAt: now,
  };
  const rest = loadBusinessApplications().filter((a) => a.email !== email);
  save([app, ...rest]);
  return app;
};

/** Admin: approve with a discount (clamped 5–50%) or reject. */
export const reviewBusinessApplication = (
  id: string,
  status: BusinessStatus,
  discountPct = 0,
  note?: string,
): void => {
  const clamped = Math.min(MAX_DISCOUNT, Math.max(MIN_DISCOUNT, Math.round(discountPct)));
  save(
    loadBusinessApplications().map((a) =>
      a.id === id
        ? {
            ...a,
            status,
            discountPct: status === 'approved' ? clamped : 0,
            reviewedAt: Date.now(),
            reviewNote: note ?? a.reviewNote,
          }
        : a,
    ),
  );
};
