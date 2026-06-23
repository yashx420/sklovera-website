import { useEffect, useMemo, useState } from 'react';
import { clearProducts, loadProducts, type Product } from '../lib/products';
import { addToCart } from '../lib/rfq';
import { addToBag } from '../lib/shop';
import { computeUnitPrice, tierFromRole } from '../lib/pricing';
import { getApprovedDiscount, onBusinessChange } from '../lib/business';
import { currentUser, onAuthChange, type User } from '../lib/auth';
import ProductDetail from './ProductDetail';
import ProductImage from './ProductImage';
import ProductCarousel from './ProductCarousel';
import { motion, type Variants } from 'framer-motion';

type Props = {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
};

const ProductCatalog = ({ searchQuery = '', onSearchChange }: Props = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User>(() => currentUser());
  const [localQuery, setLocalQuery] = useState('');
  const query = onSearchChange ? searchQuery : localQuery;
  const setQuery = onSearchChange || setLocalQuery;
  const [collection, setCollection] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selected, setSelected] = useState<Product | null>(null);
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollEl) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        let delta = e.deltaY;
        if (e.deltaMode === 1) { // line mode (Firefox)
          delta *= 40;
        } else if (e.deltaMode === 2) { // page mode
          delta *= scrollEl.clientWidth;
        }
        scrollEl.scrollLeft += delta;
      }
    };
    scrollEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      scrollEl.removeEventListener('wheel', handleWheel);
    };
  }, [scrollEl]);

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);

  // Approved bulk discount for the signed-in buyer (0 if none).
  const [accountDiscount, setAccountDiscount] = useState(0);
  useEffect(() => {
    const refresh = () => setAccountDiscount(getApprovedDiscount(currentUser().email));
    refresh();
    const offAuth = onAuthChange(refresh);
    const offBiz = onBusinessChange(refresh);
    return () => { offAuth(); offBiz(); };
  }, []);

  useEffect(() => {
    const refresh = () => setProducts(loadProducts());
    refresh();
    window.addEventListener('sklovera:products-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('sklovera:products-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // Catalog is the customer-facing view for everyone, admins included.
  // Admins manage non-approved products from the Approvals tab.
  const visible = useMemo(() => {
    const hasImage = (p: Product) => (p.imageKey || p.images?.length ? 0 : 1);
    const isAmber = (p: Product) => (p.supplierId === 'sup-amber' ? 0 : 1);
    return products
      .filter((p) => p.status === 'approved')
      // Products with images first (no-image pushed to the bottom);
      // Amber surfaced ahead of others within each group. Stable otherwise.
      .sort((a, b) => hasImage(a) - hasImage(b) || isAmber(a) - isAmber(b));
  }, [products]);

  const collections = useMemo(() => {
    const s = new Set<string>();
    visible.forEach((p) => p.collection && s.add(p.collection));
    return ['all', ...Array.from(s).sort()];
  }, [visible]);

  // Compute unique categories dynamically from visible products
  const categories = useMemo(() => {
    const map = new Map<string, { count: number; imageKey?: string }>();
    visible.forEach((p) => {
      const cat = p.category || 'Glassware';
      const existing = map.get(cat) || { count: 0, imageKey: undefined };
      existing.count += 1;
      if (!existing.imageKey && p.imageKey) {
        existing.imageKey = p.imageKey;
      }
      map.set(cat, existing);
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter((p) => {
      if (collection !== 'all' && p.collection !== collection) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.collection ?? '').toLowerCase().includes(q)
      );
    });
  }, [visible, query, collection, selectedCategory]);

  if (!visible.length) {
    return (
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }} className="max-w-[900px] mx-auto text-center">
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">Catalog</span>
          <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl italic text-primary mb-4">
            {products.length ? 'No approved products yet' : 'No products yet'}
          </h2>
          <p className="text-on-surface-variant">
            {products.length ? 'Products are awaiting admin review.' : 'Upload a supplier spreadsheet from the Supplier Portal to populate the catalog.'}
          </p>
        </motion.div>
      </section>
    );
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 150, damping: 18 } }
  };

  return (
    <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-8 lg:px-12">
      <div className="max-w-[1600px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="flex flex-wrap justify-between items-end gap-6 mb-10">
          <div>
            <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">Catalog</span>
            <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl italic text-primary">
              {filtered.length} <span className="not-italic font-sans text-xl sm:text-2xl lg:text-3xl text-on-surface-variant">of {visible.length} products</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search SKU or description" className="bg-surface-container-low px-4 py-3 rounded-md outline-none border-b border-outline-variant/30 focus:border-primary w-full sm:w-64 transition-colors"/>
            <select value={collection} onChange={(e) => setCollection(e.target.value)} className="bg-surface-container-low px-4 py-3 rounded-md outline-none">
              {collections.map((c) => (<option key={c} value={c}>{c === 'all' ? 'All collections' : c}</option>))}
            </select>
            {user.role === 'admin' && (
              <button onClick={() => { if (confirm('Clear all products from local catalog?')) clearProducts(); }} className="text-on-surface-variant text-sm underline-offset-4 hover:underline">Clear catalog</button>
            )}
          </div>
        </motion.div>

        {/* Dynamic Category Cards */}
        <div className="mb-12 border-b border-outline-variant/10 pb-8">
          <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">Browse by Category</span>
          <div 
            ref={setScrollEl}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-none select-none -mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12"
          >
            {/* All Curation Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 cursor-pointer rounded-2xl p-4 w-40 sm:w-44 flex flex-col justify-between transition-all duration-300 border ${
                selectedCategory === 'all'
                  ? 'bg-primary text-surface border-transparent shadow-[0_12px_24px_rgba(48,48,48,0.15)]'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-outline-variant/10'
              }`}
            >
              <div className="w-full aspect-square flex items-center justify-center rounded-xl bg-surface-container-lowest/30 mb-3 text-inherit">
                <span className="material-symbols-outlined text-3xl sm:text-4xl text-inherit" data-icon="grid_view">grid_view</span>
              </div>
              <div>
                <h4 className="font-headline italic text-lg leading-tight mb-1 text-inherit">All Curation</h4>
                <span className="text-[10px] uppercase tracking-widest opacity-60 font-semibold">{visible.length} items</span>
              </div>
            </motion.div>

            {/* Category Cards */}
            {categories.map((cat) => (
              <motion.div
                key={cat.name}
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex-shrink-0 cursor-pointer rounded-2xl p-4 w-40 sm:w-44 flex flex-col justify-between transition-all duration-300 border ${
                  selectedCategory === cat.name
                    ? 'bg-primary text-surface border-transparent shadow-[0_12px_24px_rgba(48,48,48,0.15)]'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-outline-variant/10'
                }`}
              >
                <div className={`w-full aspect-square flex items-center justify-center rounded-xl mb-3 relative overflow-hidden ${
                  cat.imageKey?.includes('/images/products/') ? 'bg-white' : 'bg-surface-container-lowest/50'
                }`}>
                  {cat.imageKey ? (
                    <ProductImage
                      imageKey={cat.imageKey}
                      alt={cat.name}
                      className={
                        cat.imageKey.includes('/images/amber/')
                          ? 'w-full h-full object-cover' // Amber lifestyle shots fill the tile
                          : 'w-full h-full object-contain p-2' // product cutouts stay uncropped
                      }
                    />
                  ) : (
                    <span className="material-symbols-outlined text-3xl opacity-40" data-icon="wine_bar">wine_bar</span>
                  )}
                </div>
                <div>
                  <h4 className="font-headline italic text-lg leading-tight mb-1 text-inherit">{cat.name}</h4>
                  <span className="text-[10px] uppercase tracking-widest opacity-60 font-semibold">{cat.count} items</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" key={`${query}-${collection}-${selectedCategory}`} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filtered.map((p) => (
            <motion.article key={p.id} variants={cardVariants} whileHover={{ y: -8, scale: 1.02 }} onClick={() => setSelected(p)} className="bg-surface-container-lowest rounded-xl p-3 sm:p-6 flex flex-col gap-2 sm:gap-3 transition-shadow hover:shadow-xl cursor-pointer border border-outline-variant/5">
              
              {/* Image tile — Amber lifestyle shots fill the frame (cover); product
                  cutouts stay contained so the whole product is visible (no cropping). */}
              <div className={`aspect-[4/5] w-full rounded-xl overflow-hidden relative group ${
                p.supplierId === 'sup-amber'
                  ? 'bg-gradient-to-b from-surface-container-low to-surface-container'
                  : 'bg-white'
              }`}>
                <ProductCarousel
                  images={p.images}
                  imageKey={p.imageKey}
                  alt={p.name}
                  className={
                    p.supplierId === 'sup-amber'
                      ? 'w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out'
                      : 'w-full h-full object-contain p-4 sm:p-5 group-hover:scale-[1.03] transition-transform duration-700 ease-out'
                  }
                />
                {p.supplierId === 'sup-amber' && (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl" />
              </div>

              <div className="flex items-start justify-between gap-2 text-xs">
                <span className="font-mono text-on-surface-variant min-w-0 break-all">{p.sku}</span>
                {p.category && (<span className="text-tertiary-fixed font-semibold uppercase tracking-wider text-right shrink-0 max-w-[45%]">{p.category}</span>)}
              </div>
              <h3 className="font-headline italic text-xl text-primary leading-snug">{p.name}</h3>
              {p.collection && (<div className="text-xs uppercase tracking-widest text-secondary font-semibold">{p.collection}</div>)}
              <div className="text-sm text-on-surface-variant flex flex-wrap gap-x-4 gap-y-1">
                {p.usableMl !== undefined && <span>{p.usableMl} ml</span>}
                {p.pcsPerBox !== undefined && <span>{p.pcsPerBox}/box</span>}
                {p.inventory !== undefined && <span>{p.inventory.toLocaleString()} in stock</span>}
              </div>
              {(() => {
                const role = user.role;
                const buyer = role === 'b2c' || role === 'b2b' || role === 'retail';
                const boxSize = p.pcsPerBox ?? p.pcsPerCarton ?? 1;
                const unitInr = computeUnitPrice(p.priceEur, tierFromRole(role), undefined, accountDiscount).inr;
                const boxInr = unitInr * boxSize;
                const pro = accountDiscount > 0; // approved retailer / distributor
                const inr0 = (n: number) => `₹ ${n.toLocaleString('en-IN', { maximumFractionDigits: n < 100 ? 1 : 0 })}`;
                const showBag = buyer || role === 'admin';
                const showRfq = role === 'guest' || role === 'b2b' || role === 'retail' || role === 'admin';
                return (
                  <div className="mt-auto flex items-end justify-between pt-2 gap-2">
                    {buyer ? (
                      pro ? (
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                            Per unit
                            <span className="text-[9px] font-bold text-on-secondary bg-secondary px-1.5 py-0.5 rounded">−{accountDiscount}%</span>
                          </div>
                          <div className="font-headline text-2xl text-primary whitespace-nowrap">
                            {p.priceEur !== undefined ? inr0(unitInr) : '—'}
                          </div>
                          {p.priceEur !== undefined && (
                            <div className="text-[10px] text-on-surface-variant whitespace-nowrap">{inr0(boxInr)} / box of {boxSize}</div>
                          )}
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Box of {boxSize}</div>
                          <div className="font-headline text-2xl text-primary whitespace-nowrap">
                            {p.priceEur !== undefined ? inr0(boxInr) : '—'}
                          </div>
                        </div>
                      )
                    ) : role === 'admin' ? (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">EXW</div>
                        <div className="font-headline text-2xl text-primary whitespace-nowrap">
                          {p.priceEur !== undefined ? `€ ${p.priceEur.toFixed(2)}` : '—'}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1" />
                    )}
                    <div className="flex flex-col gap-1 shrink-0">
                      {showBag && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => { e.stopPropagation(); addToBag(p.id, boxSize); }}
                          className="text-xs bg-primary text-surface px-3 py-2 rounded-md font-semibold"
                        >
                          Add to bag
                        </motion.button>
                      )}
                      {showRfq && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => { e.stopPropagation(); addToCart(p.id, 1); }}
                          className="text-xs bg-surface-container text-primary px-3 py-2 rounded-md font-semibold"
                        >
                          Add to RFQ
                        </motion.button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </motion.article>
          ))}
        </motion.div>

        <ProductDetail product={selected} role={user.role} onClose={() => setSelected(null)} />
      </div>
    </section>
  );
};

export default ProductCatalog;
