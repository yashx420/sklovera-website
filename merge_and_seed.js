import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

const HEADER_MAP = {
  'krosno reference': 'sku',
  'sku': 'sku',
  'reference': 'sku',
  'base index': 'baseIndex',
  'ean code': 'ean',
  'ean': 'ean',
  'description': 'name',
  'product name': 'name',
  'name': 'name',
  'collection': 'collection',
  'category': 'category',
  'production type': 'productionType',
  'logo': 'logoCapable',
  'height (h)/ diameter (fi)': 'heightOrDiameter',
  'height/diameter': 'heightOrDiameter',
  'usable capacity (ml)': 'usableMl',
  'usable caapcity (ml)': 'usableMl',
  'usable capacity (oz)': 'usableOz',
  'usable caapcity (oz)': 'usableOz',
  'total capacity (ml)': 'totalMl',
  'total caapcity (ml)': 'totalMl',
  'total capacity (oz)': 'totalOz',
  'total caapcity (oz)': 'totalOz',
  'pcs per box': 'pcsPerBox',
  'pcs per box in master carton/foil pack': 'pcsPerCarton',
  'master carton/foil pack': 'cartonType',
  'pcs per pallet': 'pcsPerPallet',
  'unit price (eur)': 'priceEur',
  'unit price (usd)': 'priceUsd',
};

const normKey = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

const num = (v) => {
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const s = String(v).replace(/[^\d.\-]/g, '');
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const str = (v) => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
};

const findHeaderRow = (rows) => {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i] ?? [];
    const hits = row.filter((c) => {
      const k = typeof c === 'string' ? normKey(c) : '';
      return k in HEADER_MAP;
    }).length;
    if (hits >= 4) return i;
  }
  return 0;
};

const resolvePath = (base, rel) => {
  const parts = base.split('/').slice(0, -1);
  for (const seg of rel.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg === '.' || seg === '') continue;
    else parts.push(seg);
  }
  return parts.join('/');
};

// Regex based image extractor for Node (to avoid DOMParser browser dependency)
const extractImagesNode = async (data) => {
  const zip = await JSZip.loadAsync(data);
  const out = [];

  const drawingNames = Object.keys(zip.files).filter(
    (n) => /^xl\/drawings\/drawing\d+\.xml$/i.test(n),
  );

  for (const drawingName of drawingNames) {
    const relsName = drawingName.replace(/drawings\/(drawing\d+\.xml)$/i, 'drawings/_rels/$1.rels');
    const drawingFile = zip.file(drawingName);
    const relsFile = zip.file(relsName);
    if (!drawingFile || !relsFile) continue;

    const relsXml = await relsFile.async('string');
    
    // Parse relationships via regex
    const rIdToTarget = new Map();
    const relsRegex = /<Relationship\s+[^>]*Id="([^"]+)"\s+[^>]*Target="([^"]+)"/g;
    let match;
    while ((match = relsRegex.exec(relsXml)) !== null) {
      rIdToTarget.set(match[1], match[2]);
    }

    const drawXml = await drawingFile.async('string');
    
    // Extract anchors. We search for twoCellAnchor and oneCellAnchor blocks
    const anchorRegex = /<xdr:(twoCellAnchor|oneCellAnchor)>([\s\S]*?)<\/xdr:\1>/g;
    let anchorMatch;
    while ((anchorMatch = anchorRegex.exec(drawXml)) !== null) {
      const anchorContent = anchorMatch[2];
      
      // Extract from row and col
      const fromMatch = /<xdr:from>([\s\S]*?)<\/xdr:from>/.exec(anchorContent);
      if (!fromMatch) continue;
      
      const colMatch = /<xdr:col>(\d+)<\/xdr:col>/.exec(fromMatch[1]);
      const rowMatch = /<xdr:row>(\d+)<\/xdr:row>/.exec(fromMatch[1]);
      if (!colMatch || !rowMatch) continue;
      
      const col = parseInt(colMatch[1], 10);
      const row = parseInt(rowMatch[1], 10);
      
      // Extract embed ID
      const blipMatch = /<a:blip\s+[^>]*r:embed="([^"]+)"/.exec(anchorContent) || 
                        /<a:blip\s+[^>]*embed="([^"]+)"/.exec(anchorContent);
      if (!blipMatch) continue;
      
      const embedId = blipMatch[1];
      const target = rIdToTarget.get(embedId);
      if (!target) continue;
      
      const resolved = resolvePath(drawingName, target);
      const mediaFile = zip.file(resolved);
      if (!mediaFile) continue;
      
      const bytes = await mediaFile.async('uint8array');
      const ext = (resolved.split('.').pop() || 'bin').toLowerCase();
      out.push({ row, col, bytes, ext });
    }
  }

  return out;
};

