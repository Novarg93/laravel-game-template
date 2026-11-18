# Laravel-first architecture restructure

Date: 2026-11-18. Repository: `Novarg93/laravel-game-template` only.

## Status

The Laravel-first migration remains intact. [Active QA / CI](ACTIVE_CI.md) now
separates current runtime/integration tests from frozen PixelSurvivor acceptance.
The active Vitest suite passes **1046 tests in 143 files**; strict TypeScript covers
all current website/game runtime and every active test. Laravel SQLite passes
16 tests / 383 assertions; PHPStan, Pint, ESLint, catalog and all three builds pass.
Browser smoke passes 3 website/SSR + 2 game DEV + 1 standalone production scenarios.

Original historical assertions and golden fixtures remain in `tests/historical/`:
414 cases (376 pass / 38 fail), 29 failing files, one collection error; historical
TypeScript retains 10 missing-review diagnostics. Eight replay rows still have
unproven compatibility. MySQL diagnostic remains blocked at 1045 with zero writes.
Production readiness/historical compatibility are not unconditionally declared.
No commit, push or deployment is performed in this final QA task. GitHub CI has not
yet run. Original migration logs and VALIDATION.json remain immutable evidence;
[QA_STABILIZATION.md](QA_STABILIZATION.md) preserves the earlier failure inventory.

## Audit evidence and original dependency graph

The pre-move inventory covers 10,844 files, 4,932 JavaScript/TypeScript/CSS import
edges and 779 PHP `use` dependencies. All old-structure references include filenames
and line numbers. Binary assets were inventoried and hashed; they were not decoded
and re-encoded. Findings are recorded in:

- `DEPENDENCY_MAP_BEFORE.json`: full inventory, original hashes, import edges,
  PHP dependencies, old path/API references and configuration conflicts.
- `FILE_MAP.json`: 969 relocated/merged/retired file paths.
- `RELOCATIONS.json`: the actual filesystem move operations.
- `ROUTE_MAP.json`: all 27 original versioned route declarations and their outcome.
- `VALIDATION.json`: machine-readable final checks and failure-set comparison.
- `GAME_BASELINE.log` / `GAME_AFTER.log`: complete pre/post Vitest output with local
  absolute repository paths sanitized. Historic failures are not hidden.

Original structure:

```text
package.json, package-lock.json, vite.config.ts   standalone game build
index.html -> src/main.ts -> src/App.vue
src/game/{bootstrap,scenes,systems,entities,abilities,...}
src/ui/                                          Vue game UI
public/assets/                                   approved game runtime assets
tests/{unit,e2e,helpers,fixtures}                 local ignored game tests
scripts/                                        exporters, art tools and tests
apps/web/
  app/, bootstrap/, config/, database/, routes/
  resources/{js,css,views,game/upgrade-catalog.json}
  public/index.php
  artisan, composer.json, composer.lock
  package.json, package-lock.json, vite.config.ts
```

There were no `apps/web/tests`, PHPUnit XML files, task files or `.github/workflows`
in this supplied copy. The Composer scripts referenced missing backend test
infrastructure. Root `.gitignore` excluded all tests and docs; Laravel's ignore file
also excluded AGENTS.md. Those rules were reconciled so current instructions,
backend tests, game tests and this report can be reviewed. Historical local art
reports remain ignored and unchanged. The accepted prompt journal and source art
were not modified.

Original dependency chains and their replacements:

| Area | Original dependency | Current dependency |
| --- | --- | --- |
| Website bootstrap | nested Laravel artisan/public index/bootstrap | root standard Laravel paths |
| `/play` | nested `resources/js/game.ts` -> deep `../../../../src/main` | `resources/js/game.ts` -> `@game/main` |
| Game shell | `src/App.vue` -> `src/game` and `src/ui` | `game/App.vue` -> game modules and `game/ui` |
| Platform | nested HttpPlatform -> deep relative game contracts | `resources/js/platform/HttpPlatform.ts` -> `@game/platform/*` |
| Guide / inventory types | deep imports outside apps/web | shared `@game/*` data/type imports |
| Runtime asset loading | Vite BASE_URL + `assets/*`, PHP proxy routes | `gameAssetUrl()` -> static `/game-assets/*` |
| Commerce / payments / operators | scattered `/api/v1` strings | shared `internalRoute()` resolver |
| Server upgrade pool | root export script -> nested resources | root export script -> `resources/game/upgrade-catalog.json` |
| Tests / asset tools | `src/game`, `src/ui`, `public/assets`, old HTTP asset paths | corresponding root game/static paths |
| Historical provenance | paths embedded in accepted manifests/proofs | records preserved; test `runtimePath()` maps relocated files |
| Deployment | no workflows in the supplied repository | documented root Laravel document root and commands |

