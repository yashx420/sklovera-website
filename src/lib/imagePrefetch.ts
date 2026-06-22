// Background image cache-warming. Runs during browser idle time after first
// paint, so catalog imagery is already in the HTTP cache by the time the user
// scrolls or opens a product — without blocking the initial load. Uses
// <link rel="prefetch" as="image"> (low priority, no decode cost).

type IdleCb = (deadline?: { timeRemaining: () => number }) => void;

const schedule = (cb: IdleCb): void => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: IdleCb, o?: { timeout: number }) => void })
      .requestIdleCallback(cb, { timeout: 2000 });
  } else {
    setTimeout(() => cb(), 200);
  }
};

let started = false;

/**
 * Prefetch image URLs in small idle-time batches. Safe to call repeatedly —
 * only the first call does work (guards against StrictMode double-invoke).
 */
export const prefetchImages = (urls: (string | undefined)[], cap = 1500): void => {
  if (started || typeof document === 'undefined') return;
  started = true;

  const seen = new Set<string>();
  const queue: string[] = [];
  for (const u of urls) {
    if (u && u.startsWith('/') && !seen.has(u)) {
      seen.add(u);
      queue.push(u);
      if (queue.length >= cap) break;
    }
  }

  let i = 0;
  const pump: IdleCb = (deadline) => {
    let n = 0;
    while (i < queue.length && n < 8 && (!deadline || deadline.timeRemaining() > 0)) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = queue[i++];
      document.head.appendChild(link);
      n++;
    }
    if (i < queue.length) schedule(pump);
  };
  schedule(pump);
};
