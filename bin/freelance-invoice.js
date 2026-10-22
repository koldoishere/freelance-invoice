#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateInvoice } from '../lib/validate.js';
import { renderInvoice } from '../lib/render.js';

const pkg = JSON.parse(
  readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'),
);

const USAGE = `Usage: freelance-invoice <invoice.json> [-o <out.html>] [--locale <tag>]

Turn an invoice.json file into a clean, printable HTML invoice.

Options:
  -o, --output <file>   Output path (default: <input name>.html next to the input)
      --locale <tag>    BCP 47 locale for dates and money, e.g. en-GB, de-DE (default: en-US)
  -h, --help            Show this help
  -v, --version         Show version

Open the HTML in any browser and use Print -> Save as PDF to get a PDF.`;

function fail(message, code = 1) {
  process.stderr.write(`freelance-invoice: ${message}\n`);
  process.exit(code);
}

function parseArgs(argv) {
  const opts = { input: null, output: null, locale: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') {
      process.stdout.write(`${USAGE}\n`);
      process.exit(0);
    } else if (a === '-v' || a === '--version') {
      process.stdout.write(`${pkg.version}\n`);
      process.exit(0);
    } else if (a === '-o' || a === '--output') {
      if (!argv[i + 1]) fail(`${a} needs a file path\n\n${USAGE}`, 2);
      opts.output = argv[++i];
    } else if (a === '--locale') {
      if (!argv[i + 1]) fail(`--locale needs a value\n\n${USAGE}`, 2);
      opts.locale = argv[++i];
    } else if (a.startsWith('-')) {
      fail(`unknown option ${a}\n\n${USAGE}`, 2);
    } else if (opts.input) {
      fail(`only one input file is supported (got "${opts.input}" and "${a}")`, 2);
    } else {
      opts.input = a;
    }
  }
  if (!opts.input) fail(`missing input file\n\n${USAGE}`, 2);
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  let raw;
  try {
    raw = await readFile(opts.input, 'utf8');
  } catch (err) {
    fail(`cannot read ${opts.input}: ${err.code === 'ENOENT' ? 'file not found' : err.message}`);
  }

  let invoice;
  try {
    invoice = JSON.parse(raw);
  } catch (err) {
    fail(`${opts.input} is not valid JSON: ${err.message}`);
  }

  const errors = validateInvoice(invoice);
  if (errors.length) {
    fail(`${opts.input} has ${errors.length} problem(s):\n  - ${errors.join('\n  - ')}`);
  }

  if (opts.locale) {
    try {
      new Intl.DateTimeFormat(opts.locale);
    } catch {
      fail(`invalid locale "${opts.locale}"`, 2);
    }
  }

  const out =
    opts.output ??
    path.join(path.dirname(opts.input), `${path.basename(opts.input, path.extname(opts.input))}.html`);

  const html = renderInvoice(invoice, { locale: opts.locale });
  try {
    await mkdir(path.dirname(path.resolve(out)), { recursive: true });
    await writeFile(out, html, 'utf8');
  } catch (err) {
    fail(`cannot write ${out}: ${err.message}`);
  }
  process.stdout.write(`${path.resolve(out)}\n`);
}

main().catch((err) => fail(err.stack || String(err)));