## Target structure and preserved modules

```text
app/{Filament,Http,Models,Policies,Services,Payments,Runs,...}
bootstrap/, config/, database/, routes/
resources/{css,js,views,game/upgrade-catalog.json}
game/{bootstrap,scenes,systems,entities,abilities,config,art,audio,input,
      platform,ui,events,services,ultimates,loot,utils,...}
game/App.vue, game/main.ts, game/style.css, game/assets.ts
public/index.php
public/game-assets/{hd,audio,...}
tests/{Feature,unit,e2e,browser,helpers,fixtures}
scripts/, docs/
artisan, composer.json, composer.lock
package.json, package-lock.json, vite.config.ts
```

The Laravel application was moved, not re-created. Models, policies, financial
services, provider adapters, Filament 5 resources, migrations, seeders and factories
remain byte-identical. Gameplay systems, entities, ability logic, balance,
progression definitions, input controllers and platform contracts remain
byte-identical. `tests/unit/laravel-first.test.ts` verifies these preserved areas
against the before-inventory, including all **174 approved runtime asset files**.

Game UI cross-module imports now use `@game/*`; website imports use `@/*` and
`@game/*`. Relative imports inside existing modules remain where appropriate.
No `packages/game`, second Laravel application, duplicate inventory/wallet/ledger
or duplicate game bootstrap was created. The local file dependency
`pixel-survivor: file:../..` was removed.

## Node, Vite, SSR and generated files

One root `package.json`, npm lockfile and `node_modules` installation serve the whole
application. Vue remains 3.5.44 and Phaser 4.2.1. Laravel's Vite 8.3.5, Inertia,
Tailwind and Wayfinder tooling are retained. Obsolete explicitly pinned Rollup
platform binaries were removed; Vite 8 resolves its own platform dependencies.
`pnpm-workspace.yaml` was retired because npm is the single package manager.

The existing game and Laravel dependency constraints were merged. npm 10.9.2 hit an
Arborist optional-peer resolution error (`edgesOut`) while reconciling Vitest;
npm 11 generated the final lockfile locally, without a global installation or
`legacy-peer-deps`. **npm 10.9.2 `npm ci` then successfully installed it.**
`npm ls vue phaser vite` confirms one Vue and Phaser runtime and a shared Vite.

The primary Vite configuration uses normal Laravel mode by default:

- `resources/css/app.css` - website styles / Tailwind.
- `resources/js/app.ts` - website Inertia entry and SSR source.
- `resources/js/game.ts` - `/play` browser-only entry; installs HttpPlatform for
  authenticated accounts and dynamically imports the single game entry.
- Inertia's existing plugin generates `bootstrap/ssr/app.js`; the SSR process was
  started and rendered actual website/guide HTML during browser tests. Phaser is
  never evaluated in the website SSR runtime.

`--mode game` provides standalone guest development/test builds using the same
aliases, Vue and Phaser. Its static middleware checks resolved paths stay inside
`public/game-assets`; its test build copies only the approved asset tree, not
Laravel's public index, storage or other application files. Build products in
`dist`, `public/build`, Wayfinder actions/routes, Filament published assets and
`bootstrap/ssr` remain ignored. `vitest.config.ts` is a test configuration, not a
second application build.

`scripts/export-upgrade-catalog.mjs` now uses `configFile: false` for its headless
Vite module loader, avoiding Laravel plugin/Wayfinder/SSR startup recursion. It
reads the same game definitions under `/game` and generates the same versioned
catalog at `resources/game/upgrade-catalog.json`. It is checked with
`npm run test:catalog` and runs before the normal production client build.

## Static game assets

The 174 files formerly in `public/assets` moved to `public/game-assets` without
byte changes. Atlas JSON, sprite textures, animation definitions, audio, music and
accepted manifests were retained. No generation or art acceptance took place.
The original standalone favicon is in `game/favicon.svg`; the website retains its
own original Laravel favicon and public images.

