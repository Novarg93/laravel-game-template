import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { mockGamepads, padFocus, pressPad, stick } from '../helpers/gamepad';

mkdirSync('screenshots/laravel-first', { recursive: true });
test('relocated runtime handles movement, upgrades, real contact damage, death and restart', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/?test=1');
    await page.getByRole('button', { name: /^Start run/ }).click();
    await expect.poll(() => page.evaluate(() => window.__PIXEL__?.world.status)).toBe('playing');
    const x = await page.evaluate(() => window.__PIXEL__!.world.player.x);
    await page.keyboard.down('d'); await page.waitForTimeout(400); await page.keyboard.up('d');
    expect(await page.evaluate(() => window.__PIXEL__!.world.player.x)).toBeGreaterThan(x + 20);
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.gainXp(w.snapshot().xpNext); });
    await expect(page.getByRole('dialog', { name: 'Level up', exact: true })).toBeVisible();
    await page.locator('.choice').first().click();
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.status)).toBe('playing');
    const health = await page.evaluate(() => {
        const w = window.__PIXEL__!.world;
        const e = w.spawn('tank', { x: w.player.x + 1, y: w.player.y })!;
        e.speed = 0; e.hp = e.maxHp = 10000;
        return w.player.hp;
    });
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.player.hp)).toBeLessThan(health);
    const before = await page.evaluate(() => ({ id: window.__PIXEL__!.world.runId, listeners: window.__PIXEL__!.listeners() }));
    await page.screenshot({ path: 'screenshots/laravel-first/combat-upgrade.png' });
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.player.invulnerableUntil = 0; w.damagePlayer(1e9); });
    await page.getByRole('button', { name: 'Play again', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.runId)).not.toBe(before.id);
    expect(await page.evaluate(() => window.__PIXEL__!.listeners())).toEqual(before.listeners);
    expect(errors).toEqual([]);
});

test('relocated gamepad input and real Warden practice retain audio and boss rendering', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await mockGamepads(page);
    await page.addInitScript(() => {
        Reflect.set(window, 'templateAudioStarts', 0);
        const start = AudioBufferSourceNode.prototype.start;
        AudioBufferSourceNode.prototype.start = function (...args) {
            Reflect.set(window, 'templateAudioStarts', Number(Reflect.get(window, 'templateAudioStarts')) + 1);
            return Reflect.apply(start, this, args);
        };
    });
    await page.goto('/?test=1');
    await expect(page.locator('.play-button')).toBeVisible();
    await page.evaluate(() => window.__GAMEPAD_MOCK__.connect());
    await expect(page.getByRole('status').filter({ hasText: 'Gamepad connected' })).toBeVisible();
    await padFocus(page, page.locator('.play-button'));
    await pressPad(page, 'confirm');
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.status)).toBe('playing');
    const x = await page.evaluate(() => window.__PIXEL__!.world.player.x);
    await stick(page, 1, 0); await page.waitForTimeout(350); await stick(page, 0, 0);
    expect(await page.evaluate(() => window.__PIXEL__!.world.player.x)).toBeGreaterThan(x + 20);
    await pressPad(page, 'pause');
    await page.getByRole('button', { name: 'Main menu', exact: true }).click();
    await page.getByRole('button', { name: /Fight the Warden/ }).click();
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.world.finalEncounter.phase)).toBe('phase1');
    await expect(page.locator('.final-boss-bar')).toBeVisible();
    expect(await page.evaluate(() => window.__PIXEL__!.world.finalEncounter.boss!.maxHp)).toBe(108000);
    await expect.poll(() => page.evaluate(() => Number(Reflect.get(window, 'templateAudioStarts')))).toBeGreaterThan(0);
    await page.screenshot({ path: 'screenshots/laravel-first/boss-gamepad.png' });
    expect(errors).toEqual([]);
});
