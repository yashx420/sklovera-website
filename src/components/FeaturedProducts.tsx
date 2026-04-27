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
      if (!next.done) {
        picks.push(next.value);
        exhausted = false;
        if (picks.length >= limit) break;
      }
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 150, damping: 18 } },
  };

  return (
    <section className="py-24 px-12 bg-surface-container-low">
      <div className="max-w-[1920px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="flex justify-between items-end mb-12"
        >
          <div>
            <span className="text-on-surface-variant font-medium tracking-wide text-sm block mb-4">Editor's Picks</span>
            <h2 className="font-headline text-5xl italic text-primary">Featured Products</h2>
          </div>
          {onBrowseAll && (
            <button
              onClick={onBrowseAll}
              className="text-primary font-semibold flex items-center gap-2 group"
            >
              Browse Catalog
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="trending_flat">
                trending_flat
              </span>
            </button>
          )}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {featured.map((p) => {
            const price = shopper ? computeUnitPrice(p.priceEur, tier) : null;
            return (
              <motion.article
                key={p.id}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => setSelected(p)}
                className="bg-surface-container-lowest rounded-xl p-6 flex flex-col gap-3 cursor-pointer transition-shadow hover:shadow-xl"
              >
                <ProductImage
                  imageKey={p.imageKey}
                  alt={p.name}
                  className="aspect-[4/5] w-full object-contain rounded-md bg-surface-container"
                />
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="font-mono text-on-surface-variant">{p.sku}</span>
                  {p.category && (
                    <span className="text-tertiary-fixed font-semibold uppercase tracking-wider">{p.category}</span>
                  )}
                </div>
                <h3 className="font-headline italic text-2xl text-primary leading-snug">{p.name}</h3>
                {p.collection && (
                  <div className="text-xs uppercase tracking-widest text-secondary font-semibold">{p.collection}</div>
                )}
                <div className="mt-auto flex items-end justify-between pt-4 gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                      {shopper ? 'Price' : 'EXW'}
                    </div>
                    <div className="font-headline text-2xl text-primary whitespace-nowrap">
                      {shopper && price
                        ? `₹ ${price.inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                        : p.priceEur !== undefined ? `€ ${p.priceEur.toFixed(2)}` : '—'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {shopper && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); addToBag(p.id, 1); }}
                        className="text-xs bg-primary text-surface px-3 py-2 rounded-md font-semibold"
                      >
                        Add to bag
                      </motion.button>
                    )}
                    {showRfqCta && (
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
