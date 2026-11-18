import { describe, expect, it } from 'vitest';
import { gamePresentation, splitWordmark, standalonePresentation } from '../../game/presentation';
import { checkGameCatalog } from '../../scripts/check-game-catalog';
import { World } from '../../game/systems/World';

describe('game project presentation', () => {
    it('uses the generated browser-independent fallback and splits the default wordmark', () => {
        const root = { dataset: {} } as HTMLElement;
        expect(gamePresentation(root)).toStrictEqual(standalonePresentation);
        expect(splitWordmark('Pixel Survivor')).toStrictEqual(['PIXEL', 'SURVIVOR']);
        expect(splitWordmark('Aurora')).toStrictEqual(['', 'AURORA']);
    });

    it('uses Laravel presentation when supplied while leaving a seeded run unchanged', () => {
        const control = new World(71, { spawnRate: 0 });
        const other = new World(71, { spawnRate: 0 });
        const branded = { ...standalonePresentation, title: 'Aurora <Grove>', theme: 'aurora', accent: '#93b9ff' };
        const root = { dataset: { projectGame: JSON.stringify(branded) } } as unknown as HTMLElement;
        expect(gamePresentation(root)).toStrictEqual(branded);
        for (let tick = 0; tick < 40; tick++) {
            control.step(.05, { x: 1, y: 0 });
            other.step(.05, { x: 1, y: 0 });
        }
        const { runId: controlId, ...expected } = control.snapshot();
        const { runId: otherId, ...actual } = other.snapshot();
        expect(controlId).not.toBe(otherId);
        expect(actual).toEqual(expected);
    });
});

describe('game/server catalog contract', () => {
    const catalog = {
        heroIds: ['mage', 'warrior'],
        pools: { mage: ['fireball', 'frost', 'lightning', 'meteor', 'shield'], warrior: ['cleave', 'whirlwind', 'slam', 'blades', 'iron'] },
        mapIds: ['grove'],
        maxLevel: 10,
        items: ['healing_potion'],
        shopItemIds: ['healing_potion'],
        premiumItemIds: ['healing_potion'],
        runItemIds: ['healing_potion'],
    };
    it('accepts the supported hero and map contract', () => {
        expect(() => checkGameCatalog(catalog)).not.toThrow();
    });
    it.each([
        ['unsupported hero', { heroIds: ['mage', 'warrior', 'alchemist'] }, 'server/public heroes'],
        ['duplicate map', { mapIds: ['grove', 'grove'] }, 'server/playable maps'],
        ['foreign spell', { pools: { ...catalog.pools, mage: ['fireball', 'frost', 'lightning', 'meteor', 'cleave'] } }, 'mage ability pool'],
        ['unsupported progression cap', { maxLevel: 11 }, '10 permanent levels'],
        ['unknown item', { shopItemIds: ['unknown'] }, 'Unsupported inventory reference in shop'],
    ])('rejects %s', (_name, overrides, message) => {
        expect(() => checkGameCatalog({ ...catalog, ...overrides })).toThrow(message as string);
    });
});
