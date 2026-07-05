// Business profile for retailer/distributor (bulk) buyers, captured at sign-in
// and keyed by email so it stays with the account. Surfaced on every RFQ the
// buyer submits so admins and vendors know who they're quoting.

export type BuyerProfile = {
  email: string;
  businessType: string;
  orderVolume: string;
  market: string;
  notes?: string;
  updatedAt: number;
};

export const BUSINESS_TYPES = ['Retailer', 'Distributor', 'Wholesaler', 'Importer', 'Hospitality (HoReCa)'];
export const ORDER_VOLUMES = ['Under 500 units', '500 – 2,000 units', '2,000 – 10,000 units', '10,000+ units'];
export const MARKETS = ['India', 'Europe', 'Middle East', 'North America', 'Asia-Pacific', 'Other'];

const KEY = 'sklovera.buyer-profiles.v1';
const EVT = 'sklovera:buyer-profiles-updated';

export const loadBuyerProfiles = (): BuyerProfile[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BuyerProfile[]) : [];
  } catch {
    return [];
  }
};

export const getBuyerProfile = (email?: string): BuyerProfile | undefined => {
  if (!email) return undefined;
  const e = email.trim().toLowerCase();
  return loadBuyerProfiles().find((p) => p.email === e);
};

export const onBuyerProfilesChange = (cb: () => void): (() => void) => {
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', cb);
  };
};

export type SaveBuyerProfileInput = Omit<BuyerProfile, 'updatedAt'>;

export const saveBuyerProfile = (input: SaveBuyerProfileInput): BuyerProfile => {
  const email = input.email.trim().toLowerCase();
  const profile: BuyerProfile = { ...input, email, updatedAt: Date.now() };
  const rest = loadBuyerProfiles().filter((p) => p.email !== email);
  localStorage.setItem(KEY, JSON.stringify([profile, ...rest]));
  window.dispatchEvent(new CustomEvent(EVT));
  return profile;
};
