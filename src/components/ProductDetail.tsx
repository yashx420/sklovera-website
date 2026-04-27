import { useState } from 'react';
import { removeProducts, setProductStatus, type Product } from '../lib/products';
import { addToCart } from '../lib/rfq';
import { addToBag, isShopper } from '../lib/shop';
import { computeUnitPrice, tierFromRole } from '../lib/pricing';
import type { Role } from '../lib/auth';
import ProductImage from './ProductImage';
import { motion, AnimatePresence } from 'framer-motion';

type Props = { product: Product | null; role: Role; onClose: () => void };

const Row = ({ label, value }: { label: string; value: React.ReactNode }) =>
  value === undefined || value === null || value === '' ? null : (
    <div className="flex justify-between gap-6 py-2 border-b border-outline-variant/15">
      <span className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</span>
      <span className="text-sm text-primary text-right">{value}</span>
    </div>
  );

const ProductDetail = ({ product, role, onClose }: Props) => {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  if (!product) return null;
  const adminView = role === 'admin';

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-primary/30 z-50"
        onClick={onClose}
      />
      <motion.aside
        key="drawer"
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 150, damping: 22 }}
        className="fixed top-0 right-0 bottom-0 w-full sm:max-w-[520px] z-50 overflow-y-auto"
        style={{
          background: 'rgba(250, 249, 247, 0.92)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0px 24px 48px rgba(26, 28, 27, 0.12)',
        }}
      >
        <div className="p-5 sm:p-10">
          <motion.button
            whileHover={{ scale: 1.2, rotate: 90 }}
            onClick={onClose}
            className="absolute top-6 right-6 text-on-surface-variant hover:text-primary"
            aria-label="Close"
          >
            ✕
          </motion.button>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="text-xs font-mono text-on-surface-variant mb-2">{product.sku}</div>
            <h3 className="font-headline text-4xl italic text-primary mb-2">{product.name}</h3>
            {product.collection && (
              <div className="text-xs uppercase tracking-widest text-secondary font-semibold mb-6">{product.collection}</div>
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <ProductImage imageKey={product.imageKey} alt={product.name} className="w-full aspect-video object-contain rounded-md mb-8 bg-surface-container"/>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-0">
            <Row label="Category" value={product.category} />
            <Row label="Production type" value={product.productionType} />
            <Row label="EAN" value={product.ean} />
            <Row label="Height / Diameter" value={product.heightOrDiameter} />
            <Row label="Usable capacity" value={product.usableMl !== undefined ? `${product.usableMl} ml${product.usableOz ? ` · ${product.usableOz} oz` : ''}` : undefined} />
            <Row label="Total capacity" value={product.totalMl !== undefined ? `${product.totalMl} ml${product.totalOz ? ` · ${product.totalOz} oz` : ''}` : undefined} />
            <Row label="Pcs per box" value={product.pcsPerBox} />
            <Row label="Carton" value={product.cartonType ? `${product.cartonType}${product.pcsPerCarton ? ` · ${product.pcsPerCarton} pcs` : ''}` : undefined} />
            <Row label="Pcs per pallet" value={product.pcsPerPallet} />
            <Row label="Logo capable" value={product.logoCapable ? 'Yes' : undefined} />
            <Row label="Unit price (EXW)" value={product.priceEur !== undefined ? `€ ${product.priceEur.toFixed(2)}` : undefined} />
            <Row label="Unit price (USD)" value={product.priceUsd !== undefined ? `$ ${product.priceUsd.toFixed(2)}` : undefined} />
            <Row label="Inventory" value={product.inventory?.toLocaleString()} />
            {adminView && <Row label="Supplier" value={product.supplier} />}
            {adminView && <Row label="Status" value={product.status} />}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            {adminView ? (
              <div className="mt-8 space-y-3">
                <div className="flex gap-3">
                  {product.status !== 'approved' && (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setProductStatus([product.id], 'approved'); onClose(); }} className="flex-1 bg-secondary text-on-secondary py-3 rounded-md font-semibold">Approve</motion.button>
                  )}
                  {product.status !== 'rejected' && (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setProductStatus([product.id], 'rejected'); onClose(); }} className="flex-1 bg-error-container text-on-error-container py-3 rounded-md font-semibold">Reject</motion.button>
                  )}
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { if (confirm('Delete this product permanently? This also removes its photo.')) { removeProducts([product.id]); onClose(); } }} className="w-full bg-primary text-surface py-3 rounded-md font-semibold">Delete product</motion.button>
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant">Quantity</span>
                  <div className="flex items-center bg-surface-container rounded-md overflow-hidden">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1 text-primary hover:bg-surface-container-high">–</button>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (!Number.isNaN(n) && n > 0) setQty(n);
                      }}
                      className="w-16 bg-transparent text-center outline-none text-sm"
                    />
                    <button onClick={() => setQty((q) => q + 1)} className="px-3 py-1 text-primary hover:bg-surface-container-high">+</button>
                  </div>
                </div>
                {(() => {
                  const tier = tierFromRole(role);
                  const shopper = isShopper(role);
                  const price = computeUnitPrice(product.priceEur, tier);
                  return (
                    <>
                      {shopper && (
                        <div className="flex items-end justify-between pb-3 border-b border-outline-variant/20">
                          <div className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                            Price · {tier.toUpperCase()}
                          </div>
                          <div className="font-headline text-3xl text-primary">
                            ₹ {price.inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3">
                        {shopper ? (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { addToBag(product.id, qty); setAdded(true); setTimeout(() => setAdded(false), 1600); }}
                            className="flex-1 bg-primary text-surface py-3 rounded-md font-semibold"
                          >
                            {added ? 'Added to bag ✓' : `Add to bag · ₹ ${(price.inr * qty).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { addToCart(product.id, qty); setAdded(true); setTimeout(() => setAdded(false), 1600); }}
                            className="flex-1 bg-primary text-surface py-3 rounded-md font-semibold"
                          >
                            {added ? 'Added to RFQ ✓' : 'Add to RFQ'}
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 bg-secondary text-on-secondary py-3 rounded-md font-semibold"
                        >
                          Request sample
                        </motion.button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </motion.div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

export default ProductDetail;