const main = async () => {
  const rootDir = 'c:/Users/Yash/Documents/sklovera-website-main';
  const sheetsDir = path.join(rootDir, 'sheets');
  const outputDir = path.join(rootDir, 'public/images/products');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const standardOfferFile = path.join(rootDir, 'Krosno Glass Standard offer 16.03.xlsx');
  const pricelist1File = path.join(sheetsDir, 'Copy of Price list Krosno XNO_ HoReCa 16.03.xlsx');
  const pricelist2File = path.join(sheetsDir, 'Krosno Glass Pricelist 2026 av. 2.06.26.xlsx');

  const findProductPhotoCol = (headerRow) => {
    for (let i = 0; i < headerRow.length; i++) {
      if (typeof headerRow[i] === 'string' && /product photo/i.test(headerRow[i])) {
        return i;
      }
    }
    return 7; // Default fallback index
  };

  console.log(`Step 1: Parsing Standard Offer and extracting images...`);
  const standardOfferData = fs.readFileSync(standardOfferFile);
  const standardWb = XLSX.read(standardOfferData, { type: 'buffer' });
  
  // Find photo column dynamically in Standard Offer
  const firstSheetName = standardWb.SheetNames[0];
  const firstWs = standardWb.Sheets[firstSheetName];
  const firstRows = XLSX.utils.sheet_to_json(firstWs, { header: 1, raw: true, defval: null });
  const firstHeaderIdx = findHeaderRow(firstRows);
  const firstHeaderRow = firstRows[firstHeaderIdx] ?? [];
  const standardPhotoCol = findProductPhotoCol(firstHeaderRow);
  console.log(`Standard Offer: Detected photo column at index ${standardPhotoCol}`);

  // Extract images
  console.log(`Extracting images from standard offer...`);
  const imgs = await extractImagesNode(standardOfferData);
  
  const imgsByRow = new Map();
  for (const img of imgs) {
    if (!img.bytes.length) continue;
    const existing = imgsByRow.get(img.row);
    if (!existing) {
      imgsByRow.set(img.row, img);
      continue;
    }
    if (existing.col !== standardPhotoCol && img.col === standardPhotoCol) {
      imgsByRow.set(img.row, img);
    }
  }
  console.log(`Extracted ${imgs.length} image anchors, mapping to ${imgsByRow.size} rows.`);

  const productsMap = new Map(); // SKU -> Product
  
  for (const sheetName of standardWb.SheetNames) {
    const ws = standardWb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    if (!rows.length) continue;

    const headerIdx = findHeaderRow(rows);
    const headerRow = rows[headerIdx] ?? [];
    
    const colMap = {};
    headerRow.forEach((cell, idx) => {
      if (typeof cell !== 'string') return;
      const key = normKey(cell);
      const field = HEADER_MAP[key];
      if (field) colMap[idx] = field;
    });

    console.log(`Sheet "${sheetName}": Processing ${rows.length - headerIdx - 1} rows`);

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.every((c) => c === null || c === undefined || c === '')) continue;

      const rec = {};
      for (const [idxStr, field] of Object.entries(colMap)) {
        const idx = Number(idxStr);
        const val = row[idx];
        if (field === 'logoCapable') {
          rec[field] = typeof val === 'string' ? /^(y|yes|true|1)$/i.test(val.trim()) : !!val;
        } else if (
          field === 'usableMl' || field === 'usableOz' ||
          field === 'totalMl' || field === 'totalOz' ||
          field === 'pcsPerBox' || field === 'pcsPerCarton' ||
          field === 'pcsPerPallet' || field === 'priceEur' || field === 'priceUsd'
        ) {
          rec[field] = num(val);
        } else {
          rec[field] = str(val);
        }
      }

      if (!rec.sku || !rec.name) continue;

      // Extract image for this row if present
      let imageKey = undefined;
      const img = imgsByRow.get(r);
      if (img) {
        const ext = img.ext;
        const imgFileName = `${rec.sku}.${ext}`;
        const imgFilePath = path.join(outputDir, imgFileName);
        fs.writeFileSync(imgFilePath, img.bytes);
        imageKey = `/images/products/${imgFileName}`;
      }

      const id = `sup-krosno:${rec.sku}`;
      const product = {
        id,
        sku: rec.sku,
        name: rec.name,
        supplier: 'Krosno Glass',
        supplierId: 'sup-krosno',
        status: 'approved',
        createdAt: Date.now(),
        imageKey,
        ...rec
      };
      productsMap.set(rec.sku, product);
    }
  }

  console.log(`Standard Offer loaded. Total products: ${productsMap.size}`);

  // Helper to merge pricelist products
  const mergePricelist = async (filePath, label) => {
    console.log(`Step: Updating info from ${label}...`);
    const data = fs.readFileSync(filePath);
    const wb = XLSX.read(data, { type: 'buffer' });
    
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
    if (!rows.length) return;

    const headerIdx = findHeaderRow(rows);
    const headerRow = rows[headerIdx] ?? [];
    const photoCol = findProductPhotoCol(headerRow);
    
    // Extract images from this pricelist
    console.log(`Extracting images from ${label} (using photo column index ${photoCol})...`);
    const imgs = await extractImagesNode(data);
    const imgsByRow = new Map();
    for (const img of imgs) {
      if (!img.bytes.length) continue;
      const existing = imgsByRow.get(img.row);
      if (!existing) {
        imgsByRow.set(img.row, img);
        continue;
      }
      if (existing.col !== photoCol && img.col === photoCol) {
        imgsByRow.set(img.row, img);
      }
    }
    console.log(`Extracted ${imgs.length} image anchors, mapping to ${imgsByRow.size} rows.`);

    let updatedCount = 0;
    let addedCount = 0;
    let addedImageCount = 0;

    const colMap = {};
    headerRow.forEach((cell, idx) => {
      if (typeof cell !== 'string') return;
      const key = normKey(cell);
      const field = HEADER_MAP[key];
      if (field) colMap[idx] = field;
    });

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.every((c) => c === null || c === undefined || c === '')) continue;

      const rec = {};
      for (const [idxStr, field] of Object.entries(colMap)) {
        const idx = Number(idxStr);
        const val = row[idx];
        if (field === 'logoCapable') {
          rec[field] = typeof val === 'string' ? /^(y|yes|true|1)$/i.test(val.trim()) : !!val;
        } else if (
          field === 'usableMl' || field === 'usableOz' ||
          field === 'totalMl' || field === 'totalOz' ||
          field === 'pcsPerBox' || field === 'pcsPerCarton' ||
          field === 'pcsPerPallet' || field === 'priceEur' || field === 'priceUsd'
        ) {
          rec[field] = num(val);
        } else {
          rec[field] = str(val);
        }
      }

      if (!rec.sku) continue;

      // Extract image for this row if present
      let imageKey = undefined;
      const img = imgsByRow.get(r);
      if (img) {
        const ext = img.ext;
        const imgFileName = `${rec.sku}.${ext}`;
        const imgFilePath = path.join(outputDir, imgFileName);
        fs.writeFileSync(imgFilePath, img.bytes);
        imageKey = `/images/products/${imgFileName}`;
      }

      if (productsMap.has(rec.sku)) {
        const existing = productsMap.get(rec.sku);
        // Merge fields that are defined in rec
        for (const [key, val] of Object.entries(rec)) {
          if (val !== undefined) {
            existing[key] = val;
          }
        }
        // "use all images from original sheet if not available, then use from the 2 new sheets"
        if (imageKey && !existing.imageKey) {
          existing.imageKey = imageKey;
          addedImageCount++;
        }
        updatedCount++;
      } else {
        // If product is not in standard offer, add it as a new product!
        const id = `sup-krosno:${rec.sku}`;
        const product = {
          id,
          sku: rec.sku,
          name: rec.name || 'Unknown Glassware Product',
          supplier: 'Krosno Glass',
          supplierId: 'sup-krosno',
          status: 'approved',
          createdAt: Date.now(),
          imageKey,
          ...rec
        };
        productsMap.set(rec.sku, product);
        addedCount++;
        if (imageKey) addedImageCount++;
      }
    }
    console.log(`Updated ${updatedCount} products, added ${addedCount} new products from ${label}. Found ${addedImageCount} new images.`);
  };

  await mergePricelist(pricelist1File, 'Pricelist HoReCa');
  await mergePricelist(pricelist2File, 'Pricelist 2026');

  const finalProducts = Array.from(productsMap.values());
  const seededProductsPath = path.join(rootDir, 'src/lib/seededProducts.json');
  fs.writeFileSync(seededProductsPath, JSON.stringify(finalProducts, null, 2));
  console.log(`Successfully wrote ${finalProducts.length} products to ${seededProductsPath}`);
};

main().catch(err => {
  console.error(`Error in main:`, err);
});
