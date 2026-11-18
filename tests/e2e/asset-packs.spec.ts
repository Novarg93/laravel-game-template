import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { FINAL_BOSS } from '../../game/config/finalBoss';
import { permanentBonuses } from '../../game/platform/progression';

const folder = 'screenshots/asset-packs';
mkdirSync(folder, { recursive: true });

async function openPack(page: Page, params: string) {
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
    await page.goto('/?test=1&' + params);
    await expect.poll(async () => {
        await page.clock.runFor(32);
        return page.evaluate(() => window.__PIXEL__?.world.status);
    }).toBe('menu');
}

test('Training Foundry renders independent actors, projectile, terrain, pickups, HUD and samples', async ({ page }) => {
    const errors: string[] = [];
    const requests: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push(request.url()));
    await openPack(page, 'content=training-grove&pack=training-reskin');
    const read = () => page.evaluate(() => window.__PIXEL__!.pack());
    await expect(page.locator('#app')).toHaveAttribute('data-active-asset-pack', 'training-reskin');
    await expect(page.getByRole('button', { name: /^Scout/ })).toBeVisible();
    expect((await read()).manifest?.hero).toMatchObject({ id: 'scout', texture: 'pack:training-reskin:v1:scout' });
    expect((await read()).manifest?.terrain).toBe('pack:training-reskin:v1:foundry');
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().samplesPending)).toBe(0);
    await page.getByRole('button', { name: /^Start run/ }).click();
    await page.keyboard.down('d');
    await page.clock.runFor(160);
    await page.keyboard.up('d');
    expect((await read()).manifest?.hero?.texture).toBe('pack:training-reskin:v1:scout-walk');
    const enemy = await page.evaluate(() => {
        const w = window.__PIXEL__!.world;
        w.player.invulnerableUntil = 100;
        w.dropXp({ x: w.player.x + 80, y: w.player.y + 50 }, 4);
        w.loot.spawnChest(w, { x: w.player.x + 85, y: w.player.y - 40 }, 'timed');
        return w.spawn('bramble', { x: w.player.x + 150, y: w.player.y })!.id;
    });
    await page.clock.runFor(96);
    const actors = (await read()).actors;
    const xpFrame = await page.evaluate(() => `xp-idle-${Math.floor(window.__PIXEL__!.world.elapsed * 6) % 3}`);
    expect(actors).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: enemy, texture: 'pack:training-reskin:v1:bramble', width: 21, height: 17 }),
        expect.objectContaining({ texture: 'pack:training-reskin:v1:trail-beam', width: 25, height: 6 }),
        expect.objectContaining({ texture: 'pack:training-reskin:v1:salvage-xp', frame: xpFrame }),
        expect.objectContaining({ texture: 'pack:training-reskin:v1:salvage-crate', frame: 0 }),
    ]));
    await page.clock.runFor(176);
    const animated = (await read()).actors.find(actor => actor.texture.endsWith(':salvage-xp'));
    expect(animated?.frame).not.toBe(xpFrame);
    await expect(page.locator('.skill-dock')).toContainText('⟫');
    await expect(page.getByRole('complementary', { name: 'Local radar' })).toBeVisible();
    await page.screenshot({ path: folder + '/training-foundry.png' });
    await expect.poll(() => page.evaluate(() => window.__PIXEL__!.audio().packPlays)).toBeGreaterThan(0);
    await page.clock.runFor(700);
    expect(await page.evaluate(() => window.__PIXEL__!.world.kills)).toBeGreaterThan(0);
    expect((await read()).manifest?.effects).toBeGreaterThan(0);
    await page.evaluate(() => { const w = window.__PIXEL__!.world; w.gainXp(w.snapshot().xpNext); });
    await page.clock.runFor(128);
    await expect(page.getByRole('dialog', { name: 'Level up', exact: true })).toBeVisible();
    await page.locator('.choice').first().click();
    await page.clock.runFor(460);
    expect(await page.evaluate(() => window.__PIXEL__!.world.status)).toBe('playing');
    const health = await page.evaluate(() => {
        const w = window.__PIXEL__!.world;
        const hp = w.player.hp;
        w.player.invulnerableUntil = 0;
        w.damagePlayer(30);
        return hp;
    });
    await page.clock.runFor(64);
    expect(await page.evaluate(() => window.__PIXEL__!.world.player.hp)).toBeLessThan(health);
    expect((await read()).manifest?.hero?.texture).toBe('pack:training-reskin:v1:scout-hurt');
    await page.evaluate(() => {
        const w = window.__PIXEL__!.world;
        w.player.invulnerableUntil = 0;
        w.damagePlayer(1e9);
    });
    await page.clock.runFor(128);
    await expect(page.getByRole('heading', { name: 'Run ended' })).toBeVisible();
    const before = await read();
    expect(before.manifest?.hero?.texture).toBe('pack:training-reskin:v1:scout-death');
    await page.getByRole('button', { name: 'Play again', exact: true }).click();
    await page.clock.runFor(128);
    const after = await read();
    expect(after.manifest?.keys).toEqual(before.manifest?.keys);
    expect(after.actors).toHaveLength(0);
    expect(after.manifest?.tracked).toBe(0);
    expect(requests.filter(url => url.includes('/game-assets/hd/'))).toHaveLength(3);
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(errors).toEqual([]);
});

