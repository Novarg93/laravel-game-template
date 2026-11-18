import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import hero from '../../game/art/warriorHeroManifest.json' with { type: 'json' };

test('standalone production loads shipped atlases and restarts without a development harness', async ({ page, request }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    for (const atlas of hero.pages) {
        const response = await request.get(`/game-assets/hd/warrior-hero-v1/${atlas.index}.png`);
        expect(response.status()).toBe(200);
        expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(atlas.sha256);
    }
    await page.goto('/');
    await page.getByRole('button', { name: /^Warrior/ }).click();
    await page.getByRole('button', { name: /^Start run/ }).click();
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.locator('.hud')).toBeVisible();
    await page.keyboard.down('d');
    await page.waitForTimeout(400);
    await page.keyboard.up('d');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Pause', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Main menu', exact: true }).click();
    await page.getByRole('button', { name: /^Start run/ }).click();
    await expect(page.locator('.hud')).toBeVisible();
    await page.screenshot({ path: 'screenshots/laravel-first/standalone-production.png' });
    expect(await page.evaluate(() => window.__PIXEL__)).toBeUndefined();
    expect(errors).toEqual([]);
});
