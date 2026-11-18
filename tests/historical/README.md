# Historical PixelSurvivor acceptance

This opt-in archive preserves original test bodies, assertions and golden fixtures.
It is not part of the mandatory Laravel Game Template runtime CI.

- `unit/`: 62 original files with historical inputs, proof/scope checks or old
  replay contracts. Mixed files retain their complete original contents, including
  runtime tests also extracted into `tests/unit/`. This overlap is intentional.
- `e2e/`: 148 original PixelSurvivor browser acceptance/review scenarios, including
  their original localized selectors, screenshots, development recipes and proof
  dependencies. They are a frozen acceptance record, not the current smoke suite.
- `helpers/`: original proof readers and the historical tuning/serialization replay
  adapter. They never fabricate missing inputs or substitute current evidence.
- `fixtures/`: original balance baseline and both historical replay golden files.
- `manifest.json`: original/archived SHA-256 hashes, import-independent statement
  hashes, and the reason each unit test statement was classified as historical.
  Only relative module specifiers changed during relocation. JSON fixture bytes
  and all other test statements were verified unchanged.

Run from the repository root, using the single root dependency installation:

```sh
npm run test:historical
npm run test:historical:replays
npm run typecheck:historical
npm run test:e2e:historical -- warrior-review.spec.ts
npm run test:e2e:historical:production
```

These are real checks: failures remain failures, with no skip/todo, fake proof,
replacement golden hashes or expected-success wrapper. Restore genuine source
materials at their original root-relative `art/` / `docs/verification/` paths before
attempting historical artistic acceptance. The archive is not an art asset pack.

The local 2026-11-18 unit rerun retains **29 failing files, 38 failed tests and one
collection error**; historical TypeScript retains **10 diagnostics** for the absent
Warrior review model/catalog. The eight replay rows do **not** establish compatibility
with `d7bb994` / `d1fa0cc`; the original sources and `source-before.zip` are unavailable.
Their hashes remain unchanged. Passing same-seed tests of today's World does not
resolve that uncertainty.

See [active CI report](../../docs/architecture/ACTIVE_CI.md) and the detailed
[QA failure inventory](../../docs/architecture/QA_STABILIZATION.md). Mandatory CI
also verifies this archive's hashes so accidental loss or rewriting fails the build.
