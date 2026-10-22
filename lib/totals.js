/**
 * Money math in integer minor units (cents) to avoid floating point drift.
 * Assumes 2 decimal places, which covers USD, EUR, GBP, EGP and most others.
 */

const toMinor = (n) => Math.round(n * 100);

export function computeTotals(invoice) {
  const lines = invoice.items.map((item) => {
    const amountMinor = Math.round(item.quantity * toMinor(item.unitPrice));
    return { ...item, amount: amountMinor / 100 };
  });
  const subtotalMinor = lines.reduce((sum, l) => sum + toMinor(l.amount), 0);
  const taxPercent = invoice.taxPercent ?? 0;
  const taxMinor = Math.round((subtotalMinor * taxPercent) / 100);
  return {
    lines,
    subtotal: subtotalMinor / 100,
    taxPercent,
    tax: taxMinor / 100,
    total: (subtotalMinor + taxMinor) / 100,
  };
}

export function formatMoney(amount, currency, locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
