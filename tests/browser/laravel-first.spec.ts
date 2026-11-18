import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const screenshots = 'screenshots/laravel-first';
mkdirSync(screenshots, { recursive: true });
async function login(page: Page, admin = false) {
    await page.goto('/login');
    await page.locator('#email').fill(admin ? 'admin@admin.admin' : 'template-browser@example.test');
    await page.locator('#password').fill('Template-test-only-2026!');
    await page.locator('button[type=submit]').last().click();
    await expect(page).toHaveURL(/\/dashboard/);
}
function errorsOn(page: Page) {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    return errors;
}

test('website SSR, public navigation and guest game retain static assets and restart', async ({ page, request }) => {
    const errors = errorsOn(page);
    const home = await request.get('/');
    expect(home.status()).toBe(200);
    expect(await home.text()).toContain('<h1'); // Production SSR renders website markup.
    await page.goto('/');
    await page.screenshot({ path: `${screenshots}/home.png`, fullPage: true });
    for (const path of ['/guide', '/faq', '/contact', '/leaderboard']) {
        await page.goto(path);
        await expect(page.locator('h1').first()).toBeVisible();
    }
    const gameFiles: string[] = [];
    page.on('response', response => { if (response.url().includes('/game-assets/')) gameFiles.push(response.url()); });
    await page.goto('/play');
    await expect(page.locator('canvas')).toBeVisible();
    await page.getByRole('button', { name: /^Start run/ }).click();
    await expect(page.locator('.hud')).toBeVisible();
    await page.keyboard.down('d'); await page.waitForTimeout(600); await page.keyboard.up('d');
    await page.screenshot({ path: `${screenshots}/guest-game.png` });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Main menu', exact: true }).click();
    await page.getByRole('button', { name: /^Start run/ }).click();
    await expect(page.locator('.hud')).toBeVisible();
    expect(gameFiles.length).toBeGreaterThan(35);
    expect(await page.evaluate(() => window.__PIXEL__)).toBeUndefined();
    expect(errors).toEqual([]);
});

test('authenticated shop, payment sandbox, internal game requests and account navigation', async ({ page }) => {
    const errors = errorsOn(page), internal: string[] = [], obsolete: string[] = [];
    page.on('request', request => { if (request.url().includes('/internal/')) internal.push(new URL(request.url()).pathname); if (request.url().includes('/api/v1')) obsolete.push(request.url()); });
    await login(page);
    await page.goto('/shop');
    await page.locator('[data-testid="shop-product-healing_potion"] button').click();
    await page.getByRole('button', { name: 'Confirm purchase' }).click();
    await expect(page.getByTestId('purchase-success')).toBeVisible();
    await page.screenshot({ path: `${screenshots}/shop.png`, fullPage: true });
    await page.goto('/wallet');
    await expect(page.getByTestId('wallet-balance')).toHaveText('475');
    await page.locator('#custom-credits').fill('100');
    await page.getByRole('button', { name: 'Calculate price' }).click();
    await page.getByRole('button', { name: 'Proceed to payment' }).click();
    await page.getByRole('button', { name: 'Confirm payment', exact: true }).click();
    await expect(page).toHaveURL(/\/payments\/test\//);
    await page.getByRole('button', { name: 'Test: successful payment' }).click();
    await expect(page.getByRole('heading', { name: 'Top-up complete' })).toBeVisible();
    await expect(page.getByTestId('payment-wallet-balance')).toContainText('575');
    await page.getByRole('button', { name: 'Refresh status' }).click();
    await page.screenshot({ path: `${screenshots}/payment-confirmed.png`, fullPage: true });
    for (const path of ['/inventory', '/account/orders', '/account/transactions', '/account/tokens', '/runs', '/settings/profile', '/settings/appearance', '/settings/public-profile']) {
        await page.goto(path);
        await expect(page.locator('h1').first()).toBeVisible();
    }
    await page.goto('/play');
    await page.getByRole('button', { name: /^Start run/ }).click();
    await expect(page.locator('.hud')).toBeVisible();
    await page.screenshot({ path: `${screenshots}/account-game.png` });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Consumables / Shop', exact: true }).click();
    await expect(page.getByTestId('run-inventory-close')).toBeVisible();
    await page.getByTestId('run-inventory-close').click();
    expect(internal).toContain('/internal/shop/purchases');
    expect(internal).toContain('/internal/payments/quote');
    expect(internal).toContain('/internal/payments/orders');
    expect(internal).toContain('/internal/runs');
    expect(internal.some(url => /\/runs\/[^/]+\/inventory$/.test(url))).toBe(true);
    expect(obsolete).toEqual([]);
    expect(errors).toEqual([]);
});

test('Filament and mobile landscape game render after relocation', async ({ page, browser }) => {
    const errors = errorsOn(page);
    await login(page, true);
    await page.goto('/admin');
    await expect(page.locator('h1').first()).toBeVisible();
    await page.screenshot({ path: `${screenshots}/filament.png`, fullPage: true });
    const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
    const mobile = await context.newPage();
    const mobileErrors = errorsOn(mobile);
    await mobile.addInitScript(() => { Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: undefined }); });
    await mobile.goto(`${test.info().project.use.baseURL}/play`);
    await mobile.getByRole('button', { name: /^Start run/ }).click();
    await expect(mobile.locator('.hud')).toBeVisible();
    await mobile.screenshot({ path: `${screenshots}/mobile-landscape.png` });
    expect(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(mobileErrors).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
});
