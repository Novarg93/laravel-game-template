import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { gameDefinition, publicHeroes } from '../../game/content/registry';
import { validateGameDefinition, validateRegistry } from '../../game/content/validation';
import { World } from '../../game/systems/World';
import { applyUpgrade, eligibleUpgrades } from '../../game/systems/UpgradeSystem';
import { runRecord, validRecord } from '../../game/services/storage';

const training = gameDefinition('training-grove');
const createTraining = () => new World(31415, { content: training, clientRunId: 'training' });
const trainingHero = training.heroes[0];

describe('content definitions', () => {
    it('supports separate presets with independent pools, IDs and victory rules', () => {
        expect(validateGameDefinition(training)).toBe(training);
        expect(publicHeroes(training).map(hero => hero.id)).toEqual(['scout']);
        expect(publicHeroes(gameDefinition()).map(hero => hero.id)).toEqual(['mage', 'warrior']);
        expect(() => validateRegistry([training, training])).toThrow('Duplicate active game or content version');
        expect(() => gameDefinition('unregistered')).toThrow('Unknown game content preset');
    });

    it('rejects invalid hero IDs, pools and starting ranks', () => {
        expect(() => validateGameDefinition({ ...training, heroes: [trainingHero, trainingHero] })).toThrow('duplicate hero');
        expect(() => validateGameDefinition({ ...training, heroes: [{ ...trainingHero, id: 'unregistered' }] })).toThrow('default hero');
        expect(() => validateGameDefinition({ ...training, defaultHero: 'unregistered', heroes: [{ ...trainingHero, id: 'unregistered' }] })).toThrow('Unsupported hero registration');
        expect(() => validateGameDefinition({ ...training, heroes: [{ ...trainingHero, skills: ['unknown'] }] })).toThrow('Unknown ability');
        expect(() => validateGameDefinition({ ...training, heroes: [{ ...trainingHero, startingSkills: {} }] })).toThrow('Missing starting ability');
        expect(() => validateGameDefinition({ ...training, heroes: [{ ...trainingHero, startingSkills: { 'trail-spark': 4 } }] })).toThrow('Invalid starting ability');
    });

    it('rejects invalid behavior, wave, enemy and victory references', () => {
        const wave = training.waves[0];
        const enemy = training.enemies[0];
        expect(() => validateGameDefinition({ ...training, enemies: [{ ...enemy, behavior: 'invalid' as typeof enemy.behavior }] })).toThrow('Unsupported enemy behavior');
        expect(() => validateGameDefinition({ ...training, waves: [{ ...wave, weights: { unknown: 1 } }] })).toThrow('Unknown or invalid wave enemy');
        expect(() => validateGameDefinition({ ...training, waves: [{ ...wave, interval: 0 }] })).toThrow('Invalid wave');
        expect(() => validateGameDefinition({ ...training, waves: [wave, wave] })).toThrow('Invalid wave');
        expect(() => validateGameDefinition({ ...training, encounters: { kind: 'milestones', milestones: [{ at: 2, label: 'invalid', bosses: ['charger', 'charger'], guardians: 0 }] } })).toThrow('Invalid boss or guardian milestone');
        expect(() => validateGameDefinition({ ...training, victory: { kind: 'duration', at: -1 } })).toThrow('Unsupported victory rule');
    });
});

