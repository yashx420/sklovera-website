// Regenerate the Amber Glass catalog seed from the source spreadsheets.
// Run from the repo root:  node scripts/gen-amber-seed.mjs
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

const dir = 'public/amber';
const OUT_DIR = 'public/images/amber';
const safe = (s) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');

/**
 * Pull embedded product photos out of an xlsx (e.g. the HoReCa sheets, where
 * each row's "Photo" column holds an image). Returns Map<sheetRow, {bytes, ext}>,
 * preferring the image anchored at `preferredCol`.
 */
const extractXlsxImagesByRow = async (filePath, preferredCol = 0) => {
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const byRow = new Map();
  const drawingNames = Object.keys(zip.files).filter((n) => /^xl\/drawings\/drawing\d+\.xml$/i.test(n));
  for (const drawingName of drawingNames) {
    const relsName = drawingName.replace(/drawings\/(drawing\d+\.xml)$/i, 'drawings/_rels/$1.rels');
    const relsFile = zip.file(relsName);
    const drawFile = zip.file(drawingName);
    if (!relsFile || !drawFile) continue;
    const relsXml = await relsFile.async('string');
    const rId = new Map();
    for (const m of relsXml.matchAll(/<Relationship\b[^>]*>/g)) {
      const id = (m[0].match(/Id="([^"]+)"/) || [])[1];
      const target = (m[0].match(/Target="([^"]+)"/) || [])[1];
      if (id && target) rId.set(id, target);
    }
    const drawXml = await drawFile.async('string');
    const anchors = drawXml.split(/<(?:\w+:)?(?:two|one)CellAnchor/).slice(1);
    for (const a of anchors) {
      const fromBlock = (a.match(/<(?:\w+:)?from>([\s\S]*?)<\/(?:\w+:)?from>/) || [])[1];
      if (!fromBlock) continue;
      const col = Number((fromBlock.match(/<(?:\w+:)?col>(\d+)/) || [])[1]);
      const row = Number((fromBlock.match(/<(?:\w+:)?row>(\d+)/) || [])[1]);
      if (Number.isNaN(col) || Number.isNaN(row)) continue;
      const embed = (a.match(/<(?:\w+:)?blip[^>]*embed="([^"]+)"/) || [])[1];
      if (!embed) continue;
      const target = rId.get(embed);
      if (!target) continue;
      const resolved = 'xl/' + target.replace(/^\.\.\//, '');
      const mediaFile = zip.file(resolved);
      if (!mediaFile) continue;
      const bytes = await mediaFile.async('nodebuffer');
      if (!bytes.length) continue;
      const ext = (resolved.split('.').pop() || 'bin').toLowerCase();
      const existing = byRow.get(row);
      if (!existing || (existing.col !== preferredCol && col === preferredCol)) {
        byRow.set(row, { bytes, ext, col });
      }
    }
  }
  return byRow;
};

// Category for the single-glass "Amber Glass line offer" sheet (codes only, no type).
const gCategoryForSku = (sku) => {
  if (/box|set/i.test(sku)) return 'Gift Sets';
  if (/^V/i.test(sku)) return 'Vases';
  if (/^(CG|G)/i.test(sku)) return 'Stemware';
  return 'Glassware';
};

const parsePrice = (v) => {
  if (v == null) return undefined;
  const s = String(v);
  const m = s.match(/(\d+[.,]?\d*)/);
  if (!m) return undefined;
  const n = Number(m[1].replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};
const parseInt0 = (v) => {
  if (v == null) return undefined;
  const m = String(v).match(/(\d+)/);
  return m ? Number(m[1]) : undefined;
};
const pcsFromPacked = (v) => {
  if (!v) return undefined;
  const m = String(v).match(/x\s*(\d+)/i);
  return m ? Number(m[1]) : undefined;
};
const mlFromText = (v) => {
  if (!v) return undefined;
  const m = String(v).match(/(\d+)\s*ml/i);
  return m ? Number(m[1]) : undefined;
};
const categoryFor = (t = '') => {
  const s = t.toLowerCase();
  if (/wine|sparkling|champagne|flute|goblet/.test(s)) return 'Stemware';
  if (/cocktail|whisk|tumbler|rock|highball|barware|shot/.test(s)) return 'Barware';
  if (/decanter|carafe/.test(s)) return 'Decanters';
  if (/vase/.test(s)) return 'Vases';
  if (/water|juice|beer|long drink/.test(s)) return 'Tumblers & Highballs';
  return 'Hospitality Range';
};
const clean = (v) => (v == null ? undefined : String(v).replace(/\s+/g, ' ').trim() || undefined);

const products = [];
const seen = new Set();
const push = (p) => {
  if (!p.sku) return;
  const id = `sup-amber:${p.sku}`;
  if (seen.has(id)) return;
  seen.add(id);
  products.push({
    id,
    status: 'approved',
    supplier: 'Amber Glass',
    supplierId: 'sup-amber',
    createdAt: 0,
    ...p,
  });
};

const readSheet = (file, sheet) => {
  const wb = XLSX.read(fs.readFileSync(path.join(dir, file)), { type: 'buffer' });
  const ws = wb.Sheets[sheet];
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
};

// 1) G-series — "Amber Glass line offer" (header row 0)
//    Photo, Name, Wholesale, Discount, Price for you, Availability, Quantities, Packed, Quality
{
  const rows = readSheet('Amber Glass line offer - USD.xlsx 19.03.2026.xlsx', 'Arkusz1');
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const sku = clean(row[1]);
    if (!sku) continue;
    const packed = clean(row[7]);
    push({
      sku,
      name: `Amber Glass ${sku}`,
      collection: 'Amber Glass Line',
      category: gCategoryForSku(sku),
      priceUsd: parsePrice(row[4]) ?? parsePrice(row[2]),
      stockIntl: parseInt0(row[6]),
      cartonType: packed,
      pcsPerCarton: pcsFromPacked(packed),
    });
  }
}

// 2) Model 19 series — "Amber Glass lines" (header row 2)
//    Name, Type, Wholesale, Discount, Price for you, Packed, Availability, Quantities
{
  const rows = readSheet('Copy of Wholesale price range -Amber Glass lines.xlsx', 'Arkusz 1');
  for (let r = 3; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const sku = clean(row[0]);
    if (!sku) continue;
    const type = clean(row[1]);
    const packed = clean(row[5]);
    push({
      sku,
      name: type || sku,
      collection: 'Amber Glass Lines',
      category: categoryFor(type),
      productionType: type,
      priceUsd: parsePrice(row[4]) ?? parsePrice(row[2]),
      stockIntl: parseInt0(row[7]),
      cartonType: packed,
      pcsPerCarton: pcsFromPacked(packed),
    });
  }
}

// 3 & 4) HoReCa lines (header row 0)
//    Photo, Type, Dimensions, Quantities, Wholesale, Discount, Price for you, Packed, Quality
fs.mkdirSync(OUT_DIR, { recursive: true });
let horecaImgs = 0;
for (const [file, collection] of [
  ['HoReCa glassware line 1 - USD.xlsx 19.03.26.xlsx', 'HoReCa Line 1'],
  ['HoReCa glassware line 2 - USD.xlsx 19.03.2026.xlsx', 'HoReCa Line 2'],
]) {
  const rows = readSheet(file, 'Arkusz1');
  const imgByRow = await extractXlsxImagesByRow(path.join(dir, file), 0);
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const sku = clean(row[1]);
    if (!sku) continue;
    const dims = clean(row[2]);
    const packed = clean(row[7]);
    const ml = mlFromText(sku);
    let imageKey;
    const img = imgByRow.get(r);
    if (img) {
      const outName = `${safe(sku)}.${img.ext}`;
      fs.writeFileSync(path.join(OUT_DIR, outName), img.bytes);
      imageKey = `/images/amber/${outName}`;
      horecaImgs++;
    }
    push({
      sku,
      name: sku,
      collection,
      category: 'Hospitality Range',
      heightOrDiameter: dims,
      totalMl: ml,
      usableMl: ml,
      priceUsd: parsePrice(row[6]) ?? parsePrice(row[4]),
      stockIntl: parseInt0(row[3]),
      cartonType: packed,
      pcsPerCarton: pcsFromPacked(packed),
      imageKey,
    });
  }
}
console.log(`Extracted ${horecaImgs} HoReCa photos from xlsx.`);

