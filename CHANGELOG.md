# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-10-22

### Added

- `freelance-invoice` CLI: render `invoice.json` to a self-contained, print-ready A4 HTML invoice.
- `-o/--output`, `--locale`, `--help` and `--version` options.
- Validation of all required fields with a full list of problems and non-zero exit codes.
- Subtotal, optional tax and total computed in integer cents.
- Currency and date formatting via `Intl` for any ISO 4217 currency and locale.
- Programmatic API: `validateInvoice`, `computeTotals`, `formatMoney`, `renderInvoice`.
- Example invoice (`examples/sample-invoice.json`) and pre-rendered output.
- Test suite using `node:test` and GitHub Actions CI on Node.js 18, 20 and 22.
