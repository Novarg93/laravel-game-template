import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const preview = process.env.TEMPLATE_CONTENT_PREVIEW === '1';

test('Guide and play use the server-selected content preset', async ({ page, browser }) => {
    await page.goto('/guide');
    if (!preview) {
        await expect(page.getByRole('heading', { name: 'Mage', exact: true })).toBeVisible();
        await page.goto('/play?content=training-grove');
        await expect(page.getByRole('button', { name: /^Warrior/ })).toBeVisible();
        await expect(page.getByRole('button', { name: /^Scout/ })).toHaveCount(0);
        return;
    }

    test.setTimeout(65_000);
    await expect(page.getByRole('heading', { name: 'Training Grove' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Scout', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bramble', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trail Spark', exact: true })).toBeVisible();

    const folder = 'screenshots/game-content';
    mkdirSync(folder, { recursive: true });
    const mobile = await browser.newPage({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    try {
        await mobile.goto('/play');
        await expect(mobile.getByRole('button', { name: /^Scout/ })).toBeVisible();
        await mobile.getByRole('button', { name: /^Start run/ }).tap();
        await expect(mobile.locator('.hud')).toBeVisible();
        await expect(mobile.locator('canvas')).toHaveCount(1);
        await mobile.screenshot({ path: folder + '/scout-mobile.png' });
    } finally {
        await mobile.close();
    }

    await page.goto('/login');
    await page.locator('#email').fill('admin@admin.admin');
    await page.locator('#password').fill('Template-test-only-2026!');
    await page.locator('button[type=submit]').last().click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/play');
    await expect(page.getByRole('button', { name: /^Scout/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /Fight the Warden/ })).toHaveCount(0);
    const registered = page.waitForResponse(response => response.url().endsWith('/internal/runs') && response.request().method() === 'POST');
    const finished = page.waitForResponse(response => /\/internal\/runs\/.+\/finish$/.test(response.url()) && response.request().method() === 'POST', { timeout: 50_000 });
    await page.getByRole('button', { name: /^Start run/ }).click();
    expect(await (await registered).json()).toMatchObject({ content_version: 'training-grove-v1', economy: { enabled: false } });
    await expect(page.locator('.content-objective')).toHaveText('Survive until 0:20.');
    await expect(page.locator('.skill-dock')).toContainText('✦');
    await page.addLocatorHandler(page.getByRole('dialog', { name: 'Level up', exact: true }), async (dialog) => {
        await page.keyboard.up('d');
        await dialog.locator('.choice').first().click();
        await page.keyboard.down('d');
    });
    await page.keyboard.down('d');
    try {
        await expect(page.locator('.run-clock')).toContainText('Bramble Rush', { timeout: 18_000 });
        await expect(page.locator('.boss-bar').first()).toBeVisible({ timeout: 14_000 });
        await page.screenshot({ path: folder + '/scout-boss.png' });
        await expect(page.getByRole('heading', { name: 'Victory!' })).toBeVisible({ timeout: 18_000 });
    } finally {
        await page.keyboard.up('d');
    }
    const receipt = await finished;
    expect(receipt.ok()).toBe(true);
    expect(await receipt.json()).toMatchObject({ status: 'accepted', account_xp: 0, character_xp: 0 });
    await page.screenshot({ path: folder + '/scout-victory.png' });
});