// ---------------------------------------------------------------------------
// Match product photos from the two image folders and copy them into
// public/images/amber/. A product with several photos gets an `images[]` array
// (rendered as a carousel); the first becomes `imageKey`.
// ---------------------------------------------------------------------------
const IMAGE_DIRS = [
  'photography session images',
  'wetransfer_ag-by-kr-1-jpg_2025-11-17_1016',
];
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

// Base lookup key for a product (drop the "(… pcs inside)" / pattern suffix).
const productKey = (sku) => norm(sku.split(' (')[0]);
const productByKey = new Map();
for (const p of products) {
  const k = productKey(p.sku);
  if (!productByKey.has(k)) productByKey.set(k, []);
  productByKey.get(k).push(p);
}

// Gather candidate image files, deduped by (variant, counter) across folders.
const picked = new Map(); // dedupeKey -> { keys:Set, counter, srcDir, file, ext }
for (const dir of IMAGE_DIRS) {
  const full = path.join('public/amber', dir);
  if (!fs.existsSync(full)) continue;
  for (const file of fs.readdirSync(full)) {
    if (!/\.(jpe?g|png)$/i.test(file)) continue;
    const ext = file.split('.').pop().toLowerCase();
    const stem = file.replace(/\.[^.]+$/, '');
    const counterMatch = stem.match(/\s*-\s*(\d+)\s*$/);
    const counter = counterMatch ? Number(counterMatch[1]) : 1;
    const variant = stem.replace(/\s*-\s*\d+\s*$/, '');
    const primary = norm(variant);
    const keys = new Set([primary]);
    if (primary.includes('_')) primary.split('_').forEach((part) => keys.add(norm(part)));
    if (primary.includes(' - ')) keys.add(norm(primary.split(' - ')[0]));
    // Only keep files that match at least one product.
    const matchKeys = [...keys].filter((k) => productByKey.has(k));
    if (!matchKeys.length) continue;
    const dedupeKey = `${primary}#${counter}`;
    if (!picked.has(dedupeKey)) {
      picked.set(dedupeKey, { keys: new Set(matchKeys), counter, srcDir: full, file, ext });
    }
  }
}

