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
    <div className={`flex items-center justify-center bg-surface-container ${className ?? ''}`}>
      <span className="material-symbols-outlined text-on-surface-variant text-5xl" data-icon={fallbackIcon}>
        {fallbackIcon}
      </span>
    </div>
  );
};

export default ProductImage;
