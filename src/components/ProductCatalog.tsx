import { useEffect, useMemo, useState } from 'react';
import { clearProducts, loadProducts, type Product } from '../lib/products';
import { addToCart } from '../lib/rfq';
import { addToBag, isShopper } from '../lib/shop';
import { computeUnitPrice, tierFromRole } from '../lib/pricing';
import { currentUser, onAuthChange, type User } from '../lib/auth';
import ProductDetail from './ProductDetail';
import ProductImage from './ProductImage';
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
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => onAuthChange(() => setUser(currentUser())), []);

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
  const visible = useMemo(
    () => products.filter((p) => p.status === 'approved'),
    [products],
  );

  const collections = useMemo(() => {
    const s = new Set<string>();
    visible.forEach((p) => p.collection && s.add(p.collection));
    return ['all', ...Array.from(s).sort()];
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter((p) => {
      if (collection !== 'all' && p.collection !== collection) return false;
      if (!q) return true;
      return (
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.collection ?? '').toLowerCase().includes(q)
      );
    });
  }, [visible, query, collection]);

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

        <motion.div variants={containerVariants} initial="hidden" animate="show" key={`${query}-${collection}`} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filtered.map((p) => (
            <motion.article key={p.id} variants={cardVariants} whileHover={{ y: -8, scale: 1.02 }} onClick={() => setSelected(p)} className="bg-surface-container-lowest rounded-xl p-3 sm:p-6 flex flex-col gap-2 sm:gap-3 transition-shadow hover:shadow-xl cursor-pointer">
              <ProductImage imageKey={p.imageKey} alt={p.name} className="aspect-square w-full object-contain rounded-md bg-surface-container"/>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-on-surface-variant">{p.sku}</span>
                {p.category && (<span className="text-tertiary-fixed font-semibold uppercase tracking-wider">{p.category}</span>)}
              </div>
              <h3 className="font-headline italic text-xl text-primary leading-snug">{p.name}</h3>
              {p.collection && (<div className="text-xs uppercase tracking-widest text-secondary font-semibold">{p.collection}</div>)}
              <div className="text-sm text-on-surface-variant flex flex-wrap gap-x-4 gap-y-1">
                {p.usableMl !== undefined && <span>{p.usableMl} ml</span>}
                {p.pcsPerBox !== undefined && <span>{p.pcsPerBox}/box</span>}
                {p.inventory !== undefined && <span>{p.inventory.toLocaleString()} in stock</span>}
              </div>
              {(() => {
                const tier = tierFromRole(user.role);
                const shopper = isShopper(user.role);
                const price = shopper ? computeUnitPrice(p.priceEur, tier) : null;
                return (
                  <div className="mt-auto flex items-end justify-between pt-2 gap-2">
                    {shopper ? (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">Price</div>
                        <div className="font-headline text-2xl text-primary whitespace-nowrap">
                          {price ? `₹ ${price.inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                        </div>
                      </div>
                    ) : user.role === 'admin' ? (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">EXW</div>
                        <div className="font-headline text-2xl text-primary whitespace-nowrap">
                          {p.priceEur !== undefined ? `€ ${p.priceEur.toFixed(2)}` : '—'}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1" />
                    )}
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
                      {(user.role === 'b2b' || user.role === 'retail' || user.role === 'admin') && (
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
