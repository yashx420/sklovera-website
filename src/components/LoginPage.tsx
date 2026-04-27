import { useEffect, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import {
  demoUsers,
  login,
  loginAsCustomer,
  type Role,
  type User,
} from '../lib/auth';

type Props = { onDone: () => void; onRegisterVendor?: () => void };

type Mode = 'customer' | 'vendor' | 'admin';

const fade: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const LoginPage = ({ onDone, onRegisterVendor }: Props) => {
  const [mode, setMode] = useState<Mode>('customer');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  // Subtle parallax on the editorial side image.
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 6;
      const y = (e.clientY / window.innerHeight - 0.5) * 6;
      setTilt({ x, y });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const submitCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setTimeout(() => {
      loginAsCustomer(email, name);
      onDone();
    }, 350);
  };

  const continueAsGuest = () => {
    onDone();
  };

  const vendorAccounts = demoUsers().filter((u) => u.role === 'supplier');
  const adminAccounts = demoUsers().filter((u) => u.role === 'admin');

  const signInDemo = (u: User) => {
    login(u);
    onDone();
  };

  return (
    <section className="relative min-h-[88vh] overflow-hidden">
      {/* Editorial side image with soft parallax */}
      <motion.div
        aria-hidden
        className="hidden lg:block absolute inset-y-0 right-0 w-[55%]"
        animate={{ x: tilt.x, y: tilt.y }}
        transition={{ type: 'spring', stiffness: 30, damping: 20 }}
      >
        <img
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1600&q=80"
          alt="Editorial glassware composition"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
      </motion.div>

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="lg:col-span-6 z-10"
        >
          <motion.div variants={fade} className="flex items-center gap-3 mb-12">
            <span className="h-px w-12 bg-secondary" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-secondary font-semibold">
              Maison Sklovera · Est. Europe
            </span>
          </motion.div>

          <motion.h1
            variants={fade}
            className="font-headline italic text-[40px] sm:text-[56px] lg:text-[88px] leading-[0.95] text-primary mb-6 tracking-tight"
          >
            Bonjour.<br />
            <span className="text-secondary">Welcome back.</span>
          </motion.h1>

          <motion.p
            variants={fade}
            className="text-on-surface-variant text-lg max-w-md mb-12 leading-relaxed"
          >
            Sign in to your atelier account to browse the curated catalog,
            track your orders, and manage your private collection.
          </motion.p>

          <AnimatePresence mode="wait">
            {mode === 'customer' && (
              <motion.form
                key="customer"
                onSubmit={submitCustomer}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-md space-y-5"
              >
                <div>
                  <label className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-semibold">
                    Email address
                  </label>
                  <input
                    autoFocus
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amelia@maisonsklovera.com"
                    className="mt-3 w-full bg-transparent border-b border-outline-variant/40 focus:border-primary px-1 py-3 text-lg text-primary outline-none transition-colors placeholder:text-on-surface-variant/60"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-semibold">
                    Display name (optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Amelia Laurent"
                    className="mt-3 w-full bg-transparent border-b border-outline-variant/40 focus:border-primary px-1 py-3 text-lg text-primary outline-none transition-colors placeholder:text-on-surface-variant/60"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={busy}
                    className="bg-primary text-surface px-10 py-4 rounded-md font-semibold tracking-wide flex items-center gap-3 disabled:opacity-60"
                    style={{
                      backgroundImage:
                        'linear-gradient(135deg, var(--md-sys-color-primary, #303030), #474646)',
                    }}
                  >
                    {busy ? 'Signing in…' : 'Continue'}
                    <motion.span
                      className="material-symbols-outlined"
                      data-icon="arrow_forward"
                      animate={{ x: busy ? 8 : 0 }}
                      transition={{ repeat: busy ? Infinity : 0, repeatType: 'reverse', duration: 0.6 }}
                    >
                      arrow_forward
                    </motion.span>
                  </motion.button>
                  <button
                    type="button"
                    onClick={continueAsGuest}
                    className="text-sm text-on-surface-variant underline-offset-8 underline decoration-1 hover:text-primary transition-colors"
                  >
                    Continue as guest
                  </button>
                </div>

                <div className="text-xs text-on-surface-variant pt-2">
                  No password needed — this is a curated demo. Real authentication arrives with the production backend.
                </div>
              </motion.form>
            )}

            {mode !== 'customer' && (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-md"
              >
                <div className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-semibold mb-5">
                  {mode === 'vendor' ? 'Atelier supplier sign-in' : 'Operations sign-in'}
                </div>
                {mode === 'vendor' && onRegisterVendor && (
                  <div className="mb-5 p-4 rounded-md bg-secondary-container/60 text-on-secondary-container flex items-center justify-between gap-4">
                    <div className="text-sm">
                      Not yet a Sklovera partner? Apply to join the supplier network.
                    </div>
                    <button
                      onClick={onRegisterVendor}
                      className="text-xs font-semibold whitespace-nowrap underline underline-offset-4 hover:no-underline"
                    >
                      Register as a vendor →
                    </button>
                  </div>
                )}
                <div className="space-y-3">
                  {(mode === 'vendor' ? vendorAccounts : adminAccounts).map((u) => (
                    <motion.button
                      key={u.id}
                      whileHover={{ x: 6 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                      onClick={() => signInDemo(u)}
                      className="w-full flex items-center justify-between p-5 rounded-md bg-surface-container-lowest hover:bg-surface-container-low transition-colors text-left group"
                    >
                      <div>
                        <div className="font-headline italic text-2xl text-primary">
                          {u.displayName}
                        </div>
                        <div className="text-xs text-on-surface-variant mt-1">{u.email}</div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all" data-icon="arrow_forward">
                        arrow_forward
                      </span>
                    </motion.button>
                  ))}
                </div>
                <button
                  onClick={() => setMode('customer')}
                  className="mt-6 text-sm text-on-surface-variant underline-offset-8 underline decoration-1 hover:text-primary transition-colors"
                >
                  ← Back to customer sign-in
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="hidden lg:block lg:col-span-6" />
      </div>

      {/* Discreet role chips, bottom-left */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-4 sm:bottom-8 left-4 sm:left-12 flex items-center gap-3 sm:gap-6 text-[11px] uppercase tracking-[0.3em] z-10"
      >
        <RoleLink active={mode === 'customer'} onClick={() => setMode('customer')} label="Customer" />
        <span className="text-outline-variant">·</span>
        <RoleLink active={mode === 'vendor'} onClick={() => setMode('vendor')} label="Vendors" />
        <span className="text-outline-variant">·</span>
        <RoleLink active={mode === 'admin'} onClick={() => setMode('admin')} label="Admin" />
      </motion.div>

      {/* Decorative serif marker, bottom-right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1.6, duration: 1.2 }}
        className="hidden lg:block absolute bottom-8 right-12 text-right"
      >
        <div className="font-headline italic text-3xl text-primary">N° 01</div>
        <div className="text-[10px] uppercase tracking-[0.4em] text-on-surface-variant mt-1">
          Atelier · Volume MMXXVI
        </div>
      </motion.div>
    </section>
  );
};

const RoleLink = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`relative font-semibold transition-colors ${
      active ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
    }`}
  >
    {label}
    {active && (
      <motion.span
        layoutId="role-underline"
        className="absolute -bottom-2 left-0 right-0 h-px bg-primary"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    )}
  </button>
);

// Provide a fallback type-safe export for Role usage elsewhere.
export type { Role };

export default LoginPage;