describe('reused mechanics', () => {
    it('uses Scout stats, Bramble chase and score, and a new ID for a reused spell', () => {
        const world = createTraining();
        expect(world.player).toMatchObject({ hp: 115, speed: 152 });
        expect(world.snapshot().abilities.find(ability => ability.id === 'trail-spark')).toMatchObject({ id: 'trail-spark', level: 1 });
        const bramble = world.spawn('bramble', { x: 180, y: 0 })!;
        expect(bramble).toMatchObject({ kind: 'grunt', contentId: 'bramble', visual: 'runner', hp: 12, damage: 7, speed: 44 });
        world.step(.05);
        expect(bramble.x).toBeLessThan(180);
        world.damageEnemy(bramble, 1e4, 'fireball');
        expect(runRecord(world.snapshot())).toMatchObject({ score: 15, kills: 1, byKind: { bramble: 1, runner: 0, charger: 0 }, details: { damage: expect.arrayContaining([expect.objectContaining({ id: 'trail-spark', damage: 12 })]) } });
        expect(eligibleUpgrades(world).map(upgrade => upgrade.id)).not.toContain('rank-lightning');
        expect(applyUpgrade(world, 'rank-trail-spark')).toBe(true);
        expect(applyUpgrade(world, 'rank-trail-spark')).toBe(true);
        expect(applyUpgrade(world, 'rank-trail-spark')).toBe(false);
        expect(world.snapshot().abilities.find(ability => ability.id === 'trail-spark')?.level).toBe(3);
    });

    it('runs fixed waves, schedules a charge boss, pauses and commits duration victory', () => {
        const world = createTraining();
        world.player.invulnerableUntil = 1e6;
        const advance = (until: number) => {
            while (world.elapsed < until && !world.outcome) {
                if (world.status === 'upgrade') world.selectUpgrade(world.choices[0].id);
                world.step(.05, { x: 1, y: .2 });
            }
        };
        advance(3);
        expect(world.waveAt().name).toBe('Opening Trail');
        expect(world.enemies.some(enemy => enemy.contentId === 'bramble')).toBe(true);
        world.pause();
        const time = world.elapsed;
        world.step(.05);
        expect(world.elapsed).toBe(time);
        world.resume();
        advance(13);
        expect(world.waveAt().name).toBe('Bramble Rush');
        expect(world.bosses.some(enemy => enemy.kind === 'charger')).toBe(true);
        advance(21);
        const record = runRecord(world.snapshot());
        expect(record).toMatchObject({ outcome: 'victory', completionKind: 'survival', elapsed: 20, finalEncounter: { reached: false, killed: false } });
        expect(validRecord(record, training)).toBe(true);
        expect(validRecord(record)).toBe(false);
    });
});

// Seeded runtime recorded before the content refactor, at commit a116cb7.
const baselines = [
    ['mage', 0, '51eb180204819998ae7313b4285fca89c662ba6b8dae42dc9c81cbe209dbd46a'],
    ['mage', 179, '43b55e9bc5c886b39cfad3fcdd33a4f2987f49aae4ff80a2cdfb38c1aa71d875'],
    ['mage', 599, 'b124530634ed10a242b32d6c466308fff8c16bf3f10f32330c48825792b071d4'],
    ['mage', 899, '9b119848636e8a5f57bb784d0f8a3949fba134be4fcb9c9347f7fd6cd6459724'],
    ['mage', 1199, '6881b2bce5a2dacfd370ad39b0d2c72b188c6f4ed343364a760199fdba876a05'],
    ['warrior', 0, '5e566efcfff844319ac12152da75af8b6d2971c3676b032de0ad98f73a5b659e'],
    ['warrior', 179, 'e5e612497f851448aed811854d3c8efea15830aec227f72926dbce6fc4f1f06f'],
    ['warrior', 599, '273eff67032ff47ba7c46dd28977a533e81ec4a3223925762b9a06733395cc49'],
    ['warrior', 899, 'a15d5cbdcc034892a5df5829c9e913ca1285069bbf3a7f26b0edacbb63ef47c7'],
    ['warrior', 1199, '3c34fd8369dc1b9907d2444defd1afa633409915983a35aaeb12f8017a2e6185'],
] as const;

it.each(baselines)('matches the current %s baseline from second %i', (character, start, hash) => {
    const world = new World(31415, { character, clientRunId: 'baseline', spawnRate: 1.3 });
    world.elapsed = start;
    world.player.invulnerableUntil = 1e9;
    for (let tick = 0; tick < 240; tick++) {
        if (world.status === 'upgrade') world.selectUpgrade(world.choices[0].id);
        world.step(.05, { x: Math.cos(tick / 17), y: Math.sin(tick / 17) });
    }
    const simulation = [world.snapshot(), world.player, world.enemies, world.projectiles, world.encounterDirector.history, world.rng.next()];
    expect(createHash('sha256').update(JSON.stringify(simulation)).digest('hex')).toBe(hash);
});