`game/assets.ts` resolves legacy `assets/...` logical names in approved data to
`/game-assets/...`. It does not derive URLs from Vite's `/build/` base. Audio,
texture and atlas preloaders use this shared helper. Historical source/provenance
strings remain unchanged. The former GameAssetController and both PHP proxy routes
(`/assets/*`, `/build/assets/*`) were removed only after updating the loaders.

With a production Nginx root pointing at this project's public directory:

```nginx
location ^~ /game-assets/ {
    try_files $uri =404;
    expires 1h;
    add_header X-Content-Type-Options nosniff;
}
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
```

Retain your normal PHP-FPM configuration and dotfile restrictions. Expose only
`public/`, never repository-root `art/` or private `storage/`. No PHP asset proxy is
needed. Static 200 responses and browser audio/sprite loads were verified.

## Internal route mapping

`routes/internal.php` is required by `routes/web.php`, so it uses Laravel's existing
web stack. All 23 account/game endpoints keep `auth`, `verified`, payload bounds,
per-route throttles and the same controller/service methods. The two operator JSON
endpoints additionally retain `can:operate-platform`. Website `/operations` pages
and every other existing page URL remain unchanged.

No active frontend consumer used the two public leaderboard JSON aliases.
Those aliases were removed; the `/leaderboard` and `/leaderboard/runs/{publicRun}`
Inertia pages and their public projection/ownership rules remain.

| Method | Former route | Result |
| --- | --- | --- |
| GET | `/api/v1/leaderboard` | Removed; use the existing website page |
| GET | `/api/v1/leaderboard/runs/{publicRun}` | Removed; use the existing website page |
| GET | `/api/v1/operations/health` | `/internal/operations/health` |
| POST | `/api/v1/operations/runs/{run}/review` | `/internal/operations/runs/{run}/review` |
| POST | `/api/v1/runs/{run}/upgrade-offers` | `/internal/runs/{run}/upgrade-offers` |
| POST | `/api/v1/runs/{run}/actions` | `/internal/runs/{run}/actions` |
| GET | `/api/v1/runs/{run}/actions/{operation}` | `/internal/runs/{run}/actions/{operation}` |
| POST | `/api/v1/runs/{run}/actions/{operation}/ack` | `/internal/runs/{run}/actions/{operation}/ack` |
| POST | `/api/v1/profile/nickname` | `/internal/profile/nickname` |
| GET | `/api/v1/runs/{run}/status` | `/internal/runs/{run}/status` |
| POST | `/api/v1/payments/quote` | `/internal/payments/quote` |
| POST | `/api/v1/payments/orders` | `/internal/payments/orders` |
| POST | `/api/v1/payments/orders/{order}/dev-confirm` | `/internal/payments/orders/{order}/dev-confirm` |
| GET | `/api/v1/payments/orders/{order}` | `/internal/payments/orders/{order}` |
| POST | `/api/v1/payments/orders/{order}/checkout` | `/internal/payments/orders/{order}/checkout` |
| GET | `/api/v1/wallet` | `/internal/wallet` |
| GET | `/api/v1/shop` | `/internal/shop` |
| POST | `/api/v1/shop/purchases` | `/internal/shop/purchases` |
| GET | `/api/v1/progress` | `/internal/progress` |
| GET | `/api/v1/inventory` | `/internal/inventory` |
| POST | `/api/v1/inventory/activate-xp-boost` | `/internal/inventory/activate-xp-boost` |
| POST | `/api/v1/runs` | `/internal/runs` |
| GET | `/api/v1/runs/{run}/inventory` | `/internal/runs/{run}/inventory` |
| POST | `/api/v1/runs/{run}/death` | `/internal/runs/{run}/death` |
| POST | `/api/v1/runs/{run}/items` | `/internal/runs/{run}/items` |
| POST | `/api/v1/runs/{run}/items/{usage}/ack` | `/internal/runs/{run}/items/{usage}/ack` |
| POST | `/api/v1/runs/{run}/finish` | `/internal/runs/{run}/finish` |

