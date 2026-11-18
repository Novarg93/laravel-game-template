import { ABILITIES } from '../abilities/definitions';
import { AVAILABLE_MAPS } from '../config/biomes';
import { ENEMIES, ENEMY_NAMES, isBossKind, type EnemyKind } from '../config/enemyDefinitions';
import { FINAL_BOSS } from '../config/finalBoss';
import { BALANCE } from '../config/gameBalance';
import { GROVE_SCALING, WAVES } from '../config/pacing';
import { RUN_LIMITS } from '../config/runLimits';
import { HEROES } from './heroes';
import type { EnemyDefinition, GameDefinition, SkillDefinition } from './types';

export const groveSkills: SkillDefinition[] = ABILITIES.map(({ character, ...skill }) => ({
    ...skill, behavior: skill.id, visual: skill.id, maxRank: 5,
    unlockable: skill.id !== 'fireball' && skill.id !== 'cleave',
    ...(!character ? { evolutionRank: 3 } : {}),
}));

export const groveEnemies: EnemyDefinition[] = (Object.keys(ENEMIES) as EnemyKind[]).map(kind => {
    const category = kind === 'ashGuard' ? 'final-boss' : kind === 'guardian' ? 'guardian' : isBossKind(kind) ? 'miniboss' : 'regular';
    return { ...ENEMIES[kind], id: kind, name: ENEMY_NAMES[kind], behavior: kind, visual: kind, category, elite: category === 'regular' };
});

export const pixelSurvivor: GameDefinition = {
    id: 'pixel-survivor', version: 'pixel-survivor-v1', experimental: false,
    heroes: [HEROES.mage, HEROES.warrior], defaultHero: 'mage',
    skills: groveSkills, enemies: groveEnemies, maps: AVAILABLE_MAPS, waves: WAVES,
    pacing: 'grove', scaling: GROVE_SCALING, encounters: { kind: 'grove' }, practice: true,
    victory: { kind: 'final-boss', at: FINAL_BOSS.at, enemy: 'ashGuard', behavior: 'ash-warden' },
    limits: { maxLevel: RUN_LIMITS.maxLevel, regularCap: BALANCE.regularCap },
};

export const trainingGrove: GameDefinition = {
    id: 'training-grove', version: 'training-grove-v1', experimental: true,
    heroes: [HEROES.scout], defaultHero: 'scout',
    skills: [{ ...groveSkills[0], id: 'trail-spark', name: 'Trail Spark', description: 'A slower, lighter fireball for the training route.', cooldown: 1, maxRank: 3, damageMultiplier: .9 },
        ...groveSkills.filter(skill => skill.id === 'frost' || skill.id === 'shield')],
    enemies: [...groveEnemies.filter(enemy => enemy.id === 'runner' || enemy.id === 'charger'), {
        ...groveEnemies.find(enemy => enemy.id === 'grunt')!, id: 'bramble', name: 'Bramble',
        hp: 12, speed: 44, damage: 7, xp: 8, score: 15, visual: 'runner',
    }],
    maps: [{ ...AVAILABLE_MAPS[0], id: 'trial-grove', name: 'Training Grove' }],
    waves: [
        { from: 0, name: 'Opening Trail', interval: 1.25, burst: 1, cap: 12, elite: 0, weights: { bramble: 1 } },
        { from: 8, name: 'Bramble Rush', interval: .7, burst: 2, cap: 20, elite: .1, weights: { bramble: 4, runner: 1 } },
    ],
    pacing: 'fixed', scaling: { hp: { seconds: 10, cap: 2, step: .2 }, damage: { seconds: 10, cap: 2, step: .15 } },
    encounters: { kind: 'milestones', milestones: [{ at: 12, label: 'Trail Challenge', bosses: ['charger'], guardians: 0 }] },
    practice: false, victory: { kind: 'duration', at: 20 }, limits: { maxLevel: 8, regularCap: 20 },
};
