import { computeTotals, formatMoney } from './totals.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

function addressLines(address) {
  if (!address) return [];
  const lines = Array.isArray(address) ? address : String(address).split(/\r?\n/);
  return lines.map((l) => String(l).trim()).filter(Boolean);
}

function formatDate(iso, locale) {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

function formatQty(q) {
  return Number.isInteger(q) ? String(q) : String(Number(q.toFixed(2)));
}

function partyBlock(label, party) {
  const lines = [
    `<div class="party-name">${escapeHtml(party.name)}</div>`,
    ...addressLines(party.address).map((l) => `<div>${escapeHtml(l)}</div>`),
  ];
  if (party.email) {
    lines.push(`<div><a href="mailto:${escapeHtml(party.email)}">${escapeHtml(party.email)}</a></div>`);
  }
  return `
      <section class="party">
        <h2>${label}</h2>
        ${lines.join('\n        ')}
      </section>`;
}

const STYLES = `
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    background: #f3f3f1;
    color: #1d1d1b;
    font: 14px/1.5 "Helvetica Neue", Helvetica, Arial, "Segoe UI", sans-serif;
  }
  .sheet {
    width: 210mm;
    min-height: 297mm;
    margin: 24px auto;
    padding: 18mm 16mm;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.08);
    display: flex;
    flex-direction: column;
  }
  header.top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 10mm;
    border-bottom: 2px solid #1d1d1b;
  }
  .title { font-size: 30px; letter-spacing: .14em; font-weight: 700; margin: 0; }
  .issuer { font-size: 15px; font-weight: 600; margin-top: 4px; }
  dl.meta { margin: 0; display: grid; grid-template-columns: auto auto; gap: 2px 18px; text-align: right; }
  dl.meta dt { color: #6b6b66; }
  dl.meta dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; margin: 9mm 0; }
  .party h2, .notes h2 {
    font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
    color: #6b6b66; margin: 0 0 6px;
  }
  .party-name { font-weight: 600; }
  a { color: inherit; text-decoration: none; }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
    color: #6b6b66; text-align: left; padding: 8px 6px; border-bottom: 1px solid #1d1d1b;
  }
  tbody td { padding: 10px 6px; border-bottom: 1px solid #e4e4e0; vertical-align: top; }
  tbody tr { break-inside: avoid; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .totals { margin-left: auto; width: 46%; margin-top: 6mm; }
  .totals td { padding: 5px 6px; border: 0; }
  .totals td:first-child { color: #6b6b66; }
  .totals tr.grand td {
    border-top: 2px solid #1d1d1b; padding-top: 9px; font-size: 17px; font-weight: 700; color: #1d1d1b;
  }
  .notes { margin-top: 10mm; padding-top: 5mm; border-top: 1px solid #e4e4e0; }
  .notes p { margin: 0; white-space: pre-line; }
  footer { margin-top: auto; padding-top: 10mm; font-size: 11px; color: #8a8a84; text-align: center; }
  @media print {
    body { background: #fff; }
    .sheet { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
  }
  @media screen and (max-width: 820px) {
    .sheet { width: auto; min-height: auto; margin: 0; padding: 24px; }
    .parties { grid-template-columns: 1fr; gap: 16px; }
    .totals { width: 100%; }
  }
`;

/**
 * Render a validated invoice object to a self-contained HTML document.
 * @param {object} invoice
 * @param {{ locale?: string }} [options]
 * @returns {string}
 */
export function renderInvoice(invoice, options = {}) {
  const locale = options.locale ?? invoice.locale ?? 'en-US';
  const cur = invoice.currency;
  const money = (n) => escapeHtml(formatMoney(n, cur, locale));
  const t = computeTotals(invoice);

  const rows = t.lines
    .map(
      (l) => `
          <tr>
            <td>${escapeHtml(l.description)}</td>
            <td class="num">${escapeHtml(formatQty(l.quantity))}</td>
            <td class="num">${money(l.unitPrice)}</td>
            <td class="num">${money(l.amount)}</td>
          </tr>`,
    )
    .join('');

  const taxRow = t.taxPercent
    ? `
          <tr><td>Tax (${escapeHtml(String(t.taxPercent))}%)</td><td class="num">${money(t.tax)}</td></tr>`
    : '';

  const notes = invoice.notes
    ? `
      <section class="notes">
        <h2>Notes</h2>
        <p>${escapeHtml(invoice.notes.trim())}</p>
      </section>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice ${escapeHtml(invoice.invoiceNumber)} · ${escapeHtml(invoice.from.name)}</title>
  <style>${STYLES}</style>
</head>
<body>
  <main class="sheet">
    <header class="top">
      <div>
        <h1 class="title">INVOICE</h1>
        <div class="issuer">${escapeHtml(invoice.from.name)}</div>
      </div>
      <dl class="meta">
        <dt>Invoice no.</dt><dd>${escapeHtml(invoice.invoiceNumber)}</dd>
        <dt>Issued</dt><dd>${escapeHtml(formatDate(invoice.issueDate, locale))}</dd>
        <dt>Due</dt><dd>${escapeHtml(formatDate(invoice.dueDate, locale))}</dd>
        <dt>Amount due</dt><dd>${money(t.total)}</dd>
      </dl>
    </header>

    <div class="parties">${partyBlock('From', invoice.from)}${partyBlock('Bill to', invoice.to)}
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="num">Qty</th>
          <th class="num">Unit price</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}
      </tbody>
    </table>

    <table class="totals">
      <tbody>
          <tr><td>Subtotal</td><td class="num">${money(t.subtotal)}</td></tr>${taxRow}
          <tr class="grand"><td>Total (${escapeHtml(cur)})</td><td class="num">${money(t.total)}</td></tr>
      </tbody>
    </table>
${notes}
    <footer>Invoice ${escapeHtml(invoice.invoiceNumber)} · ${escapeHtml(invoice.from.name)}</footer>
  </main>
</body>
</html>
`;
}
