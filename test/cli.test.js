import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateInvoice, computeTotals, renderInvoice } from '../lib/index.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'bin', 'freelance-invoice.js');
const sample = JSON.parse(readFileSync(path.join(root, 'examples', 'sample-invoice.json'), 'utf8'));

test('sample invoice is valid', () => {
  assert.deepEqual(validateInvoice(sample), []);
});

test('reports missing required fields', () => {
  const errors = validateInvoice({ items: [] });
  for (const field of ['invoiceNumber', 'issueDate', 'dueDate', 'from', 'to', 'currency', 'items']) {
    assert.ok(errors.some((e) => e.includes(`"${field}`)), `expected an error for ${field}`);
  }
});

test('rejects bad item values', () => {
  const inv = { ...sample, items: [{ description: '', quantity: 0, unitPrice: -1 }] };
  const errors = validateInvoice(inv);
  assert.equal(errors.length, 3);
});

test('computes subtotal, tax and total without float drift', () => {
  const t = computeTotals({
    items: [
      { description: 'a', quantity: 3, unitPrice: 0.1 },
      { description: 'b', quantity: 1, unitPrice: 0.2 },
    ],
    taxPercent: 14,
  });
  assert.equal(t.subtotal, 0.5);
  assert.equal(t.tax, 0.07);
  assert.equal(t.total, 0.57);
});

test('escapes HTML in user content', () => {
  const html = renderInvoice({ ...sample, notes: '<script>alert(1)</script>' });
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('CLI writes HTML and prints the path', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'fi-'));
  const out = path.join(dir, 'out.html');
  const stdout = execFileSync(process.execPath, [cli, path.join(root, 'examples', 'sample-invoice.json'), '-o', out], {
    encoding: 'utf8',
  });
  assert.equal(stdout.trim(), out);
  const html = readFileSync(out, 'utf8');
  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, /\$3,202\.50/);
});

test('CLI exits non-zero on invalid input', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'fi-'));
  const bad = path.join(dir, 'bad.json');
  writeFileSync(bad, JSON.stringify({ invoiceNumber: 'X' }));
  const r = spawnSync(process.execPath, [cli, bad], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /problem/);
});

test('CLI exits non-zero on missing file and bad JSON', () => {
  const r1 = spawnSync(process.execPath, [cli, '/nonexistent/invoice.json'], { encoding: 'utf8' });
  assert.equal(r1.status, 1);
  const dir = mkdtempSync(path.join(tmpdir(), 'fi-'));
  const bad = path.join(dir, 'bad.json');
  writeFileSync(bad, '{ not json');
  const r2 = spawnSync(process.execPath, [cli, bad], { encoding: 'utf8' });
  assert.equal(r2.status, 1);
  const r3 = spawnSync(process.execPath, [cli], { encoding: 'utf8' });
  assert.equal(r3.status, 2);
});
