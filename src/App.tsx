import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

import HeroSection from './components/HeroSection';
import TrustIndicators from './components/TrustIndicators';
import FeaturedCollections from './components/FeaturedCollections';
import FeaturedProducts from './components/FeaturedProducts';
import SpecificationDrawer from './components/SpecificationDrawer';
import Footer from './components/Footer';
import VendorUpload from './components/VendorUpload';
import ProductCatalog from './components/ProductCatalog';
import AdminApprovals from './components/AdminApprovals';
import AuthBar from './components/AuthBar';
import LoginPage from './components/LoginPage';
import RfqCart from './components/RfqCart';
import RfqReview from './components/RfqReview';
import RfqList from './components/RfqList';
import AdminPricing from './components/AdminPricing';
import AdminInventory from './components/AdminInventory';
import ShopCart from './components/ShopCart';
import Checkout from './components/Checkout';
import Orders from './components/Orders';
import SupplierInventory from './components/SupplierInventory';
import AdminVendors from './components/AdminVendors';
import StandardsPage from './components/StandardsPage';
import VendorRegister from './components/VendorRegister';
import ClientTicker from './components/ClientTicker';
import { LOW_STOCK_THRESHOLD, totalStock } from './lib/fulfillment';
import { currentUser, onAuthChange, type Role } from './lib/auth';
import { loadProducts } from './lib/products';
import { loadCart, loadRfqs, onCartChange, onRfqChange } from './lib/rfq';
import { isShopper, loadBag, loadOrders, onBagChange, onOrdersChange } from './lib/shop';

type View =
  | 'home'
  | 'standards'
  | 'vendor'
  | 'catalog'
  | 'admin'
  | 'login'
  | 'rfq-review'
  | 'rfqs'
  | 'admin-rfqs'
  | 'admin-pricing'
  | 'admin-inventory'
  | 'checkout'
  | 'orders'
  | 'admin-orders'
  | 'supplier-inventory'
  | 'admin-vendors'
  | 'vendor-register';

