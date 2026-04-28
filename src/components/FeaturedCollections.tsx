import { useEffect, useMemo, useState } from 'react';
import { loadProducts, type Product } from '../lib/products';
import ProductImage from './ProductImage';
import { motion } from 'framer-motion';

type Props = { onExplore?: (collection: string) => void };
type CollectionTile = { name: string; count: number; hero: Product; imageSrc?: string };

const pickTiles = (products: Product[], limit = 3): CollectionTile[] => {
  const approved = products.filter((p) => p.status === 'approved' && p.collection);
  const byCol = new Map<string, Product[]>();
  for (const p of approved) { const name = p.collection!; const list = byCol.get(name) ?? []; list.push(p); byCol.set(name, list); }
  const tiles: CollectionTile[] = Array.from(byCol.entries()).map(([name, list]) => ({ name, count: list.length, hero: list.find((p) => p.imageKey) ?? list[0] }));
  tiles.sort((a, b) => b.count - a.count);
  return tiles.slice(0, limit);
};

const FeaturedCollections = ({ onExplore }: Props) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const refresh = () => setProducts(loadProducts());
    refresh();
    window.addEventListener('sklovera:products-updated', refresh);
    return () => window.removeEventListener('sklovera:products-updated', refresh);
  }, []);

  let tiles = useMemo(() => {
    const rawTiles = pickTiles(products);
    const overrides = ['/images/premium.png', '/images/minimal.png', '/images/modern.png'];
    return rawTiles.map((t, i) => ({ ...t, imageSrc: overrides[i] || t.imageSrc }));
  }, [products]);

  if (!tiles.length) {
    tiles = [
      { name: 'Premium', count: 24, hero: { category: 'Wine Glasses', productionType: 'European modern design' } as Product, imageSrc: '/images/premium.png' },
      { name: 'Minimal', count: 18, hero: { category: 'Tumblers', productionType: 'Sleek functional minimalism' } as Product, imageSrc: '/images/minimal.png' },
      { name: 'Modern Classy European', count: 36, hero: { category: 'Artisanal', productionType: 'Beautifully crafted wine glasses' } as Product, imageSrc: '/images/modern.png' },
    ];
  }

  const [main, ...rest] = tiles;

  return (
    <section className="relative py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full green-gradient-subtle" />
        <div className="absolute top-[20%] right-[8%] w-[400px] h-[400px] rounded-full opacity-[0.04] animate-float-slow" style={{ background: 'radial-gradient(circle, #52b788 0%, transparent 60%)' }} />
        {/* Decorative corner brackets */}
        <svg className="absolute top-12 left-8 w-12 h-12 text-emerald/8 hidden lg:block" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 16V2h14M32 2h14v14M46 32v14H32M16 46H2V32" />
        </svg>
      </div>

      <div className="max-w-[1920px] mx-auto relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1.2 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 sm:mb-12 lg:mb-16">
          <div>
            <span className="inline-flex items-center gap-2 text-on-surface-variant font-medium tracking-wide text-xs sm:text-sm block mb-2 sm:mb-4">
              <span className="w-6 h-px bg-emerald/50" />
              Curated Selections
            </span>
            <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl italic text-primary green-accent-line pb-2">Featured Collections</h2>
          </div>
          {onExplore && (
            <button onClick={() => onExplore('__all__')} className="text-emerald font-semibold flex items-center gap-2 group">
              View Sourcing Archive
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="trending_flat">trending_flat</span>
            </button>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          <motion.button initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }} whileHover={{ scale: 1.01 }} onClick={() => onExplore?.(main.name)} className="col-span-1 lg:col-span-8 group relative overflow-hidden rounded-xl bg-surface-container h-[300px] sm:h-[400px] lg:h-[600px] text-left">
            {main.imageSrc ? (
              <img src={main.imageSrc} alt={main.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <ProductImage imageKey={main.hero.imageKey} alt={main.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            )}
            {/* Dark overlay for readable text */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-8 lg:p-12" style={{ background: 'linear-gradient(to top, rgba(15,34,24,0.92) 0%, rgba(15,34,24,0.6) 40%, rgba(15,34,24,0.1) 70%, transparent 100%)' }}>
              <motion.span initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 1 }} className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: '#95d5b2' }}>
                {main.count} SKU{main.count === 1 ? '' : 's'}
              </motion.span>
              <motion.h3 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.8, duration: 1.2 }} className="text-2xl sm:text-3xl lg:text-5xl font-headline italic mb-2 sm:mb-4" style={{ color: '#ffffff' }}>
                {main.name}
              </motion.h3>
              <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1, duration: 1 }} className="max-w-sm mb-6" style={{ color: 'rgba(183,228,199,0.85)' }}>
                {main.hero.category ? `${main.hero.category} · ` : ''}{main.hero.productionType ?? 'Curated glassware in this collection.'}
              </motion.p>
              <motion.span initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 1.2, duration: 1 }} className="px-8 py-3 w-fit rounded-lg font-semibold inline-flex items-center gap-2" style={{ backgroundColor: '#ffffff', color: '#1a3a2a' }}>
                Explore Collection
                <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
              </motion.span>
            </div>
            {/* Green corner accent */}
            <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden">
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-emerald/20 rounded-full blur-xl" />
            </div>
          </motion.button>

          <div className="col-span-1 lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
            {rest.map((t, i) => (
              <motion.button key={t.name} initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.4 + i * 0.3, ease: [0.16, 1, 0.3, 1] }} whileHover={{ scale: 1.02 }} onClick={() => onExplore?.(t.name)} className={`${i % 2 === 0 ? 'bg-surface-container-highest' : 'bg-surface-container'} rounded-xl group relative overflow-hidden p-4 sm:p-8 flex flex-col justify-between text-left min-h-[180px] sm:min-h-[220px] lg:min-h-0 lg:flex-1`}>
                {t.imageSrc ? (
                  <img src={t.imageSrc} alt={t.name} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <ProductImage imageKey={t.hero.imageKey} alt={t.name} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-700" />
                )}
                {/* Green-tinted overlay on hover */}
                <div className="absolute inset-0 bg-forest/0 group-hover:bg-forest/10 transition-colors duration-500" />
                <div className="relative z-10 bg-surface/90 backdrop-blur-sm p-6 rounded-lg w-fit">
                  <h4 className="font-headline text-2xl italic text-primary">{t.name}</h4>
                  <span className="text-sm text-emerald font-medium">{t.count} SKU{t.count === 1 ? '' : 's'}</span>
                </div>
                <div className="relative z-10">
                  <span className="material-symbols-outlined bg-forest text-sage p-4 rounded-full group-hover:rotate-45 group-hover:bg-emerald transition-all duration-300" data-icon="add">add</span>
                </div>
              </motion.button>
            ))}
            {rest.length === 0 && (
              <div className="flex-1 bg-surface-container rounded-xl p-8 flex items-center justify-center text-on-surface-variant text-sm">
                More collections will appear here as suppliers add them.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;