test('primitive Warden renders on mobile without loading the approved atlases and reuses textures on scene restart', async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
    const requests: string[] = [];
    page.on('request', request => requests.push(request.url()));
    try {
        await openPack(page, 'pack=primitive');
        await page.getByRole('button', { name: /Fight the Warden/ }).tap();
        await expect(page.locator('.final-boss-bar')).toHaveAttribute('data-phase', 'intro');
        await page.clock.runFor(Math.ceil(FINAL_BOSS.intro * 1000) + 128);
        await expect(page.locator('.final-boss-bar')).toHaveAttribute('data-phase', 'phase1');
        const before = await page.evaluate(() => window.__PIXEL__!.pack());
        expect(before.actors).toContainEqual(expect.objectContaining({ texture: 'pack:primitive:v1:warden' }));
        expect(requests.filter(url => url.includes('/game-assets/hd/'))).toEqual([]);
        await page.screenshot({ path: folder + '/primitive-warden-mobile.png' });
        await page.evaluate(() => window.__PIXEL__!.restartScene());
        await page.clock.runFor(128);
        await expect(page.getByRole('button', { name: /Fight the Warden/ })).toBeVisible();
        const after = await page.evaluate(() => window.__PIXEL__!.pack());
        expect(after.textures).toEqual(before.textures);
        expect(after.manifest?.effects).toBe(0);
        expect(after.actors).toEqual([]);
        await expect(page.locator('canvas')).toHaveCount(1);
    } finally {
        await page.close();
    }
});

test('a missing pack atlas stops startup with a readable error', async ({ page }) => {
    await page.route('**/game-assets/hd/loot.json', route => route.abort());
    await page.goto('/?content=training-grove&pack=training-reskin');
    await expect(page.getByRole('alert')).toContainText('Asset pack training-reskin: Could not load texture salvage-xp');
    await expect(page.getByRole('button', { name: /^Start run/ })).toHaveCount(0);
});

test('the browser produces identical seeded gameplay under the classic and Training Foundry packs', async ({ page }) => {
    const run = async (pack: string) => {
        await openPack(page, 'content=training-grove&pack=' + pack);
        await page.clock.runFor(960);
        await page.evaluate(async bonuses => {
            const moduleUrl = '/game/events/bridge.ts';
            const { commands }: typeof import('../../game/events/bridge') = await import(moduleUrl);
            commands.emit({ type: 'restart', character: 'scout', biome: 'trial-grove',
                platformRun: { clientRunId: 'asset-test-seed', seed: 31415, bonuses } });
            commands.emit({ type: 'move', input: { x: 1, y: .2 } });
        }, permanentBonuses());
        await page.clock.runFor(1472);
        return page.evaluate(() => {
            const w = window.__PIXEL__!.world;
            return { snapshot: w.snapshot(), player: w.player, enemies: w.enemies, shots: w.projectiles, rng: w.rng.next() };
        });
    };
    const legacy = await run('pixel-survivor');
    const reskinned = await run('training-reskin');
    expect(reskinned).toEqual(legacy);
});
