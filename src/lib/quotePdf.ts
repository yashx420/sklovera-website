import { jsPDF } from 'jspdf';
import type { Rfq } from './rfq';
import type { QuoteBreakdown } from './pricing';

const eur = (n: number) => `EUR ${n.toFixed(2)}`;
const inr = (n: number) => `INR ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export const generateQuotePdf = (rfq: Rfq, q: QuoteBreakdown): void => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  // Header bar
  doc.setFillColor(48, 48, 48); // charcoal
  doc.rect(0, 0, pageW, 96, 'F');
  doc.setTextColor(250, 249, 247);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('SKLOVERA', margin, 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Integrated Glassware Sourcing', margin, 68);
  doc.setFontSize(11);
  doc.text(`Quote for ${rfq.id}`, pageW - margin, 48, { align: 'right' });
  doc.setFontSize(9);
  doc.text(new Date(q.computedAt).toLocaleDateString(), pageW - margin, 64, { align: 'right' });

  y = 128;
  doc.setTextColor(48, 48, 48);

  // Buyer + shipment block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BILL TO', margin, y);
  doc.text('SHIP TO', pageW / 2, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(rfq.buyerName, margin, y + 16);
  doc.text(rfq.buyerEmail, margin, y + 30);
  doc.text(`${rfq.shipCity ? rfq.shipCity + ', ' : ''}${rfq.shipCountry}`, pageW / 2, y + 16);
  if (rfq.targetDate) doc.text(`Target: ${rfq.targetDate}`, pageW / 2, y + 30);
  y += 56;

  // Tier chip
  doc.setFillColor(224, 232, 229);
  doc.roundedRect(margin, y, 110, 22, 4, 4, 'F');
  doc.setTextColor(48, 48, 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`TIER · ${q.tier.toUpperCase()}`, margin + 10, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const splitSummary =
    q.totalUnitsIndia > 0
      ? `Total units: ${q.totalUnits} · ex India ${q.totalUnitsIndia} · import ${q.totalUnitsIntl}`
      : `Total units: ${q.totalUnits}`;
  doc.text(splitSummary, pageW - margin, y + 15, { align: 'right' });
  y += 40;

  // Line items table
  const cols = [
    { label: 'SKU', x: margin, w: 90, align: 'left' as const },
    { label: 'Description', x: margin + 90, w: 190, align: 'left' as const },
    { label: 'Qty', x: margin + 290, w: 40, align: 'right' as const },
    { label: 'Unit EUR', x: margin + 330, w: 70, align: 'right' as const },
    { label: 'Unit INR', x: margin + 400, w: 70, align: 'right' as const },
    { label: 'Line INR', x: margin + 470, w: 80, align: 'right' as const },
  ];

  doc.setFillColor(240, 238, 234);
  doc.rect(margin, y, pageW - margin * 2, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  cols.forEach((c) => {
    const x = c.align === 'right' ? c.x + c.w : c.x;
    doc.text(c.label.toUpperCase(), x, y + 15, { align: c.align });
  });
  y += 28;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const l of q.lines) {
    if (y > pageH - 200) {
      doc.addPage();
      y = margin;
    }
    const name = l.name.length > 44 ? l.name.slice(0, 43) + '…' : l.name;
    doc.text(l.sku, cols[0].x, y);
    doc.text(name, cols[1].x, y);
    doc.text(String(l.quantity), cols[2].x + cols[2].w, y, { align: 'right' });
    doc.text(l.unitFinalEur.toFixed(2), cols[3].x + cols[3].w, y, { align: 'right' });
    doc.text(l.unitFinalInr.toFixed(2), cols[4].x + cols[4].w, y, { align: 'right' });
    doc.text(l.lineFinalInr.toFixed(2), cols[5].x + cols[5].w, y, { align: 'right' });
    y += 14;
    if (l.fromIndia > 0 || l.fromIntl > 0 || l.shortfall > 0) {
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(7);
      const parts: string[] = [];
      if (l.fromIndia > 0) parts.push(`${l.fromIndia} ex India`);
      if (l.fromIntl > 0) parts.push(`${l.fromIntl} import`);
      if (l.shortfall > 0) parts.push(`${l.shortfall} backorder`);
      doc.text(parts.join(' · '), cols[1].x, y);
      doc.setTextColor(48, 48, 48);
      doc.setFontSize(9);
      y += 12;
    }
  }

  y += 8;
  doc.setDrawColor(220, 218, 214);
  doc.line(margin, y, pageW - margin, y);
  y += 16;

  // Totals block
  const rightX = pageW - margin;
  const labelX = pageW - margin - 180;
  const totalsRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 9);
    doc.text(label, labelX, y);
    doc.text(value, rightX, y, { align: 'right' });
    y += bold ? 20 : 14;
  };
  totalsRow('Subtotal EXW', eur(q.subtotalExwEur));
  totalsRow('Freight', eur(q.freightEur));
  totalsRow('Duty', eur(q.dutyEur));
  totalsRow('Handling', eur(q.handlingEur));
  totalsRow('Landed subtotal', eur(q.landedSubtotalEur));
  totalsRow(`Margin (${q.tier})`, eur(q.marginEur));
  if (q.discountEur > 0) {
    totalsRow(`Volume discount (${pct(q.volumeBreak.discountPct)})`, `- ${eur(q.discountEur)}`);
  }
  y += 4;
  doc.setDrawColor(180, 178, 174);
  doc.line(labelX, y, rightX, y);
  y += 18;
  totalsRow('TOTAL (EUR)', eur(q.totalEur), true);
  totalsRow('TOTAL (INR)', inr(q.totalInr), true);

  y += 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`FX reference: 1 EUR = ${q.fxEurToInr} INR`, margin, y);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const footer = 'This quote is issued by Sklovera. Sourcing and supplier identities are confidential. Valid 30 days from issue date.';
  doc.text(footer, margin, pageH - margin, { maxWidth: pageW - margin * 2 });
  if (rfq.adminNote) {
    doc.setFont('helvetica', 'italic');
    doc.text(`Note: ${rfq.adminNote}`, margin, pageH - margin - 14, { maxWidth: pageW - margin * 2 });
  }

  doc.save(`Sklovera-Quote-${rfq.id}.pdf`);
};
