# Contributing

Thanks for helping improve freelance-invoice.

## Ground rules

- **Zero runtime dependencies.** Please use Node.js built-ins only. This is a core goal of the project.
- **Node.js 18+.** Don't use APIs that need a newer version.
- **Keep the output self-contained.** The generated HTML must not load external fonts, scripts or images.

## Workflow

1. Fork the repo and create a branch from `main`.
2. Make your change. Add or update a test in `test/` when behaviour changes.
3. Run `npm test` (no install step needed).
4. If you changed the template, regenerate the example with `npm run example` and commit `examples/sample-invoice.html`.
5. Add a line under "Unreleased" in `CHANGELOG.md`.
6. Open a pull request describing what changed and why.

## Reporting bugs

Open an issue with the command you ran, your Node.js version, and a minimal `invoice.json` that reproduces the problem (remove any real client details).
