export type Role = 'admin' | 'supplier' | 'b2b' | 'retail' | 'b2c' | 'guest';

export type User = {
  id: string;
  role: Role;
  email: string;
  displayName: string;
};

const KEY = 'sklovera.auth.v1';
const EVT = 'sklovera:auth-updated';

// Demo seeded accounts. Real auth comes with the backend in a later part.
const SEED_DEMO: User[] = [
  { id: 'admin-1', role: 'admin', email: 'admin@sklovera.com', displayName: 'Sklovera Admin' },
  { id: 'sup-krosno', role: 'supplier', email: 'sales@krosno.com', displayName: 'Krosno Glass' },
  { id: 'sup-generic', role: 'supplier', email: 'supplier@example.com', displayName: 'Demo Supplier' },
  { id: 'b2b-1', role: 'b2b', email: 'buyer@hotelgroup.com', displayName: 'Hotel Group Procurement' },
  { id: 'retail-1', role: 'retail', email: 'owner@boutique.com', displayName: 'Boutique Retailer' },
  { id: 'b2c-1', role: 'b2c', email: 'amelia@sklovera.com', displayName: 'Amelia Laurent' },
];

const USERS_KEY = 'sklovera.users.v1';
const USERS_EVT = 'sklovera:users-updated';

const slugifyEmail = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user';

const persistUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new CustomEvent(USERS_EVT));
};

const loadAllUsers = (): User[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as User[];
  } catch {
    /* ignore */
  }
  // First run — seed and persist.
  persistUsers(SEED_DEMO);
  return SEED_DEMO;
};

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'guest';

/**
 * Sign in an ad-hoc B2C customer. If the email matches a seeded demo
 * account we log into that, otherwise we create a lightweight session
 * with the email + name (no password validation in this demo).
 */
export const loginAsCustomer = (
  email: string,
  name?: string,
  buyerType: 'b2c' | 'b2b' = 'b2c',
): User => {
  const trimmedEmail = email.trim().toLowerCase();
  const match = loadAllUsers().find((u) => u.email.toLowerCase() === trimmedEmail);
  if (match) {
    login(match);
    return match;
  }
  const cleanName = name?.trim() || trimmedEmail.split('@')[0].replace(/[._-]+/g, ' ');
  const user: User = {
    id: `${buyerType}-${slug(trimmedEmail)}`,
    role: buyerType,
    email: trimmedEmail,
    displayName: cleanName.replace(/\b\w/g, (c) => c.toUpperCase()),
  };
  login(user);
  return user;
};

export const demoUsers = (): User[] => loadAllUsers();

export const onUsersChange = (cb: () => void): (() => void) => {
  window.addEventListener(USERS_EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(USERS_EVT, cb);
    window.removeEventListener('storage', cb);
  };
};

export type NewUserInput = {
  role: Role;
  email: string;
  displayName: string;
};

export const upsertUser = (input: NewUserInput, idOverride?: string): User => {
  const users = loadAllUsers();
  const id = idOverride ?? `${input.role}-${slugifyEmail(input.email)}`;
  const existingIdx = users.findIndex((u) => u.id === id || u.email.toLowerCase() === input.email.toLowerCase());
  const next: User = {
    id: existingIdx >= 0 ? users[existingIdx].id : id,
    role: input.role,
    email: input.email.trim(),
    displayName: input.displayName.trim() || input.email.split('@')[0],
  };
  if (existingIdx >= 0) users[existingIdx] = next;
  else users.push(next);
  persistUsers(users);
  return next;
};

export const removeUser = (id: string): void => {
  const users = loadAllUsers().filter((u) => u.id !== id);
  persistUsers(users);
  // If the removed user was signed in, drop the session.
  if (currentUser().id === id) logout();
};

export const currentUser = (): User => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as User;
  } catch {
    /* ignore */
  }
  return { id: 'guest', role: 'guest', email: '', displayName: 'Guest' };
};

export const login = (user: User): void => {
  localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent(EVT));
};

export const logout = (): void => {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent(EVT));
};

export const onAuthChange = (cb: () => void): (() => void) => {
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', cb);
  };
};