`resources/js/lib/internalRoutes.ts` is the sole browser namespace resolver. It
accepts application paths only and rejects external URLs, traversal, queries and
encoded paths. HttpPlatform keeps its response validators, operation identifiers,
retry bodies, action recovery/acknowledgement, abort handling and start/finish
behavior. All website consumers were updated without changing request/response
payload contracts. Currency selection, settings and account page routes retain
their pre-existing website URLs.

No API route file, Sanctum, personal access tokens, JWT or mobile-specific auth
infrastructure existed in this copy. None was introduced. Classes were not deleted
based on names such as Http, Controller or Api.

## Security and financial integrity

The `/internal` prefix is organizational, not an authorization mechanism.

- Sessions, verified email, ownership filters, policies, validated payloads and
  throttling are enforced by the retained web route stack and services.
- `RequireCsrfToken` extends Laravel 13's request-forgery middleware. For internal
  routes it requires the session CSRF token even when `Sec-Fetch-Site: same-origin`
  is supplied. Other web routes retain the framework's behavior. No Origin/CORS
  check substitutes for authentication or token verification here.
- Sensitive internal responses use `private, no-store`, including authentication,
  validation, CSRF and other exception responses. JSON exception contracts apply
  to the new namespace. Expired sessions return 419 JSON.
- Server-owned prices, pending-vs-available balances, immutable ledgers, transaction
  boundaries and operation hashes were preserved. Tests exercise exactly-once
  purchases, premium charges, item consumption, resurrection, recovery, run
  start/finish receipts and webhook grants. No financial service was rewritten.
- Guest `/play` remains local gameplay. It does not gain access to account endpoints.

External callbacks are unchanged:

| Callback | Authentication and handling |
| --- | --- |
| `POST /webhook` | existing Spatie/Stripe signature verification, raw provider payload and queued job |
| `POST /payments/webhooks/{provider}` | existing provider signatures/timestamp tolerance, raw payload, inbox and fulfillment idempotency |

The existing CSRF exceptions `webhook` and `payments/webhooks/*` are unchanged.
No session/verified middleware was added to callbacks. Tests enable real CSRF
middleware and verify signed callbacks still succeed without session tokens,
invalid signatures/timestamps fail, and repeated provider events grant credits
once. No external provider delivery configuration or Stripe API integration was
changed. Local provider simulation was used; real provider credentials were neither
requested nor used.

## Migration validation recorded before QA

The figures in this section describe the original restructuring run. For current
figures and a complete classification use [QA_STABILIZATION.md](QA_STABILIZATION.md)
and QA_VALIDATION.json; the historical evidence below has not been re-recorded.

Environment: Windows, Node 22.16.0, npm 10.9.2, PHP 8.4.27 used from an ignored
portable installation in `.tmp/`. System PHP 8.3.22 was left unchanged. Dependencies
were installed from the original Composer lockfile with real platform checks.

| Check | Result |
| --- | --- |
| `composer install --no-interaction --prefer-dist` | PASS, root application, dependencies unchanged |
| `npm ci --no-audit` | PASS, one primary installation |
| `php artisan --version`, `route:list` | PASS, Laravel 13.42.0; 25 internal routes; no API routes |
| `npm run dev` | PASS with compatible PHP selected; Wayfinder and development SSR warmup |
| `php artisan test` | PASS, 16 tests / 383 assertions, isolated SQLite |
| `php vendor/bin/phpstan analyse --memory-limit=512M` | PASS |
| `php vendor/bin/pint --test` | PASS |
| `npm run lint` | PASS |
| `npm run typecheck:runtime` | PASS, all website/game source with strict unused checks |
| `npm run build:ssr` | PASS, Laravel client + production SSR |
| `node bootstrap/ssr/app.js` | PASS; live SSR used in browser checks |
| `npm run build:game` | PASS, optional standalone build |
| `npm run test:catalog` | PASS |
| new/affected asset + transport tests | PASS, 25 tests across 5 files |
| `npm run test:browser` | PASS, 3 scenarios; local provider payment, authenticated website, static game, Filament, mobile landscape |
| `npm run test:e2e -- laravel-first-game.spec.ts` | PASS, 2 scenarios: movement, upgrade, contact damage, death/restart, stable listeners, gamepad, Warden, decoded audio |
| complete `npm test` before | 35 failing files / 125 passing files; 24 failed / 1061 passed tests |
| complete `npm test` after | **same 35 failing files** / 126 passing files; **same 24 failed** / 1066 passed tests |
| complete `npm run typecheck` | BLOCKED by missing `art/warrior-review-v1/model` and `catalog` modules and resulting test-code type errors |
| isolated MySQL suite | BLOCKED before migrations: local MySQL authentication rejected (1045); safety guard refused connection |

