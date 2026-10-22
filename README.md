# freelance-invoice

A zero-dependency Node.js CLI that turns a small `invoice.json` file into a clean, printable HTML invoice.

```bash
node bin/freelance-invoice.js invoice.json -o invoice.html
```

Open the result in any browser and choose **Print → Save as PDF** to get a PDF you can send to a client.

## Why

Most freelancers send invoices from a spreadsheet, a word processor template, or a paid SaaS tool. Those work, but they are hard to version, hard to automate, and easy to get wrong (a stale total, last month's date, a forgotten tax line).

`freelance-invoice` keeps the invoice as plain data:

- **Your invoice is a JSON file.** Keep it in git, generate it from a script, or copy last month's and change three lines.
- **The math is done for you.** Line amounts, subtotal, tax and total are computed in integer cents, so `0.1 + 0.2` problems never reach your client.
- **The output is one self-contained HTML file.** No external fonts, scripts or images. It looks the same offline, in email previews, and when printed to A4.
- **No dependencies.** Only Node.js built-ins. Nothing to audit, nothing to break on `npm install`.
- **International-friendly.** Any ISO 4217 currency (USD, EUR, GBP, EGP, …) and any locale for date and number formatting.

## Quick start

Requires Node.js 18 or newer.

```bash
git clone https://github.com/koldoishere/freelance-invoice.git
cd freelance-invoice
node bin/freelance-invoice.js examples/sample-invoice.json -o my-invoice.html
```

The command prints the absolute path of the file it wrote. Open it in a browser.

Or install the command globally from your clone (not yet published to npm):

```bash
npm install -g .
freelance-invoice examples/sample-invoice.json
```

## What the output looks like

See [`examples/sample-invoice.html`](examples/sample-invoice.html), rendered from [`examples/sample-invoice.json`](examples/sample-invoice.json).

It is a single A4 page with a plain typographic layout: a bold **INVOICE** title and the issuer's name on the left, and the invoice number, issue date, due date and amount due on the right. Below a heavy rule sit the **From** and **Bill to** blocks side by side, then the line-item table (description, quantity, unit price, amount), a right-aligned totals block (subtotal, optional tax, and the grand total), and a notes section for payment instructions. Black on white, tabular numbers, no logos or decoration, so it prints cleanly on any printer.

## Usage

```
freelance-invoice <invoice.json> [-o <out.html>] [--locale <tag>]

Options:
  -o, --output <file>   Output path (default: <input name>.html next to the input)
      --locale <tag>    BCP 47 locale for dates and money, e.g. en-GB, de-DE (default: en-US)
  -h, --help            Show this help
  -v, --version         Show version
```

Exit codes: `0` success, `1` unreadable file, invalid JSON or invalid invoice, `2` bad command-line usage.

Validation errors are listed all at once so you can fix them in one pass:

```
$ freelance-invoice broken.json
freelance-invoice: broken.json has 3 problem(s):
  - "dueDate" must be a valid date in YYYY-MM-DD format (got "15/10/2026")
  - "from.email" is required
  - "items[1].quantity" must be a positive number
```

### Use it from code

```js
import { validateInvoice, renderInvoice, computeTotals } from 'freelance-invoice';

const errors = validateInvoice(invoice);   // [] when valid
const html = renderInvoice(invoice, { locale: 'en-GB' });
const { subtotal, tax, total } = computeTotals(invoice);
```

## invoice.json schema

```jsonc
{
  "invoiceNumber": "2026-014",        // required, string or number
  "issueDate": "2026-10-01",          // required, YYYY-MM-DD
  "dueDate": "2026-10-15",            // required, YYYY-MM-DD, not before issueDate
  "currency": "USD",                  // required, ISO 4217 code (USD, EUR, EGP, ...)
  "from": {                           // required: you
    "name": "Nour Hassan Studio",     //   required
    "email": "hello@example.com",     //   required
    "address": ["Line 1", "Line 2"]   //   optional, string (newlines allowed) or array of lines
  },
  "to": {                             // required: your client
    "name": "Client Ltd",             //   required
    "email": "accounts@example.com",  //   optional
    "address": "Street 1\nCity"       //   optional
  },
  "items": [                          // required, at least one
    { "description": "Logo design", "quantity": 1, "unitPrice": 1800 }
  ],
  "taxPercent": 14,                   // optional, 0–100, applied to the subtotal
  "notes": "Payment within 14 days.", // optional, newlines are kept
  "locale": "en-GB"                   // optional, overridden by --locale
}
```

Amounts are assumed to have two decimal places, which covers most currencies.

## Roadmap

Ideas, not promises. Issues and PRs welcome:

- Discount lines and multiple tax rates
- Optional logo and accent colour
- Currencies with 0 or 3 minor digits (JPY, KWD)
- Right-to-left layout for Arabic and Hebrew invoices
- Direct PDF output

## Contributing

Bug reports, ideas and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). Run the tests with `npm test`; there is nothing to install.

## Author

Built by [Koldo Jao](https://github.com/koldoishere), who also works on [Sarab](https://sarabhub.me), tools for freelancers and students. This CLI is a standalone project and does not need Sarab or any account.

## License

[MIT](LICENSE) © 2026 Koldo Jao