// Assign images to products.
fs.mkdirSync(OUT_DIR, { recursive: true });
const imagesByProductKey = new Map(); // key -> [{counter, outName}]
let copied = 0;
for (const { keys, counter, srcDir, file, ext } of picked.values()) {
  const variantSafe = safe(file.replace(/\.[^.]+$/, '').replace(/\s*-\s*\d+\s*$/, ''));
  const outName = `${variantSafe}-${counter}.${ext}`;
  fs.copyFileSync(path.join(srcDir, file), path.join(OUT_DIR, outName));
  copied++;
  for (const k of keys) {
    if (!imagesByProductKey.has(k)) imagesByProductKey.set(k, []);
    imagesByProductKey.get(k).push({ counter, outName });
  }
}

let withImages = 0;
for (const [k, group] of productByKey) {
  const imgs = imagesByProductKey.get(k);
  if (!imgs || !imgs.length) continue;
  const sorted = [...new Set(imgs.sort((a, b) => a.counter - b.counter).map((i) => `/images/amber/${i.outName}`))];
  for (const p of group) {
    p.imageKey = sorted[0];
    if (sorted.length > 1) p.images = sorted;
    withImages++;
  }
}
console.log(`Copied ${copied} images; ${withImages} products now have photos.`);

// Emit a TS seed module
const header = `// AUTO-GENERATED from public/amber/*.xlsx + photo folders — Amber Glass vendor catalog seed.
// Regenerate with: node scripts/gen-amber-seed.mjs
import type { Product } from './products';

export const AMBER_PRODUCTS: Product[] = `;

const body = JSON.stringify(products, null, 2)
  // drop undefined-valued keys produced by JSON (they're already omitted) — nothing to do
  ;

fs.writeFileSync('src/lib/amberSeed.ts', header + body + ';\n');
console.log(`Wrote ${products.length} Amber products to src/lib/amberSeed.ts`);
console.log('Sample:', JSON.stringify(products.slice(0, 3), null, 2));
