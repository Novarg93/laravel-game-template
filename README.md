# Laravel Game Template

An independent Laravel application with an embedded Phaser game. Laravel owns the
website, sessions, accounts, commerce, payments and administration. The game owns
simulation and rendering and communicates through the existing `PlatformPort`.

```text
app/              Laravel models, services, controllers, policies and Filament
bootstrap/        Laravel bootstrap and generated production SSR bundle
config/           Business and provider configuration
database/         Existing migrations, seeders and factories
game/             Phaser runtime, balance, art definitions, audio, input and Vue HUD
resources/        Inertia website, browser platform adapter, Blade and CSS
routes/           Website, internal browser routes, provider callbacks and commands
public/           Web document root; approved assets in game-assets/
tests/            Laravel, Vitest and Playwright tests
scripts/          Catalog export, game tools and isolated browser test runner
```

## Requirements and installation

Use PHP **8.4.1+** with the extensions required by `composer.lock`, Composer 2,
Node **22.13+**, and npm 10+. The locked Symfony dependencies require PHP 8.4.1;
PHP 8.3 cannot install this existing dependency set. No global package installation
or second Node dependency directory is needed.

From this repository root, for a **new local copy**:

```sh
composer install
npm ci
cp .env.example .env
php artisan key:generate
```

Configure a new database in `.env`. For SQLite create `database/database.sqlite`
as an empty file, then run `php artisan migrate`. For an existing database first
review its configuration and migrations; do not reset it. No private `.env`, database,
provider secrets or session data belong in Git.

On Windows use `npm.cmd` if PowerShell blocks `npm.ps1`. Select a compatible PHP
in your current shell's PATH; do not bypass Composer's platform checks.

## Development and production builds

Herd can serve the root application's `public/` directory. Otherwise use
`php artisan serve` in one terminal. Run `npm run dev` in another terminal for
Laravel Vite, Vue, Tailwind, Wayfinder and Inertia development SSR on port 5174.
Visit the Laravel URL, including `/play` for the game.

```sh
npm run build        # Laravel website and game client entries -> public/build
npm run build:ssr    # client plus Inertia production SSR -> bootstrap/ssr
php artisan inertia:start-ssr
```

The production document root is **public/**. Keep the SSR process and the existing
queue worker supervised in your deployment environment. Serve `/game-assets/*`
directly with Nginx/Apache; private storage is not a public asset directory. The
architecture report includes deployment examples. No deployment is performed here.

The optional guest game harness uses the same dependencies and Vite configuration:

```sh
npm run dev:game     # port 5173, standalone guest game
npm run build:game   # optional standalone test build -> dist
npm run preview:game
```

The standalone harness has no account commerce adapter. `/play` installs the existing
HTTP adapter for signed-in users and preserves guest local gameplay for guests.

## Browser communication and payments

All former browser `/api/v1` requests now use **/internal/** through
`resources/js/lib/internalRoutes.ts`. These are web session routes with verified
email, CSRF tokens on mutations, ownership, policies, throttling, validation and
private/no-store responses. There is no mobile API, token authentication or Sanctum.
Website page URLs are preserved.

External signed callbacks stay at `POST /webhook` (Stripe) and
`POST /payments/webhooks/{provider}`. They keep their existing signature checks,
raw payload, idempotency and CSRF exceptions. They do not require browser sessions.
Existing payment providers and sandbox/DEV guards are retained; this refactor does
not introduce live payment support.

## Validation

```sh
php artisan route:list
php artisan test                    # isolated in-memory SQLite
composer lint:check                 # Pint
composer types:check                # PHPStan
composer test:mysql                 # guarded, isolated MySQL test database only
npm run typecheck:runtime            # all website/game source, strict unused checks
npm run typecheck                    # full source + existing test code
npm run lint
npm test                            # complete existing Vitest suite; no skipped tests
npm run test:catalog
npm run test:browser                 # new temporary SQLite DB and local HTTP server
npm run test:e2e -- laravel-first-game.spec.ts
```

Install the local browser binary with
`PLAYWRIGHT_BROWSERS_PATH=.browsers npx playwright install chromium` (PowerShell:
`$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD/.browsers"` before running the command).
`test:browser` creates a fresh database below `storage/framework/testing/` and
synthetic test accounts, and stops its server afterwards. It does not migrate or
reset your configured development database.

**Current validation limitations:** QA fixed 12 stale runtime expectations and
restored collection of 84 historical tests. Full Vitest still has 29 failing files,
38 failed assertions and one collection error (1147 tests pass). Missing historical
Warrior proofs/review sources, incompatible old byte/scope/replay fixtures and
MySQL authentication block full acceptance. Full test-code TypeScript retains
10 diagnostics from unavailable review modules. No checks were skipped or weakened.
Runtime types, lint, client/SSR/standalone builds, SQLite tests and the browser/game
smoke checks pass. This template is **not declared production-ready**. See
[QA stabilization](docs/architecture/QA_STABILIZATION.md) for the exact failure tables
and private test-credential setup commands.

## Copying for another game

See [Laravel-first architecture and migration report](docs/architecture/LARAVEL_FIRST_RESTRUCTURE.md)
for the route map, file map, configuration points, security invariants, validation
results and copying checklist. Read `AGENTS.md` before changing this template.
`PLAN.md` and historical Pixel Survivor art reports describe the original game;
they do not prohibit the current Laravel-first architecture.
