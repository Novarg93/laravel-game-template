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

## Customize a new project

Set public identity, site and menu themes, homepage copy and brand assets in
`config/project.php`. Start with the [new project checklist](docs/template/NEW_PROJECT_CHECKLIST.md)
and see the [configuration reference](docs/template/TEMPLATE_CONFIGURATION.md).
Run `php artisan project:sync` after changing the source defaults and verify
the result with `npm run test:project`.

## Validation

The mandatory [Active CI](.github/workflows/active-ci.yml) runs on pull requests,
main pushes and manual dispatch, with pinned actions/toolchains and locked dependencies.
It checks Laravel SQLite tests, PHPStan, Pint, strict TypeScript for **all current
website/game code and active tests**, ESLint, runtime Vitest, catalog integrity,
client/SSR/standalone builds and real Chromium smoke scenarios.

```sh
php artisan test                    # isolated in-memory SQLite
composer lint:check                 # Pint
composer types:check                # PHPStan
npm run typecheck                   # generates Wayfinder types, then all active TS/Vue
npm run typecheck:runtime           # optional source-only diagnostic
npm run lint
npm run test:suites                 # archive integrity + active TypeScript coverage
npm test                            # active runtime/integration Vitest (test:runtime)
npm run test:project                 # project validation, standalone sync and catalog parity
npm run build:ssr
npm run build:game
npm run test:browser                # isolated SQLite, owned Laravel + production SSR
npm run test:browser:branding       # alternate project identity and Aurora theme
npm run test:e2e                    # current standalone development smoke
npm run test:e2e:production         # current standalone production smoke
```

Install Chromium once: `PLAYWRIGHT_BROWSERS_PATH=.browsers npx playwright install chromium`
(PowerShell: set `$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD/.browsers"` first).
On Linux CI the workflow adds `--with-deps` for Chromium's OS libraries.
`composer ci:check` runs the complete active PHP/frontend/build/browser checks after
installation. Browser checks require free ports 8037, 13714, 5173 and 4173 and no
`public/hot` development marker. `test:browser` creates a new synthetic test database
under `storage/framework/testing/` and stops its own HTTP/SSR servers afterwards.
It does not reset the development database or reuse an existing SSR process.

The separate [historical archive](tests/historical/README.md) keeps original artistic
acceptance, proof/scope assertions, PixelSurvivor browser review scenarios and golden
replays. `npm run test:historical`, `npm run typecheck:historical` and
`npm run test:e2e:historical` are explicit opt-in checks; their unresolved failures
are documented, not converted to success. `npm run test:all` runs both Vitest suites.
Eight old replay rows still have **unproven compatibility**; their golden hashes
were not updated. Missing Warrior source/proof files are not needed by active CI.

MySQL remains a separate guarded verification. Run the read-only diagnostic
`php scripts/check-mysql-test-connection.php` before `composer test:mysql`; use only
existing credentials for the isolated `pixel_survivor_test` database. Never point
this suite at a production/development database. No credentials/users/databases
are changed by the diagnostic.

See the [active CI report](docs/architecture/ACTIVE_CI.md) for executed results and
remaining blockers, and [QA stabilization](docs/architecture/QA_STABILIZATION.md)
for the original failure inventory. A configured workflow is not proof of a remote
CI run, and historical acceptance/MySQL limitations still prevent an unconditional
production-ready claim.

## Copying for another game

See [Laravel-first architecture and migration report](docs/architecture/LARAVEL_FIRST_RESTRUCTURE.md)
for the route map, file map, configuration points, security invariants, validation
results and copying checklist. Read `AGENTS.md` before changing this template.
`PLAN.md` and historical Pixel Survivor art reports describe the original game;
they do not prohibit the current Laravel-first architecture.
