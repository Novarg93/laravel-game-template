import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { FINAL_BOSS } from '../../game/config/finalBoss';
import { GAMEPAD_BUTTONS } from '../../game/input/GamepadInputController';
import { mockGamepads } from '../helpers/gamepad';

const twoFramesMs = 32;
function worldStatus(page: Page) {
    return page.evaluate(() => window.__PIXEL__?.world.status);
}

async function advanceFrames(page: Page) {
    await page.clock.runFor(twoFramesMs);
}

async function pressUntilStatus(page: Page, action: 'confirm' | 'pause', status: 'playing' | 'paused') {
    const index = GAMEPAD_BUTTONS[action];
    await page.evaluate(index => window.__GAMEPAD_MOCK__.button(index, true), index);
    try {
        await expect.poll(async () => {
            await advanceFrames(page);
            return worldStatus(page);
        }).toBe(status);
    } finally {
        await page.evaluate(index => window.__GAMEPAD_MOCK__.button(index, false), index);
        await advanceFrames(page);
    }
}

function readWardenPractice(page: Page) {
    return page.evaluate(() => {
        const { world, art } = window.__PIXEL__!;
        const encounter = world.finalEncounter;
        return {
            status: world.status, practice: world.practiceBoss, elapsed: world.elapsed,
            phase: encounter.phase, attack: encounter.attack.kind, attackAge: encounter.attack.age,
            encounterDuration: encounter.snapshot().duration, mobilityRemaining: world.mobility.remaining,
            bodyLayers: art().finalBoss.bodyImages.length,
        };
    });
}

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
    // Drive Phaser's normal animation frames in browser time. World caps each
    // simulation step, so elapsed wall time depends on the runner's rendering speed.
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
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
    await expect.poll(async () => {
        await advanceFrames(page);
        return worldStatus(page);
    }).toBe('menu');
    const playButton = page.locator('.play-button');
    await expect(playButton).toBeFocused();
    await page.evaluate(() => window.__GAMEPAD_MOCK__.connect());
    await advanceFrames(page);
    await expect(page.getByRole('status').filter({ hasText: 'Gamepad connected' })).toBeVisible();
    await pressUntilStatus(page, 'confirm', 'playing');
    const x = await page.evaluate(() => window.__PIXEL__!.world.player.x);
    await page.evaluate(() => window.__GAMEPAD_MOCK__.stick(1, 0));
    try {
        await expect.poll(async () => {
            await advanceFrames(page);
            return page.evaluate(() => window.__PIXEL__!.world.player.x);
        }).toBeGreaterThan(x + 20);
    } finally {
        await page.evaluate(() => window.__GAMEPAD_MOCK__.stick(0, 0));
    }
    await pressUntilStatus(page, 'pause', 'paused');
    const pause = page.getByRole('dialog', { name: 'Pause', exact: true });
    await expect(pause).toBeVisible();
    const pausedAt = await page.evaluate(() => window.__PIXEL__!.world.elapsed);
    await advanceFrames(page);
    expect(await page.evaluate(() => window.__PIXEL__!.world.elapsed)).toBe(pausedAt);
    await pause.getByRole('button', { name: 'Main menu', exact: true }).click();
    await expect(playButton).toBeVisible();
    expect(await worldStatus(page)).toBe('menu');
    await page.getByRole('button', { name: /Fight the Warden/ }).click();
    const bossBar = page.locator('.final-boss-bar');
    await expect(bossBar).toBeVisible();
    await expect(bossBar).toHaveAttribute('data-phase', 'intro');
    const start = await readWardenPractice(page);
    expect(start).toMatchObject({ status: 'playing', practice: 'ash-warden', phase: 'intro', attack: 'ritualEnter', mobilityRemaining: 0 });

    const halfIntroMs = Math.ceil(FINAL_BOSS.intro * 500);
    await page.clock.runFor(halfIntroMs);
    const midIntro = await readWardenPractice(page);
    expect(midIntro).toMatchObject({ status: 'playing', phase: 'intro', attack: 'ritualEnter', mobilityRemaining: 0 });
    expect(midIntro.elapsed).toBeGreaterThan(start.elapsed);
    expect(midIntro.attackAge).toBeGreaterThan(start.attackAge);
    expect(midIntro.attackAge).toBeLessThan(FINAL_BOSS.intro);

    await page.clock.runFor(halfIntroMs + twoFramesMs);
    const active = await readWardenPractice(page);
    expect(active).toMatchObject({ status: 'playing', phase: 'phase1', attack: 'approach' });
    expect(active.encounterDuration).toBeGreaterThanOrEqual(FINAL_BOSS.intro);
    expect(active.bodyLayers).toBeGreaterThan(0);
    await expect(bossBar).toHaveAttribute('data-phase', 'phase1');
    expect(await page.evaluate(() => window.__PIXEL__!.world.finalEncounter.boss!.maxHp)).toBe(108000);
    await expect.poll(async () => {
        await advanceFrames(page);
        return page.evaluate(() => Number(Reflect.get(window, 'templateAudioStarts')));
    }).toBeGreaterThan(0);
    await page.screenshot({ path: 'screenshots/laravel-first/boss-gamepad.png' });
    expect(errors).toEqual([]);
});
