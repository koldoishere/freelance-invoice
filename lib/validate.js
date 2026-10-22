/**
 * Validate an invoice object. Returns an array of human-readable error
 * strings; an empty array means the invoice is valid.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function checkDate(errors, value, field) {
  if (!isNonEmptyString(value)) {
    errors.push(`"${field}" is required (format YYYY-MM-DD)`);
    return;
  }
  if (!DATE_RE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    errors.push(`"${field}" must be a valid date in YYYY-MM-DD format (got "${value}")`);
  }
}

function checkParty(errors, party, field, { emailRequired }) {
  if (party === null || typeof party !== 'object' || Array.isArray(party)) {
    errors.push(`"${field}" is required and must be an object`);
    return;
  }
  if (!isNonEmptyString(party.name)) errors.push(`"${field}.name" is required`);
  if (emailRequired && !isNonEmptyString(party.email)) {
    errors.push(`"${field}.email" is required`);
  }
  if (party.email !== undefined && party.email !== null && party.email !== '') {
    if (typeof party.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.email)) {
      errors.push(`"${field}.email" does not look like an email address`);
    }
  }
  if (party.address !== undefined && typeof party.address !== 'string' && !Array.isArray(party.address)) {
    errors.push(`"${field}.address" must be a string or an array of lines`);
  }
}

export function validateInvoice(inv) {
  const errors = [];
  if (inv === null || typeof inv !== 'object' || Array.isArray(inv)) {
    return ['Invoice must be a JSON object'];
  }

  if (!isNonEmptyString(String(inv.invoiceNumber ?? ''))) {
    errors.push('"invoiceNumber" is required');
  }
  checkDate(errors, inv.issueDate, 'issueDate');
  checkDate(errors, inv.dueDate, 'dueDate');
  if (DATE_RE.test(inv.issueDate ?? '') && DATE_RE.test(inv.dueDate ?? '') && inv.dueDate < inv.issueDate) {
    errors.push('"dueDate" must not be before "issueDate"');
  }

  checkParty(errors, inv.from, 'from', { emailRequired: true });
  checkParty(errors, inv.to, 'to', { emailRequired: false });

  if (!isNonEmptyString(inv.currency)) {
    errors.push('"currency" is required (ISO 4217 code, e.g. USD, EUR, EGP)');
  } else if (!CURRENCY_RE.test(inv.currency)) {
    errors.push(`"currency" must be a 3-letter uppercase ISO 4217 code (got "${inv.currency}")`);
  }

  if (!Array.isArray(inv.items) || inv.items.length === 0) {
    errors.push('"items" is required and must be a non-empty array');
  } else {
    inv.items.forEach((item, i) => {
      const p = `items[${i}]`;
      if (item === null || typeof item !== 'object') {
        errors.push(`"${p}" must be an object`);
        return;
      }
      if (!isNonEmptyString(item.description)) errors.push(`"${p}.description" is required`);
      if (!isFiniteNumber(item.quantity) || item.quantity <= 0) {
        errors.push(`"${p}.quantity" must be a positive number`);
      }
      if (!isFiniteNumber(item.unitPrice) || item.unitPrice < 0) {
        errors.push(`"${p}.unitPrice" must be a number >= 0`);
      }
    });
  }

  if (inv.taxPercent !== undefined && inv.taxPercent !== null) {
    if (!isFiniteNumber(inv.taxPercent) || inv.taxPercent < 0 || inv.taxPercent > 100) {
      errors.push('"taxPercent" must be a number between 0 and 100');
    }
  }
  if (inv.notes !== undefined && inv.notes !== null && typeof inv.notes !== 'string') {
    errors.push('"notes" must be a string');
  }

  return errors;
}
