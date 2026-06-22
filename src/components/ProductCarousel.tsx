import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ProductImage from './ProductImage';

type Props = {
  /** All product photos. When more than one, a carousel is rendered. */
  images?: string[];
  /** Single-image fallback (used when `images` is absent or has one entry). */
  imageKey?: string;
  alt: string;
  className?: string;
  fallbackIcon?: string;
};

/**
 * Drop-in replacement for <ProductImage> that shows a carousel when a product
 * has multiple photos. Renders identically to ProductImage for 0–1 images.
 * Arrow/dot controls stop propagation so they work inside a clickable card.
 * Requires a positioned (relative) ancestor for the absolute controls.
 */
const ProductCarousel = ({ images, imageKey, alt, className, fallbackIcon }: Props) => {
  const list = images && images.length ? images : imageKey ? [imageKey] : [];
  const [idx, setIdx] = useState(0);

  if (list.length <= 1) {
    return (
      <ProductImage imageKey={list[0] ?? imageKey} alt={alt} className={className} fallbackIcon={fallbackIcon} />
    );
  }

  const go = (e: React.MouseEvent, dir: number) => {
    e.stopPropagation();
    e.preventDefault();
    setIdx((i) => (i + dir + list.length) % list.length);
  };
  const jump = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    e.preventDefault();
    setIdx(i);
  };

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="contents"
        >
          <ProductImage imageKey={list[idx]} alt={`${alt} (${idx + 1}/${list.length})`} className={className} fallbackIcon={fallbackIcon} />
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next — appear on hover of the card group */}
      <button
        type="button"
        aria-label="Previous image"
        onClick={(e) => go(e, -1)}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-surface/80 backdrop-blur-sm shadow-md flex items-center justify-center text-on-surface opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface"
      >
        <span className="material-symbols-outlined text-base" data-icon="chevron_left">chevron_left</span>
      </button>
      <button
        type="button"
        aria-label="Next image"
        onClick={(e) => go(e, 1)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-surface/80 backdrop-blur-sm shadow-md flex items-center justify-center text-on-surface opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface"
      >
        <span className="material-symbols-outlined text-base" data-icon="chevron_right">chevron_right</span>
      </button>

      {/* Dots */}
      <div className="absolute bottom-1.5 left-0 right-0 z-20 flex items-center justify-center gap-1.5">
        {list.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to image ${i + 1}`}
            onClick={(e) => jump(e, i)}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? 'w-4 bg-primary' : 'w-1.5 bg-on-surface-variant/40 hover:bg-on-surface-variant/70'
            }`}
          />
        ))}
      </div>
    </>
  );
};

export default ProductCarousel;
