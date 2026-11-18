import { expect, test } from '@playwright/test';

test('Laravel play serves a selected pack alongside the same content version', async ({ page }) => {
    await page.goto('/play?pack=primitive');
    const root = page.locator('#app');
    await expect(root).toHaveAttribute('data-content-version', 'pixel-survivor-v1');
    await expect(root).toHaveAttribute('data-active-asset-pack', 'primitive');
    await page.getByRole('button', { name: /^Start run/ }).click();
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.locator('.hud')).toBeVisible();
});
