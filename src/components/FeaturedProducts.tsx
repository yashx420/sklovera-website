import { useEffect, useMemo, useState } from 'react';
import { loadProducts, type Product } from '../lib/products';
import { addToCart } from '../lib/rfq';
import { addToBag, isShopper } from '../lib/shop';
import { computeUnitPrice, tierFromRole } from '../lib/pricing';
import { currentUser, onAuthChange, type User } from '../lib/auth';
import ProductImage from './ProductImage';
import ProductDetail from './ProductDetail';
import { motion, type Variants } from 'framer-motion';

type Props = { onBrowseAll?: () => void };

const pickFeatured = (products: Product[], limit = 8): Product[] => {
  const approved = products.filter((p) => p.status === 'approved');
  if (!approved.length) return [];
  const withImg = approved.filter((p) => p.imageKey);
  const pool = withImg.length >= limit ? withImg : approved;
  const byCollection = new Map<string, Product[]>();
  for (const p of pool) {
    const key = p.collection ?? '__none__';
    const list = byCollection.get(key) ?? [];
    list.push(p);
    byCollection.set(key, list);
  }
  const picks: Product[] = [];
  const iterators = Array.from(byCollection.values()).map((l) => l[Symbol.iterator]());
  let exhausted = false;
  while (picks.length < limit && !exhausted) {
    exhausted = true;
    for (const it of iterators) {
      const next = it.next();
      if (!next.done) { picks.push(next.value); exhausted = false; if (picks.length >= limit) break; }
    }
  }
  return picks;
};

const FeaturedProducts = ({ onBrowseAll }: Props) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User>(() => currentUser());
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);
  useEffect(() => {
    const refresh = () => setProducts(loadProducts());
    refresh();
    window.addEventListener('sklovera:products-updated', refresh);
    return () => window.removeEventListener('sklovera:products-updated', refresh);
  }, []);

  const featured = useMemo(() => pickFeatured(products), [products]);
  if (!featured.length) return null;

  const tier = tierFromRole(user.role);
  const shopper = isShopper(user.role);
  const showRfqCta = user.role === 'b2b' || user.role === 'retail' || user.role === 'admin';

  const containerV: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.2 } } };
  const itemV: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 150, damping: 18 } } };

  return (
    <section className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-8 lg:px-12 bg-surface-container-low overflow-hidden">
      {/* Green decorative background elements */}
      <div className="absolute inset-0 pointer-events-none grain-overlay">
        {/* Soft background gradient fill */}
        <div className="absolute inset-0 opacity-[0.08] bg-gradient-to-t from-emerald to-transparent" />
        
        {/* Large floating orbs */}
        <div className="absolute -top-20 -left-20 sm:-top-40 sm:-left-40 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full opacity-[0.12] animate-float-slow" style={{ background: 'radial-gradient(circle, #40916c 0%, transparent 60%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-[-5%] right-[-2%] sm:bottom-[-10%] sm:right-[-5%] w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] rounded-full opacity-[0.15] animate-float-medium" style={{ background: 'radial-gradient(circle, #2d6a4f 0%, transparent 60%)', filter: 'blur(40px)' }} />
        
        {/* Decorative architectural grid lines */}
        <div className="absolute inset-0 opacity-[0.08] hidden lg:block"
          style={{ backgroundImage: 'linear-gradient(rgba(45,106,79,1) 1px, transparent 1px), linear-gradient(90deg, rgba(45,106,79,1) 1px, transparent 1px)', backgroundSize: '6rem 6rem' }}
        />
        
        {/* Corner accent */}
        <svg className="absolute bottom-12 left-12 w-24 h-24 text-emerald/30 hidden lg:block animate-pulse-glow" viewBox="0 0 64 64">
          <rect x="0" y="0" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="2" rx="8" />
          <rect x="8" y="8" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" rx="4" />
          <circle cx="32" cy="32" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div className="max-w-[1920px] mx-auto relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1.2 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 sm:mb-12">
          <div>
            <span className="inline-flex items-center gap-2 text-on-surface-variant font-medium tracking-wide text-xs sm:text-sm mb-2 sm:mb-4">
              <span className="w-6 h-px bg-emerald/50" />Editor's Picks
            </span>
            <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl italic text-primary green-accent-line pb-2">Featured Products</h2>
          </div>
          {onBrowseAll && (
            <button onClick={onBrowseAll} className="text-emerald font-semibold flex items-center gap-2 group hover:gap-3 transition-all duration-300">
              Browse Catalog
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="trending_flat">trending_flat</span>
            </button>
          )}
        </motion.div>
        <motion.div variants={containerV} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-100px' }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featured.map((p) => {
            const price = shopper ? computeUnitPrice(p.priceEur, tier) : null;
            return (
              <motion.article key={p.id} variants={itemV} whileHover={{ y: -8, scale: 1.02 }} onClick={() => setSelected(p)} className="bg-surface-container-lowest rounded-xl p-3 sm:p-6 flex flex-col gap-2 sm:gap-3 cursor-pointer transition-shadow hover:shadow-xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-forest/0 via-emerald/3 to-jade/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-jade/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                <ProductImage imageKey={p.imageKey} alt={p.name} className="aspect-[4/5] w-full object-contain rounded-md bg-surface-container relative z-10" />
                <div className="flex items-center justify-between text-xs mt-2 relative z-10">
                  <span className="font-mono text-on-surface-variant">{p.sku}</span>
                  {p.category && <span className="text-emerald font-semibold uppercase tracking-wider bg-forest/5 px-2 py-0.5 rounded">{p.category}</span>}
                </div>
                <h3 className="font-headline italic text-lg sm:text-2xl text-primary leading-snug relative z-10">{p.name}</h3>
                {p.collection && <div className="text-xs uppercase tracking-widest text-secondary font-semibold relative z-10">{p.collection}</div>}
                <div className="mt-auto flex items-end justify-between pt-4 gap-3 relative z-10">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">{shopper ? 'Price' : 'EXW'}</div>
                    <div className="font-headline text-2xl text-primary whitespace-nowrap">
                      {shopper && price ? `₹ ${price.inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : p.priceEur !== undefined ? `€ ${p.priceEur.toFixed(2)}` : '—'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {shopper && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); addToBag(p.id, 1); }} className="text-xs bg-primary text-surface px-3 py-2 rounded-md font-semibold">Add to bag</motion.button>
                    )}
                    {showRfqCta && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); addToCart(p.id, 1); }} className="text-xs bg-forest/8 text-emerald px-3 py-2 rounded-md font-semibold hover:bg-forest/15 transition-colors">Add to RFQ</motion.button>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
        <ProductDetail product={selected} role={user.role} onClose={() => setSelected(null)} />
      </div>
    </section>
  );
};

export default FeaturedProducts;
