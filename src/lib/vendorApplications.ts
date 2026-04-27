export type VendorApplicationStatus = 'pending' | 'approved' | 'rejected';

export type VendorApplication = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  country: string;
  website?: string;
  categories: string[];
  message?: string;
  status: VendorApplicationStatus;
  reviewedAt?: number;
  reviewNote?: string;
  createdAt: number;
};

const KEY = 'sklovera.vendor-applications.v1';
const EVT = 'sklovera:vendor-applications-updated';

export const loadApplications = (): VendorApplication[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VendorApplication[]) : [];
  } catch {
    return [];
  }
};

const saveApplications = (list: VendorApplication[]) => {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
};

export const onApplicationsChange = (cb: () => void): (() => void) => {
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', cb);
  };
};

export type SubmitApplicationInput = Omit<
  VendorApplication,
  'id' | 'status' | 'createdAt' | 'reviewedAt' | 'reviewNote'
>;

export const submitApplication = (input: SubmitApplicationInput): VendorApplication => {
  const now = Date.now();
  const app: VendorApplication = {
    ...input,
    id: `VA-${now.toString(36).toUpperCase()}`,
    status: 'pending',
    createdAt: now,
  };
  saveApplications([app, ...loadApplications()]);
  return app;
};

export const setApplicationStatus = (
  id: string,
  status: VendorApplicationStatus,
  note?: string,
): void => {
  const list = loadApplications().map((a) =>
    a.id === id ? { ...a, status, reviewedAt: Date.now(), reviewNote: note ?? a.reviewNote } : a,
  );
  saveApplications(list);
};

export const VENDOR_CATEGORY_OPTIONS = [
  'Stemware',
  'Tumblers & Highballs',
  'Decanters',
  'Vases',
  'Barware',
  'Custom & Bespoke',
  'Hospitality Range',
];