The complete test suite is **not green**. Its inherited failures include missing
Warrior buffs/cleave art proofs, missing review modules, stale Russian label
expectations and pre-existing deterministic snapshot mismatches. The same failure
set was captured before any structural moves. Four temporary regressions caused
by paths inside old art manifests were corrected through explicit path resolution;
no test was skipped, disabled, or given weaker assertions. Historical accepted art
or snapshot proofs were not fabricated or re-recorded to force passing tests.

The full pre-existing Playwright suite also contains stale Russian labels and
requires archived review sources. It was not run in full; the new current-language
regression scenarios above cover the changed architecture. No physical gamepad,
physical phone, long soak, real Stripe delivery or production rollout was tested.
Vite still reports the existing large game chunk warning.

Canvas and page screenshots, captured and visually inspected:

- `screenshots/laravel-first/home.png`, `shop.png`, `payment-confirmed.png`, `filament.png`.
- `guest-game.png`, `account-game.png`, `mobile-landscape.png`.
- `combat-upgrade.png`, `boss-gamepad.png`.

Before full acceptance: supply the missing historical review/proof files, reconcile
inherited stale expectations against the accepted original behavior, and run the
existing guarded MySQL suite with private local test configuration. Do not use a
production/development database or bypass its safety guard. No completion marker is
appropriate until these gates are actually green.

## Configuration points for copying the template

| Concern | Existing configuration/source |
| --- | --- |
| Site name | `.env` APP_NAME / VITE_APP_NAME; website branding components |
| Website theme | `resources/css/{app,site,commerce,account,...}.css`, website layouts; `resources/views/filament/chronicle-theme.blade.php` |
| Game title | `game/ui/components/MainMenu.vue`, `resources/views/play.blade.php`, standalone `index.html` |
| Characters | `game/config/characters.ts`, game art registry/manifests; `config/progression.php` characters/abilities |
| Enemies / bosses | `game/config/enemyDefinitions.ts`, boss-specific game configuration and systems |
| Abilities / upgrades | `game/abilities`, `game/config`, `game/systems/UpgradeSystem.ts`; exported upgrade catalog |
| Maps | `game/config/biomes.ts`, map presentation; server `config/progression.php` maps |
| Duration / victory | `game/config/runLimits.ts`, final-boss configuration and encounter systems; server assessment/record validation |
| Asset packs / audio | `game/art`, `game/audio`, `game/assets.ts`, `public/game-assets` |
| Shop / inventory / premium | `config/shop.php`, `inventory.php`, `run_items.php`, `premium.php`, existing catalog/admin services |
| Progression and rewards | `config/progression.php`, versioned server snapshots/catalog |
| Currency and payments | existing Currency models/Filament, `config/payments.php`, `stripe-webhooks.php`, `services.php`, provider adapters and private env values |
| Administration | existing verified admin gate in `app/Models/User.php`, operator gate and policies; review explicitly for the new project's requirements |

Copy procedure:

1. Copy this repository alone, excluding `.env*` other than `.env.example`, vendor,
   node_modules, `.tmp`, build output, private storage, SQLite files and sessions.
   Keep approved public assets and tracked source/configuration/tests. Preserve art
   provenance and historical records separately where required by the chosen pack.
2. Set a new application identity, APP_URL, APP_KEY and a new private database;
   install with `composer install` and `npm ci` from the root. Do not copy payment
   credentials or customer/runtime records from another project.
3. Apply existing migrations to the new empty database. Configure providers and
   callback secrets privately while retaining signed callback URLs and security.
4. Configure the existing points in the table. For different gameplay explicitly
   update matching authoritative server validators/catalogs and their versions;
   preserve historical financial receipts and idempotency formats for existing data.
5. Export/check the upgrade catalog, run the documented gates, build client + SSR,
   and configure a public-only document root with static game assets, queue and SSR
   supervision. Treat deployment as a separate explicitly authorized operation.

This task did not reskin pages, change progression/balance, add mobile support,
introduce business features, regenerate assets or rewrite payments/gameplay.
