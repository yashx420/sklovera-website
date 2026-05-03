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

  const [showRoleModal, setShowRoleModal] = useState(false);

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
    setShowRoleModal(true);
  };

  const handleRoleSelect = (type: 'b2b' | 'b2c') => {
    setShowRoleModal(false);
    setBusy(true);
    setTimeout(() => {
      loginAsCustomer(email, name, type);
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

      {/* Role switcher, top */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="absolute top-6 left-0 right-0 sm:right-auto sm:left-8 lg:left-12 flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] z-20 px-4 sm:px-0"
      >
        <RoleLink active={mode === 'customer'} onClick={() => setMode('customer')} label="Customer" />
        <span className="text-outline-variant">·</span>
        <RoleLink active={mode === 'vendor'} onClick={() => setMode('vendor')} label="Vendors" />
        <span className="text-outline-variant">·</span>
        <RoleLink active={mode === 'admin'} onClick={() => setMode('admin')} label="Admin" />
      </motion.div>

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-16 sm:py-24 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center mt-8 sm:mt-0">
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

      {/* Role Selection Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-surface/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface-container-lowest rounded-[32px] p-6 sm:p-10 max-w-3xl w-full shadow-2xl border border-outline-variant/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-surface/50 to-transparent pointer-events-none" />
              
              <div className="relative z-10 flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-3xl sm:text-4xl font-headline italic text-primary mb-2">How will you use Sklovera?</h3>
                  <p className="text-on-surface-variant max-w-md">Customize your sourcing experience and access the right set of tools for your procurement needs.</p>
                </div>
                <button onClick={() => setShowRoleModal(false)} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">close</span>
                </button>
              </div>

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button onClick={() => handleRoleSelect('b2b')} className="text-left p-6 sm:p-8 rounded-3xl bg-surface-container-low hover:bg-surface-container-high border border-transparent hover:border-primary/20 transition-all duration-300 group flex flex-col items-start gap-6 h-full relative overflow-hidden shadow-sm hover:shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <span className="material-symbols-outlined text-primary text-3xl" data-icon="domain">domain</span>
                  </div>
                  <div>
                    <div className="font-headline text-2xl text-primary mb-3">Corporate & Wholesale</div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">For architects, designers, retailers, and hospitality procurement. Access RFQ tools, volume pricing, and bulk logistics options.</p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center gap-2 text-primary font-bold text-sm tracking-wide">
                    Select Corporate
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-2 transition-transform" data-icon="arrow_forward">arrow_forward</span>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 group-hover:bg-primary/10 transition-colors duration-500" />
                </button>

                <button onClick={() => handleRoleSelect('b2c')} className="text-left p-6 sm:p-8 rounded-3xl bg-surface-container-low hover:bg-surface-container-high border border-transparent hover:border-emerald/30 transition-all duration-300 group flex flex-col items-start gap-6 h-full relative overflow-hidden shadow-sm hover:shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-emerald/10 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                    <span className="material-symbols-outlined text-emerald text-3xl" data-icon="person">person</span>
                  </div>
                  <div>
                    <div className="font-headline text-2xl text-primary mb-3">Personal Collection</div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">For individual connoisseurs and home curators. Shop directly with transparent pricing and standard shipping to your door.</p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center gap-2 text-emerald font-bold text-sm tracking-wide">
                    Select Personal
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-2 transition-transform" data-icon="arrow_forward">arrow_forward</span>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/5 rounded-bl-[100px] -z-10 group-hover:bg-emerald/10 transition-colors duration-500" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
