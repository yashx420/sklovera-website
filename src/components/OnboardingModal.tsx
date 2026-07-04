import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { currentUser } from '../lib/auth';

export type OnboardingChoice =
  | 'buyer-individual'
  | 'buyer-bulk'
  | 'vendor-login'
  | 'vendor-register'
  | 'guest';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: OnboardingChoice) => void;
};

const OnboardingModal = ({ isOpen, onClose, onSelectRole }: Props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const user = currentUser();
    setMounted(isOpen && user.role === 'guest');
  }, [isOpen]);

  const handleChoice = (choice: OnboardingChoice) => {
    localStorage.setItem('sklovera.onboarding-seen', 'true');
    onSelectRole(choice);
    setMounted(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {mounted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-surface/85 backdrop-blur-xl"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full filter blur-[80px] animate-float-slow" />
            <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-secondary/5 rounded-full filter blur-[100px] animate-float-medium" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 30 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="w-full max-w-4xl bg-surface-container-lowest/90 rounded-[40px] p-6 sm:p-10 md:p-14 shadow-[0_32px_64px_rgba(0,0,0,0.12)] border border-outline-variant/35 relative overflow-hidden flex flex-col items-center"
          >
            <div className="text-center max-w-2xl mb-10 sm:mb-14">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center justify-center gap-3 mb-6"
              >
                <span className="h-px w-8 bg-secondary/60" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-secondary font-semibold">Sklovera · European Glassware</span>
                <span className="h-px w-8 bg-secondary/60" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-headline italic text-3xl sm:text-5xl md:text-6xl text-primary leading-tight tracking-tight mb-4"
              >
                How would you like to buy?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-on-surface-variant text-base sm:text-lg"
              >
                Sign in so we can show you the right pricing and ordering tools.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full">
              {/* Individual */}
              <motion.button
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 100, damping: 20 }}
                onClick={() => handleChoice('buyer-individual')}
                className="text-left flex flex-col p-8 rounded-[32px] bg-surface-container-low/70 border border-outline-variant/20 hover:border-emerald/30 hover:shadow-xl transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald/5 rounded-bl-[80px] -z-10 group-hover:bg-emerald/10 transition-colors duration-500" />
                <div className="w-16 h-16 rounded-2xl bg-emerald/10 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 mb-6">
                  <span className="material-symbols-outlined text-emerald text-3xl" data-icon="person">person</span>
                </div>
                <h3 className="font-headline text-2xl sm:text-3xl text-primary mb-3">Individual purchaser</h3>
                <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed mb-6 flex-grow">
                  Shop by the box at transparent per-box prices. Add to bag and check out directly with standard shipping.
                </p>
                <span className="inline-flex items-center gap-2 text-emerald font-bold text-sm tracking-wide">
                  Continue as individual
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
                </span>
              </motion.button>

              {/* Bulk */}
              <motion.button
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 100, damping: 20 }}
                onClick={() => handleChoice('buyer-bulk')}
                className="text-left flex flex-col p-8 rounded-[32px] bg-secondary/[0.05] border-2 border-secondary/40 ring-1 ring-secondary/10 shadow-xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-5 right-5 z-10 text-[10px] uppercase tracking-[0.2em] font-bold text-on-secondary bg-secondary px-3 py-1 rounded-full shadow-sm">Bulk</div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-bl-[80px] -z-10 group-hover:bg-secondary/20 transition-colors duration-500" />
                <div className="w-16 h-16 rounded-2xl bg-secondary/15 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 mb-6">
                  <span className="material-symbols-outlined text-secondary text-3xl" data-icon="storefront">storefront</span>
                </div>
                <h3 className="font-headline text-2xl sm:text-3xl text-primary mb-3">Retailers &amp; distributors</h3>
                <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed mb-6 flex-grow">
                  See per-unit pricing and request quotes through our RFQ system. Apply for 20–50% bulk discounts on volume orders.
                </p>
                <span className="inline-flex items-center gap-2 text-secondary font-bold text-sm tracking-wide">
                  Continue as bulk buyer
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
                </span>
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-col sm:flex-row items-center gap-x-6 gap-y-2 text-xs"
            >
              <button onClick={() => handleChoice('vendor-login')} className="text-on-surface-variant hover:text-primary transition-colors font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm" data-icon="domain">domain</span>
                Log in as a vendor
              </button>
              <span className="hidden sm:block text-outline-variant">·</span>
              <button onClick={() => handleChoice('guest')} className="text-on-surface-variant hover:text-primary transition-colors underline underline-offset-4 decoration-1 font-medium">
                Just browsing? Explore the catalog
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
