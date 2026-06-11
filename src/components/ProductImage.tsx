import { useEffect, useState } from 'react';
import { getImageUrl } from '../lib/images';

type Props = {
  imageKey?: string;
  alt: string;
  className?: string;
  /** Fallback icon shown when there is no image. */
  fallbackIcon?: string;
};

const ProductImage = ({ imageKey, alt, className, fallbackIcon = 'wine_bar' }: Props) => {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    if (!imageKey) {
      setUrl(undefined);
      return;
    }
    if (imageKey.startsWith('/') || imageKey.startsWith('http')) {
      setUrl(imageKey);
      return;
    }
    getImageUrl(imageKey).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [imageKey]);

  if (url) {
    return <img src={url} alt={alt} className={className} loading="lazy" />;
  }
  return (
    <div className={`flex flex-col items-center justify-center bg-surface-container-low/50 rounded-xl text-center p-3 sm:p-4 w-full h-full min-h-[100px] border border-outline-variant/10 ${className ?? ''}`}>
      <span className="material-symbols-outlined text-on-surface-variant/40 text-3xl mb-1.5" data-icon={fallbackIcon}>
        {fallbackIcon}
      </span>
      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-on-surface-variant/50 font-bold font-sans">
        No image available
      </span>
    </div>
  );
};

export default ProductImage;
