import { randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { setTimeout } from 'node:timers/promises';

const directory = resolve('storage/framework/testing/restructure-' + randomUUID());
mkdirSync(directory, { recursive: true });
const database = resolve(directory, 'payments-test.sqlite');
writeFileSync(database, '');
const port = process.env.TEMPLATE_BROWSER_PORT ?? '8037';
const env = { ...process.env, APP_ENV: 'testing', APP_KEY: 'base64:YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=', APP_DEBUG: 'false', APP_URL: `http://127.0.0.1:${port}`, DB_CONNECTION: 'sqlite', DB_DATABASE: database, DB_URL: '', CACHE_STORE: 'database', SESSION_DRIVER: 'database', SESSION_COOKIE: 'template-browser-' + randomUUID(), QUEUE_CONNECTION: 'sync', MAIL_MAILER: 'array', PAYMENTS_PROVIDER: 'test', PAYMENTS_TEST_ENABLED: 'true', APP_CONFIG_CACHE: resolve(directory, 'config.php'), APP_ROUTES_CACHE: resolve(directory, 'routes.php'), PLAYWRIGHT_BROWSERS_PATH: resolve('.browsers'), TEMPLATE_BROWSER_PORT: port };
const php = process.env.PHP_BINARY ?? 'php';
for (const args of [['artisan', 'migrate', '--force'], ['tests/fixtures/browser-template.php']]) {
    const result = spawnSync(php, args, { env, stdio: 'inherit', windowsHide: true });
    if (result.status !== 0) process.exit(result.status ?? 1);
}
const server = spawn(php, ['-S', `127.0.0.1:${port}`, resolve('vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')], { cwd: resolve('public'), env, stdio: 'inherit', windowsHide: true });
try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
        if (server.exitCode !== null) throw new Error('Isolated server exited before startup');
        try { ready = (await globalThis.fetch(`http://127.0.0.1:${port}/up`)).ok; } catch { /* Await startup. */ }
        if (ready) break;
        await setTimeout(100);
    }
    if (!ready) throw new Error('Isolated server startup timeout');
    const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config=playwright.laravel.config.ts', ...process.argv.slice(2)], { env, stdio: 'inherit', windowsHide: true });
    process.exitCode = await new Promise(resolve => child.once('exit', code => resolve(code ?? 1)));
} finally {
    server.kill();
}
