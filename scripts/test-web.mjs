import { randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import process from 'node:process';
import { setTimeout } from 'node:timers/promises';

// Own both servers: a smoke check must never pass against somebody else's process.
async function requireFreePort(port) {
    const probe = createServer();
    await new Promise((resolve, reject) => {
        probe.once('error', reject);
        probe.listen(port, '127.0.0.1', resolve);
    });
    await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
}
async function waitFor(server, url) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (server.exitCode !== null) throw new Error(`Isolated server exited before startup: ${url}`);
        try {
            if ((await globalThis.fetch(url, { signal: globalThis.AbortSignal.timeout(500) })).ok) return;
        } catch { /* Await this runner's server. */ }
        await setTimeout(100);
    }
    throw new Error(`Isolated server startup timeout: ${url}`);
}
async function stop(server) {
    if (!server || server.exitCode !== null) return;
    const exited = new Promise(resolve => server.once('exit', resolve));
    server.kill();
    await exited;
}
if (existsSync('public/hot')) throw new Error('Remove the development Vite hot file before running production browser checks.');
if (!existsSync('bootstrap/ssr/app.js')) throw new Error('Run npm run build:ssr before browser checks.');
const directory = resolve('storage/framework/testing/restructure-' + randomUUID());
mkdirSync(directory, { recursive: true });
const database = resolve(directory, 'payments-test.sqlite');
writeFileSync(database, '');
const port = process.env.TEMPLATE_BROWSER_PORT ?? '8037';
await requireFreePort(Number(port));
await requireFreePort(13714); // Existing Inertia configuration, not a second application.
const env = { ...process.env, APP_ENV: 'testing', APP_KEY: 'base64:YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=', APP_DEBUG: 'false', APP_URL: `http://127.0.0.1:${port}`, DB_CONNECTION: 'sqlite', DB_DATABASE: database, DB_URL: '', CACHE_STORE: 'database', SESSION_DRIVER: 'database', SESSION_COOKIE: 'template-browser-' + randomUUID(), QUEUE_CONNECTION: 'sync', MAIL_MAILER: 'array', PAYMENTS_PROVIDER: 'test', PAYMENTS_TEST_ENABLED: 'true', APP_CONFIG_CACHE: resolve(directory, 'config.php'), APP_ROUTES_CACHE: resolve(directory, 'routes.php'), PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH ?? resolve('.browsers'), TEMPLATE_BROWSER_PORT: port };
const brandingPreview = process.argv.includes('--branding-preview');
if (brandingPreview) Object.assign(env, {
    PROJECT_NAME: 'Aurora Trial',
    PROJECT_THEME: 'aurora',
    PROJECT_GAME_TITLE: 'Aurora Grove',
    PROJECT_GAME_THEME: 'aurora',
    TEMPLATE_BRANDING_PREVIEW: '1',
});
const php = process.env.PHP_BINARY ?? 'php';
for (const args of [['artisan', 'migrate', '--force'], ['tests/fixtures/browser-template.php']]) {
    const result = spawnSync(php, args, { env, encoding: 'utf8', windowsHide: true });
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
    // Laravel's bootstrapped exception handler can report a fixture error with
    // exit status 0. Never proceed to a misleading authentication smoke failure.
    if (args[0] === 'tests/fixtures/browser-template.php' && !result.stdout.includes('Isolated browser fixtures ready.')) {
        throw new Error('Isolated browser fixtures did not finish successfully.');
    }
}
const server = spawn(php, ['-S', `127.0.0.1:${port}`, resolve('vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')], { cwd: resolve('public'), env, stdio: 'inherit', windowsHide: true });
const ssr = spawn(process.execPath, ['bootstrap/ssr/app.js'], { env, stdio: 'inherit', windowsHide: true });
try {
    await Promise.all([waitFor(server, `http://127.0.0.1:${port}/up`), waitFor(ssr, 'http://127.0.0.1:13714/health')]);
    const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config=playwright.laravel.config.ts', ...process.argv.slice(2).filter(arg => arg !== '--branding-preview')], { env, stdio: 'inherit', windowsHide: true });
    process.exitCode = await new Promise(resolve => child.once('exit', code => resolve(code ?? 1)));
} finally {
    await Promise.all([stop(server), stop(ssr)]);
}
