import JSZip from 'jszip';

export type ExtractedImage = { row: number; col: number; bytes: Uint8Array; ext: string };

/**
 * Pull product images out of an xlsx workbook.
 * xlsx = zip. Images live in xl/media/*, anchored by xl/drawings/drawingN.xml
 * which references them through xl/drawings/_rels/drawingN.xml.rels.
 * Returns one entry per anchor — callers pick the image for the column they care about.
 */
export const extractImages = async (data: ArrayBuffer): Promise<ExtractedImage[]> => {
  const zip = await JSZip.loadAsync(data);
  const parser = new DOMParser();
  const out: ExtractedImage[] = [];

  const drawingNames = Object.keys(zip.files).filter(
    (n) => /^xl\/drawings\/drawing\d+\.xml$/i.test(n),
  );

  for (const drawingName of drawingNames) {
    const relsName = drawingName.replace(/drawings\/(drawing\d+\.xml)$/i, 'drawings/_rels/$1.rels');
    const drawingFile = zip.file(drawingName);
    const relsFile = zip.file(relsName);
    if (!drawingFile || !relsFile) continue;

    const relsXml = await relsFile.async('string');
    const relsDoc = parser.parseFromString(relsXml, 'application/xml');
    const rIdToTarget = new Map<string, string>();
    Array.from(relsDoc.getElementsByTagName('Relationship')).forEach((r) => {
      const id = r.getAttribute('Id');
      const target = r.getAttribute('Target');
      if (id && target) rIdToTarget.set(id, target);
    });

    const drawXml = await drawingFile.async('string');
    const drawDoc = parser.parseFromString(drawXml, 'application/xml');

    // twoCellAnchor and oneCellAnchor both carry an <xdr:from> and a <blip>.
    const anchors = [
      ...Array.from(drawDoc.getElementsByTagNameNS('*', 'twoCellAnchor')),
      ...Array.from(drawDoc.getElementsByTagNameNS('*', 'oneCellAnchor')),
    ];

    for (const anchor of anchors) {
      const from = anchor.getElementsByTagNameNS('*', 'from')[0];
      if (!from) continue;
      const colEl = from.getElementsByTagNameNS('*', 'col')[0];
      const rowEl = from.getElementsByTagNameNS('*', 'row')[0];
      if (!colEl || !rowEl) continue;
      const col = parseInt(colEl.textContent || '', 10);
      const row = parseInt(rowEl.textContent || '', 10);
      if (Number.isNaN(col) || Number.isNaN(row)) continue;

      const blip = anchor.getElementsByTagNameNS('*', 'blip')[0];
      if (!blip) continue;
      // The embed attr is on the 'r' namespace: r:embed
      const embedId =
        blip.getAttribute('r:embed') ||
        blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed');
      if (!embedId) continue;
      const target = rIdToTarget.get(embedId);
      if (!target) continue;

      // Resolve "../media/image5.png" relative to drawing dir to "xl/media/image5.png"
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

const resolvePath = (base: string, rel: string): string => {
  const parts = base.split('/').slice(0, -1);
  for (const seg of rel.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg === '.' || seg === '') continue;
    else parts.push(seg);
  }
  return parts.join('/');
};

/**
 * Collapse many anchors into a single "best" image per sheet row,
 * preferring the anchor at `preferredCol` (the "Product photo" column
 * in Krosno's template, 0-indexed), falling back to the first image on that row.
 */
export const indexImagesByRow = (
  imgs: ExtractedImage[],
  preferredCol: number,
): Map<number, ExtractedImage> => {
  const byRow = new Map<number, ExtractedImage>();
  for (const img of imgs) {
    // Skip zero-byte placeholder anchors (some templates have hidden 0-size images).
    if (!img.bytes.length) continue;
    const existing = byRow.get(img.row);
    if (!existing) {
      byRow.set(img.row, img);
      continue;
    }
    if (existing.col !== preferredCol && img.col === preferredCol) {
      byRow.set(img.row, img);
    }
  }
  return byRow;
};
