// Regenerate the Solbika catalog seed from public/solbika/*.xlsx.
// Extracts the per-row "Photo" column image (col index 8) for each product.
// Run from the repo root:  node scripts/gen-solbika-seed.mjs
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

const dir = 'public/solbika';
const OUT_DIR = 'public/images/solbika';
const PHOTO_COL = 8;

const safe = (s) => String(s).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
const clean = (v) => (v == null ? undefined : String(v).replace(/\s+/g, ' ').trim() || undefined);
const num = (v) => {
  if (v == null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.\-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};
const invNum = (v) => {
  if (v == null) return undefined;
  const d = String(v).replace(/[^\d]/g, '');
  return d ? Number(d) : undefined;
};
const titleCase = (s) =>
  String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const categoryLabel = (s) => {
  const t = clean(s)?.toLowerCase();
  if (t === 'horeca') return 'HoReCa';
  return t ? titleCase(t) : 'Glassware';
};

// ---- XML helpers (regex-based, mirrors the Amber generator) ----
const parseRels = async (zip, relsPath) => {
  const m = new Map();
  const f = zip.file(relsPath);
  if (!f) return m;
  const xml = await f.async('string');
  for (const r of xml.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = (r[0].match(/Id="([^"]+)"/) || [])[1];
    const target = (r[0].match(/Target="([^"]+)"/) || [])[1];
    const type = (r[0].match(/Type="([^"]+)"/) || [])[1];
    if (id && target) m.set(id, { target, type });
  }
  return m;
};

// Map each sheet NAME to its drawing xml path (so per-sheet row numbers don't collide).
const sheetDrawingMap = async (zip) => {
  const out = new Map();
  const wbXml = await zip.file('xl/workbook.xml').async('string');
  const wbRels = await parseRels(zip, 'xl/_rels/workbook.xml.rels');
  for (const s of wbXml.matchAll(/<sheet\b[^>]*\/?>/g)) {
    const name = (s[0].match(/name="([^"]+)"/) || [])[1];
    const rid = (s[0].match(/r:id="([^"]+)"/) || [])[1];
    const rel = rid && wbRels.get(rid);
    if (!name || !rel) continue;
    const sheetPath = 'xl/' + rel.target.replace(/^\.\.\//, '').replace(/^\//, '');
    const sheetRelsPath = sheetPath.replace(/(worksheets\/)([^/]+)$/, '$1_rels/$2.rels');
    const sheetRels = await parseRels(zip, sheetRelsPath);
    let drawingPath;
    for (const { target, type } of sheetRels.values()) {
      if (/drawing$/.test(type || '')) drawingPath = 'xl/' + target.replace(/^\.\.\//, '');
    }
    if (drawingPath) out.set(name, drawingPath);
  }
  return out;
};

const parseDrawing = async (zip, drawingPath, preferredCol) => {
  const byRow = new Map();
  const drawFile = zip.file(drawingPath);
  if (!drawFile) return byRow;
  const relsPath = drawingPath.replace(/drawings\/(drawing\d+\.xml)$/i, 'drawings/_rels/$1.rels');
  const rels = await parseRels(zip, relsPath);
  const xml = await drawFile.async('string');
  const anchors = xml.split(/<(?:\w+:)?(?:two|one)CellAnchor/).slice(1);
  for (const a of anchors) {
    const from = (a.match(/<(?:\w+:)?from>([\s\S]*?)<\/(?:\w+:)?from>/) || [])[1];
    if (!from) continue;
    const col = Number((from.match(/<(?:\w+:)?col>(\d+)/) || [])[1]);
    const row = Number((from.match(/<(?:\w+:)?row>(\d+)/) || [])[1]);
    if (Number.isNaN(col) || Number.isNaN(row)) continue;
    const embed = (a.match(/<(?:\w+:)?blip[^>]*embed="([^"]+)"/) || [])[1];
    const rel = embed && rels.get(embed);
    if (!rel) continue;
    const resolved = 'xl/' + rel.target.replace(/^\.\.\//, '');
    const media = zip.file(resolved);
    if (!media) continue;
    const bytes = await media.async('nodebuffer');
    if (!bytes.length) continue;
    const ext = (resolved.split('.').pop() || 'png').toLowerCase();
    const existing = byRow.get(row);
    if (!existing || (existing.col !== preferredCol && col === preferredCol)) {
      byRow.set(row, { bytes, ext, col });
    }
  }
  return byRow;
};

// ---- Build products ----
const products = [];
const seen = new Set();
fs.mkdirSync(OUT_DIR, { recursive: true });
let imgCount = 0;

// High-res product photos provided in public/solbika/imagesSolbika, named by
// reference (e.g. "35532.jpg", "38059 WERSJA 2.png"). Prefer these over the
// small xlsx Photo-column thumbnails; multiple variants become a carousel.
const folderDir = path.join(dir, 'imagesSolbika');
const folderGroups = new Map(); // sku-key -> [filename...]
if (fs.existsSync(folderDir)) {
  for (const fn of fs.readdirSync(folderDir)) {
    if (!/\.(jpe?g|png)$/i.test(fn)) continue;
    const stem = fn.replace(/\.[^.]+$/, '').replace(/\s+(?:wersja|v)\s*\d+.*$/i, '').trim();
    const k = stem.toLowerCase();
    if (!folderGroups.has(k)) folderGroups.set(k, []);
    folderGroups.get(k).push(fn);
  }
  for (const arr of folderGroups.values()) arr.sort();
}

const files = fs.readdirSync(dir).filter((f) => /\.xlsx$/i.test(f));
for (const file of files) {
  const buf = fs.readFileSync(path.join(dir, file));
  const wb = XLSX.read(buf, { type: 'buffer' });
  const zip = await JSZip.loadAsync(buf);
  const drawings = await sheetDrawingMap(zip);

  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true, defval: null });
    // Header row: the one containing "Solbika Reference".
    const headerIdx = rows.findIndex((r) => Array.isArray(r) && r.some((c) => /solbika reference/i.test(String(c ?? ''))));
    if (headerIdx < 0) continue;
    const imgByRow = drawings.has(sheetName) ? await parseDrawing(zip, drawings.get(sheetName), PHOTO_COL) : new Map();

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const sku = clean(row[0]);
      if (!sku) continue;
      const id = `sup-solbika:${sku}`;
      if (seen.has(id)) continue; // dedupe across files/sheets (Always Available wins)
      seen.add(id);

      let imageKey;
      let images;
      const folder = folderGroups.get(String(sku).toLowerCase());
      if (folder && folder.length) {
        // High-res folder photo(s) take precedence over the xlsx thumbnail.
        const outs = folder.map((fn, i) => {
          const ext = fn.split('.').pop().toLowerCase();
          const out = `${safe(sku)}${i ? `-${i + 1}` : ''}.${ext}`;
          fs.copyFileSync(path.join(folderDir, fn), path.join(OUT_DIR, out));
          return `/images/solbika/${out}`;
        });
        imageKey = outs[0];
        if (outs.length > 1) images = outs;
        imgCount++;
      } else {
        const img = imgByRow.get(r);
        if (img) {
          const outName = `${safe(sku)}.${img.ext}`;
          fs.writeFileSync(path.join(OUT_DIR, outName), img.bytes);
          imageKey = `/images/solbika/${outName}`;
          imgCount++;
        }
      }

      products.push({
        id,
        sku,
        baseIndex: clean(row[1]),
        ean: clean(row[2]),
        name: row[3] ? titleCase(row[3]) : sku,
        collection: row[4] ? titleCase(row[4]) : undefined,
        category: categoryLabel(row[5]),
        productionType: clean(row[6]),
        heightOrDiameter: clean(row[12]),
        usableMl: num(row[13]),
        usableOz: num(row[14]),
        totalMl: num(row[15]),
        totalOz: num(row[16]),
        pcsPerBox: num(row[17]),
        pcsPerCarton: num(row[18]),
        cartonType: clean(row[19]) && clean(row[19]) !== 'n/a' ? clean(row[19]) : undefined,
        pcsPerPallet: num(row[20]),
        priceEur: num(row[21]),
        priceUsd: num(row[22]),
        stockIntl: invNum(row[23]),
        supplier: 'Solbika',
        supplierId: 'sup-solbika',
        status: 'approved',
        imageKey,
        images,
        createdAt: 0,
      });
    }
  }
}

// Drop undefined keys for a tidy seed file.
const cleaned = products.map((p) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)));

const header = `// AUTO-GENERATED from public/solbika/*.xlsx — Solbika vendor catalog seed.
// Regenerate with: node scripts/gen-solbika-seed.mjs
import type { Product } from './products';

export const SOLBIKA_PRODUCTS: Product[] = `;
fs.writeFileSync('src/lib/solbikaSeed.ts', header + JSON.stringify(cleaned, null, 2) + ';\n');

const cats = {};
for (const p of cleaned) cats[p.category] = (cats[p.category] || 0) + 1;
console.log(`Wrote ${cleaned.length} Solbika products; ${imgCount} with photos.`);
console.log('categories:', cats);
console.log('with image:', cleaned.filter((p) => p.imageKey).length);
