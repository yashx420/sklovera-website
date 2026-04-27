import { del, get, set } from 'idb-keyval';

const urlCache = new Map<string, string>();

const extToMime = (ext: string): string => {
  const e = ext.toLowerCase();
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
  if (e === 'png') return 'image/png';
  if (e === 'gif') return 'image/gif';
  if (e === 'webp') return 'image/webp';
  return 'application/octet-stream';
};

export const putImage = async (key: string, bytes: Uint8Array, ext: string): Promise<void> => {
  // Copy into a fresh buffer so IDB doesn't retain a view on the XLSX arrayBuffer.
  const buf = bytes.slice().buffer;
  const blob = new Blob([buf], { type: extToMime(ext) });
  await set(key, blob);
};

export const getImageUrl = async (key: string): Promise<string | undefined> => {
  const cached = urlCache.get(key);
  if (cached) return cached;
  const blob = (await get(key)) as Blob | undefined;
  if (!blob) return undefined;
  const url = URL.createObjectURL(blob);
  urlCache.set(key, url);
  return url;
};

export const deleteImage = async (key: string): Promise<void> => {
  const url = urlCache.get(key);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(key);
  }
  await del(key);
};