const NavTab = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold tracking-wide rounded-md transition whitespace-nowrap flex-shrink-0 ${
      active ? 'bg-primary text-surface' : 'text-on-surface-variant hover:text-primary'
    }`}
  >
    {children}
  </motion.button>
);

const tabsForRole = (role: Role): View[] => {
  switch (role) {
    case 'admin':
      return ['home', 'catalog', 'standards', 'admin', 'admin-rfqs', 'admin-orders', 'admin-inventory', 'admin-vendors', 'admin-pricing', 'vendor'];
    case 'supplier':
      return ['home', 'catalog', 'standards', 'vendor', 'supplier-inventory'];
    case 'b2c':
      return ['home', 'catalog', 'standards', 'orders'];
    case 'b2b':
    case 'retail':
      return ['home', 'catalog', 'standards', 'rfqs'];
    default:
      return ['home', 'catalog', 'standards'];
  }
};

const viewLabel: Record<View, string> = {
  home: 'Home',
  catalog: 'Catalog',
  standards: 'Our Standards',
  admin: 'Approvals',
  'admin-rfqs': 'RFQ Queue',
  'admin-pricing': 'Pricing',
  'admin-inventory': 'Inventory',
  vendor: 'Supplier Portal',
  login: 'Sign in',
  'rfq-review': 'Review RFQ',
  rfqs: 'My RFQs',
  checkout: 'Checkout',
  orders: 'My Orders',
  'admin-orders': 'Orders',
  'supplier-inventory': 'My Inventory',
  'admin-vendors': 'Vendors',
  'vendor-register': 'Become a Vendor',
};

const pageVariants: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.5 } },
};

function App() {
  const [view, setView] = useState<View>('home');
  const [role, setRole] = useState<Role>(() => currentUser().role);
  const [pendingCount, setPendingCount] = useState(0);
  const [revisionCount, setRevisionCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [rfqCount, setRfqCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [bagCount, setBagCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    return onAuthChange(() => {
      const next = currentUser().role;
      setRole(next);
      setView((cur) => {
        if (cur === 'login') {
          if (next === 'admin') return 'admin';
          if (next === 'supplier') return 'vendor';
          return 'catalog';
        }
        return cur;
      });
    });
  }, []);

  useEffect(() => {
    const refresh = () => {
      const all = loadProducts();
      setPendingCount(all.filter((p) => p.status === 'pending').length);
      setRevisionCount(all.filter((p) => !!p.pendingRevision).length);
      setLowStockCount(
        all.filter((p) => p.status === 'approved' && totalStock(p) < LOW_STOCK_THRESHOLD).length,
      );
    };
    refresh();
    window.addEventListener('sklovera:products-updated', refresh);
    return () => window.removeEventListener('sklovera:products-updated', refresh);
  }, []);

  useEffect(() => {
    const refresh = () =>
      setCartCount(loadCart().reduce((s, e) => s + e.quantity, 0));
    refresh();
    return onCartChange(refresh);
  }, []);

  useEffect(() => {
    const refresh = () => setBagCount(loadBag().reduce((s, e) => s + e.quantity, 0));
    refresh();
    return onBagChange(refresh);
  }, []);

  useEffect(() => {
    const refreshOrders = () => {
      const user = currentUser();
      const all = loadOrders();
      if (user.role === 'admin') {
        setOrdersCount(all.filter((o) => o.status === 'paid' || o.status === 'processing').length);
      } else {
        setOrdersCount(all.filter((o) => o.buyerId === user.id && (o.status === 'paid' || o.status === 'processing' || o.status === 'shipped')).length);
      }
    };
    refreshOrders();
    const offO = onOrdersChange(refreshOrders);
    const offA = onAuthChange(refreshOrders);
    return () => { offO(); offA(); };
  }, []);

  useEffect(() => {
    const refreshRfq = () => {
      const user = currentUser();
      const all = loadRfqs();
      if (user.role === 'admin') {
        setRfqCount(all.filter((r) => r.status === 'submitted' || r.status === 'in_review').length);
      } else {
        setRfqCount(all.filter((r) => r.buyerId === user.id && r.status === 'quoted').length);
      }
    };
    refreshRfq();
    const offR = onRfqChange(refreshRfq);
    const offA = onAuthChange(refreshRfq);
    return () => {
      offR();
      offA();
    };
  }, []);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = useMemo(() => tabsForRole(role), [role]);

  useEffect(() => {
    if (view === 'login' || view === 'rfq-review' || view === 'checkout' || view === 'vendor-register') return;
    if (!tabs.includes(view)) setView('home');
  }, [tabs, view]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [view]);

  const showRfqPill = role === 'b2b' || role === 'retail' || role === 'admin';
  const showBagPill = isShopper(role) || role === 'admin';

  return (
    <div className="w-full min-h-screen bg-surface selection:bg-secondary-container selection:text-on-secondary-container text-on-surface">
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-surface/95 backdrop-blur-xl shadow-[0px_24px_48px_rgba(26,28,27,0.08)] border-b border-outline-variant/20' 
            : 'bg-surface/70 backdrop-blur-md border-b border-transparent'
        }`}
      >
        <div className={`flex justify-between items-center w-full px-3 sm:px-4 xl:px-12 max-w-[1920px] mx-auto gap-2 sm:gap-4 transition-all duration-500 ${scrolled ? 'py-2 sm:py-2.5' : 'py-3 sm:py-4'}`}>
          <div className="flex flex-1 min-w-0 items-center gap-2 sm:gap-4 xl:gap-8">
            <a className="text-xl font-serif italic text-primary tracking-tight flex items-center gap-4 cursor-pointer flex-shrink-0" onClick={() => setView('home')}>
              <motion.img
                whileHover={{ rotate: 8, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 150, damping: 12 }}
                src="/sklovera-logo.svg" alt="Sklovera Logo" className="h-8 sm:h-10 object-contain drop-shadow"
              />
            </a>
            
            <div className="hidden sm:flex flex-1 min-w-0 items-center gap-1 xl:gap-2">
              <NavTab active={view === 'home'} onClick={() => { setView('home'); setDropdownOpen(false); }}>Home</NavTab>
              <NavTab active={view === 'catalog'} onClick={() => { setView('catalog'); setDropdownOpen(false); }}>Catalog</NavTab>
              
              {tabs.filter(v => v !== 'home' && v !== 'catalog').length > 0 && (
                <div className="relative">
                  <NavTab active={!['home', 'catalog'].includes(view)} onClick={() => setDropdownOpen(!dropdownOpen)}>
                    Manage
                    <span className="material-symbols-outlined text-[16px] ml-1 align-text-bottom" data-icon="expand_more">expand_more</span>
                  </NavTab>
                  
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                      <div className="absolute top-full left-0 mt-2 bg-surface-container rounded-xl shadow-xl py-2 min-w-[200px] border border-outline-variant/30 flex flex-col z-50">
                        {tabs.filter(v => v !== 'home' && v !== 'catalog').map((v) => (
                          <button 
                            key={v}
                            onClick={() => { setView(v); setDropdownOpen(false); }}
                            className={`px-4 py-2.5 text-left text-sm tracking-wide transition hover:bg-surface-container-high flex items-center justify-between ${view === v ? 'text-primary font-bold' : 'text-on-surface font-medium'}`}
                          >
                            <span>{viewLabel[v]}</span>
                            {v === 'admin' && (pendingCount + revisionCount) > 0 && (
                              <span className="ml-2 bg-error-container text-on-error-container text-[10px] px-2 py-0.5 rounded-full">
                                {pendingCount + revisionCount}
                              </span>
                            )}
                            {v === 'admin-rfqs' && rfqCount > 0 && (
                              <span className="ml-2 bg-error-container text-on-error-container text-[10px] px-2 py-0.5 rounded-full">
                                {rfqCount}
                              </span>
                            )}
                            {v === 'admin-inventory' && lowStockCount > 0 && (
                              <span className="ml-2 bg-tertiary-fixed/40 text-primary text-[10px] px-2 py-0.5 rounded-full">
                                {lowStockCount}
                              </span>
                            )}
                            {v === 'rfqs' && rfqCount > 0 && (
                              <span className="ml-2 bg-secondary-container text-on-secondary-container text-[10px] px-2 py-0.5 rounded-full">
                                {rfqCount}
                              </span>
                            )}
                            {(v === 'orders' || v === 'admin-orders') && ordersCount > 0 && (
                              <span className="ml-2 bg-secondary-container text-on-secondary-container text-[10px] px-2 py-0.5 rounded-full">
                                {ordersCount}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 xl:gap-6 flex-shrink-0">
            {/* Mobile search icon */}
            <button
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full bg-surface-container text-on-surface-variant"
              onClick={() => { setView('catalog'); }}
            >
              <span className="material-symbols-outlined text-lg" data-icon="search">search</span>
            </button>
            {/* Desktop search bar */}
            <div className="hidden lg:flex items-center bg-surface-container px-4 py-2 rounded-full">
              <span className="material-symbols-outlined text-sm mr-2 text-on-surface-variant" data-icon="search">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm w-40 lg:w-48 xl:w-80 outline-none text-on-surface" 
                placeholder="Search Sklovera..." 
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value && view !== 'catalog') setView('catalog');
                }}
              />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              {showBagPill && (
                <button
                  onClick={() => setBagOpen(true)}
                  className="text-xs font-semibold tracking-wide px-2 sm:px-3 py-2 rounded-md bg-primary text-surface hover:opacity-90 transition flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm sm:hidden" data-icon="shopping_bag">shopping_bag</span>
                  <span className="hidden sm:inline">Bag</span>
                  {bagCount > 0 && (
                    <span className="bg-surface text-primary text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full">
                      {bagCount}
                    </span>
                  )}
                </button>
              )}
              {showRfqPill && (
                <button
                  onClick={() => setCartOpen(true)}
                  className="hidden sm:flex text-xs font-semibold tracking-wide px-3 py-2 rounded-md bg-surface-container-low text-primary hover:bg-surface-container transition items-center gap-2"
                >
                  RFQ
                  {cartCount > 0 && (
                    <span className="bg-primary text-surface text-[10px] px-2 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
              <AuthBar onSignInClick={() => setView('login')} />
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation Row (Options) */}
        <div className="sm:hidden flex justify-center gap-3 py-2.5 border-t border-outline-variant/10 bg-surface/90 backdrop-blur-md">
          <NavTab active={view === 'home'} onClick={() => { setView('home'); setDropdownOpen(false); }}>Home</NavTab>
          <NavTab active={view === 'catalog'} onClick={() => { setView('catalog'); setDropdownOpen(false); }}>Catalog</NavTab>
          {tabs.filter(v => v !== 'home' && v !== 'catalog').length > 0 && (
            <div className="relative">
              <NavTab active={!['home', 'catalog'].includes(view)} onClick={() => setDropdownOpen(!dropdownOpen)}>
                Manage
                <span className="material-symbols-outlined text-[16px] ml-1 align-text-bottom" data-icon="expand_more">expand_more</span>
              </NavTab>
              
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 bg-surface-container rounded-xl shadow-xl py-2 min-w-[200px] border border-outline-variant/30 flex flex-col z-50">
                    {tabs.filter(v => v !== 'home' && v !== 'catalog' && v !== 'standards').map((v) => (
                      <button 
                        key={v}
                        onClick={() => { setView(v); setDropdownOpen(false); }}
                        className={`px-4 py-2.5 text-left text-sm tracking-wide transition hover:bg-surface-container-high flex items-center justify-between ${view === v ? 'text-primary font-bold' : 'text-on-surface font-medium'}`}
                      >
                        <span>{viewLabel[v]}</span>
                        {v === 'admin' && (pendingCount + revisionCount) > 0 && (
                          <span className="ml-2 bg-error-container text-on-error-container text-[10px] px-2 py-0.5 rounded-full">
                            {pendingCount + revisionCount}
                          </span>
                        )}
                        {v === 'admin-rfqs' && rfqCount > 0 && (
                          <span className="ml-2 bg-error-container text-on-error-container text-[10px] px-2 py-0.5 rounded-full">
                            {rfqCount}
                          </span>
                        )}
                        {v === 'admin-inventory' && lowStockCount > 0 && (
                          <span className="ml-2 bg-tertiary-fixed/40 text-primary text-[10px] px-2 py-0.5 rounded-full">
                            {lowStockCount}
                          </span>
                        )}
                        {v === 'rfqs' && rfqCount > 0 && (
                          <span className="ml-2 bg-secondary-container text-on-secondary-container text-[10px] px-2 py-0.5 rounded-full">
                            {rfqCount}
                          </span>
                        )}
                        {(v === 'orders' || v === 'admin-orders') && ordersCount > 0 && (
                          <span className="ml-2 bg-secondary-container text-on-secondary-container text-[10px] px-2 py-0.5 rounded-full">
                            {ordersCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </motion.nav>

      <AnimatePresence mode="wait">
        <motion.div key={view} variants={pageVariants} initial="initial" animate="animate" exit="exit" className="pt-32 sm:pt-20">
          {view === 'login' && (
            <LoginPage
              onDone={() => setView('home')}
              onRegisterVendor={() => setView('vendor-register')}
            />
          )}
          {view === 'home' && (
            <>
              <HeroSection onViewCatalog={() => setView('catalog')} onViewStandards={() => setView('standards')} />
              <TrustIndicators />
              <FeaturedCollections onExplore={() => setView('catalog')} />
              <FeaturedProducts
                onBrowseAll={() => setView('catalog')}
                limit={5}
                kicker="More from the Atelier"
                title="Newly Curated"
              />
              <SpecificationDrawer onRegister={() => setView('vendor-register')} />
            </>
          )}
          {view === 'catalog' && <ProductCatalog searchQuery={searchQuery} onSearchChange={setSearchQuery} />}
          {view === 'standards' && <StandardsPage />}
          {view === 'vendor' && <VendorUpload onDone={() => setView(role === 'admin' ? 'admin' : role === 'supplier' ? 'supplier-inventory' : 'home')} />}
          {view === 'supplier-inventory' && <SupplierInventory />}
          {view === 'admin-vendors' && <AdminVendors />}
          {view === 'vendor-register' && (
            <VendorRegister onDone={() => setView('home')} />
          )}
          {view === 'admin' && <AdminApprovals />}
          {view === 'admin-rfqs' && <RfqList scope="admin" />}
          {view === 'admin-pricing' && <AdminPricing />}
          {view === 'admin-inventory' && <AdminInventory />}
          {view === 'rfqs' && <RfqList scope="mine" />}
          {view === 'rfq-review' && (
            <RfqReview onSignIn={() => setView('login')} onSubmitted={() => setView('rfqs')} />
          )}
          {view === 'orders' && <Orders scope="mine" />}
          {view === 'admin-orders' && <Orders scope="admin" />}
          {view === 'checkout' && (
            <Checkout onSignIn={() => setView('login')} onOrderPlaced={() => setView('orders')} />
          )}
        </motion.div>
      </AnimatePresence>

      <RfqCart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => { setCartOpen(false); setView('rfq-review'); }}
      />
      <ShopCart
        open={bagOpen}
        onClose={() => setBagOpen(false)}
        onCheckout={() => { setBagOpen(false); setView('checkout'); }}
      />

      <ClientTicker />
      <Footer onRegisterVendor={() => setView('vendor-register')} />
    </div>
  );
}

export default App;
