import { expect, test } from '@playwright/test';

test('standalone development serves the new content IDs and existing upgrade mechanics', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/?content=training-grove&test=1');
    await expect(page.getByRole('button', { name: /^Scout/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Training Grove' })).toBeVisible();
    await page.getByRole('button', { name: /^Start run/ }).click();
    await expect(page.locator('.content-objective')).toHaveText('Survive until 0:20.');
    await page.evaluate(() => {
        const world = window.__PIXEL__!.world;
        world.gainXp(world.snapshot().xpNext);
    });
    await expect(page.getByRole('dialog', { name: 'Level up', exact: true })).toBeVisible();
    await page.locator('.choice').first().click();
    await expect.poll(() => page.evaluate(() => window.__PIXEL__?.world.status)).toBe('playing');
    expect(await page.evaluate(() => window.__PIXEL__?.world.content.version)).toBe('training-grove-v1');
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(errors).toEqual([]);
});
