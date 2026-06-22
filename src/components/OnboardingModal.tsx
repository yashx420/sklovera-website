import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { currentUser } from '../lib/auth';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'vendor-register' | 'vendor-login' | 'customer-login' | 'guest') => void;
};

const OnboardingModal = ({ isOpen, onClose, onSelectRole }: Props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only show if the user is a guest
    const user = currentUser();
    if (isOpen && user.role === 'guest') {
      setMounted(true);
    } else {
      setMounted(false);
    }
  }, [isOpen]);

  const handleChoice = (choice: 'vendor-register' | 'vendor-login' | 'customer-login' | 'guest') => {
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
          {/* Subtle moving abstract orbs for premium aesthetics */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full filter blur-[80px] animate-float-slow" />
            <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-secondary/5 rounded-full filter blur-[100px] animate-float-medium" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 30 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="w-full max-w-5xl bg-surface-container-lowest/90 rounded-[40px] p-6 sm:p-10 md:p-14 shadow-[0_32px_64px_rgba(0,0,0,0.12)] border border-outline-variant/35 relative overflow-hidden flex flex-col items-center"
          >
            {/* Elegant Header */}
            <div className="text-center max-w-2xl mb-12 sm:mb-16">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center justify-center gap-3 mb-6"
              >
                <span className="h-px w-8 bg-secondary/60" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-secondary font-semibold">
                  Sklovera · European Glassware
                </span>
                <span className="h-px w-8 bg-secondary/60" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-headline italic text-4xl sm:text-5xl md:text-6xl text-primary leading-tight tracking-tight mb-4"
              >
                Welcome to Sklovera
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-on-surface-variant text-base sm:text-lg"
              >
                Tell us what brings you here, so we can show you the right tools.
              </motion.p>
            </div>

            {/* Split cards for options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              
              {/* Option A: Vendor (secondary, shown second) */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 100, damping: 20 }}
                className="order-2 flex flex-col p-8 rounded-[32px] bg-surface-container-low/60 border border-outline-variant/20 hover:border-primary/20 hover:shadow-xl transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[80px] -z-10 group-hover:bg-primary/10 transition-colors duration-500" />
                
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl" data-icon="domain">domain</span>
                </div>

                <div className="mb-8 flex-grow">
                  <h3 className="font-headline text-2xl sm:text-3xl text-primary mb-3">I'm a Supplier</h3>
                  <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                    Glass manufacturers and producers can sell through Sklovera. Sign in to manage your pricing, product listings, and warehouse stock — or apply to join our supplier network.
                  </p>
                </div>

                <div className="space-y-3 mt-auto">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoice('vendor-login')}
                    className="w-full bg-primary text-surface py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide transition shadow-md flex items-center justify-center gap-2"
                  >
                    Sign In as a Supplier
                    <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoice('vendor-register')}
                    className="w-full bg-surface-container-high hover:bg-surface-container-highest text-primary py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide transition border border-outline-variant/30 flex items-center justify-center gap-2"
                  >
                    Apply to Become a Supplier
                  </motion.button>
                </div>
              </motion.div>

              {/* Option B: Buyer (primary, shown first & emphasized) */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 100, damping: 20 }}
                className="order-1 flex flex-col p-8 rounded-[32px] bg-secondary/[0.05] border-2 border-secondary/40 ring-1 ring-secondary/10 shadow-xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-5 right-5 z-10 text-[10px] uppercase tracking-[0.2em] font-bold text-on-secondary bg-secondary px-3 py-1 rounded-full shadow-sm">
                  Most common
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-bl-[80px] -z-10 group-hover:bg-secondary/20 transition-colors duration-500" />

                <div className="w-16 h-16 rounded-2xl bg-secondary/15 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 mb-6">
                  <span className="material-symbols-outlined text-secondary text-3xl" data-icon="shopping_bag">shopping_bag</span>
                </div>

                <div className="mb-8 flex-grow">
                  <h3 className="font-headline text-2xl sm:text-3xl text-primary mb-3">I'm Here to Buy</h3>
                  <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                    For hotels, restaurants, designers, retailers, and individual buyers. Sign in to shop our collections, request custom quotes, and track your orders.
                  </p>
                </div>

                <div className="space-y-3 mt-auto">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoice('customer-login')}
                    className="w-full bg-secondary text-on-secondary py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide transition shadow-md flex items-center justify-center gap-2"
                  >
                    Sign In to Shop
                    <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoice('guest')}
                    className="w-full bg-surface-container-high hover:bg-surface-container-highest text-secondary py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide transition border border-outline-variant/30 flex items-center justify-center gap-2"
                  >
                    Continue as Guest
                  </motion.button>
                </div>
              </motion.div>

            </div>

            {/* Quiet Footer Dismiss Option */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 text-center"
            >
              <button
                onClick={() => handleChoice('guest')}
                className="text-xs text-on-surface-variant hover:text-primary transition-colors underline underline-offset-4 decoration-1 font-medium"
              >
                Just browsing? Explore the catalog without signing in
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
