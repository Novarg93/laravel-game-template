import { ABILITIES } from '../abilities/definitions';
import { ENEMIES, isBossKind } from '../config/enemyDefinitions';
import { BALANCE } from '../config/gameBalance';
import { HEROES } from './heroes';
import type { EnemyDefinition, GameDefinition } from './types';

function requireRule(condition: unknown, error: string): asserts condition {
    if (!condition) throw new Error(error);
}

const idPattern = /^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/;
const number = (value: number, min: number, max: number) => Number.isFinite(value) && value >= min && value <= max;
const integer = (value: number, min: number, max: number) => Number.isInteger(value) && number(value, min, max);

function index<T extends { id: string }>(rows: readonly T[], label: string): Map<string, T> {
    requireRule(rows.length > 0, `No ${label} defined.`);
    const result = new Map<string, T>();
    for (const row of rows) {
        requireRule(idPattern.test(row.id) && !result.has(row.id), `Invalid or duplicate ${label} ID: ${row.id}.`);
        result.set(row.id, row);
    }
    return result;
}

export function enemyAvailable(enemy: EnemyDefinition, map: string, elapsed: number) {
    return !enemy.spawn || (enemy.spawn.maps?.includes(map) ?? true) && elapsed >= (enemy.spawn.from ?? 0);
}

export function validateGameDefinition(content: GameDefinition) {
    requireRule(idPattern.test(content.id) && content.version.startsWith(content.id + '-v') && /^.+-v[1-9][0-9]*$/.test(content.version), 'Invalid game ID or content version.');
    const heroes = index(content.heroes, 'hero');
    const skills = index(content.skills, 'ability');
    const enemies = index(content.enemies, 'enemy');
    const maps = index(content.maps, 'map');
    requireRule(heroes.get(content.defaultHero)?.public, 'The default hero must be public.');
    for (const hero of heroes.values()) {
        requireRule(Object.hasOwn(HEROES, hero.id), `Unsupported hero registration: ${hero.id}.`);
        requireRule(number(hero.hp, 1, 10000) && number(hero.speed, 1, 1500) && number(hero.armor, 0, .95), `Invalid hero stats: ${hero.id}.`);
        requireRule(['mage', 'warrior'].includes(hero.combat) && ['mage', 'warrior'].includes(hero.ultimate) && ['mage', 'warrior'].includes(hero.visual)
            && (hero.combat === 'mage' ? hero.mobility === 'blink' : hero.mobility === 'dash'), `Unsupported hero capability: ${hero.id}.`);
        requireRule(hero.skills.length > 0 && hero.skills.length <= 5 && hero.skills.length === new Set(hero.skills).size, `Invalid ability pool: ${hero.id}.`);
        const behaviors = new Set<string>();
        for (const id of hero.skills) {
            const skill = skills.get(id);
            requireRule(skill, `Unknown ability: ${id}.`);
            requireRule((ABILITIES.find(ability => ability.id === skill.behavior)?.character ?? 'mage') === hero.combat, 'Ability behavior is not supported by the hero archetype: ' + id);
            requireRule(!behaviors.has(skill.behavior), `Duplicate ability behavior in hero pool: ${hero.id}.`);
            behaviors.add(skill.behavior);
            requireRule(skill.unlockable || Object.hasOwn(hero.startingSkills, id), `Missing starting ability: ${id}.`);
        }
        requireRule(Object.keys(hero.startingSkills).length > 0, `Missing starting ability for ${hero.id}.`);
        for (const [id, rank] of Object.entries(hero.startingSkills)) {
            requireRule(hero.skills.includes(id) && integer(rank, 1, skills.get(id)?.maxRank ?? 0), `Invalid starting ability: ${id}.`);
        }
    }
    for (const skill of skills.values()) {
        const behavior = ABILITIES.find(def => def.id === skill.behavior);
        requireRule(behavior && skill.visual === skill.behavior, `Unsupported ability behavior or visual: ${skill.id}.`);
        requireRule(number(skill.cooldown, .05, 300) && integer(skill.maxRank, 1, 5)
            && number(skill.damageMultiplier ?? 1, .1, 10)
            && (skill.radiusMultiplier === undefined || ['frost', 'meteor'].includes(skill.behavior) && number(skill.radiusMultiplier, .1, 3))
            && (skill.evolutionRank === undefined || (!behavior.character && integer(skill.evolutionRank, 1, skill.maxRank))), `Invalid rank or cooldown: ${skill.id}.`);
    }
    for (const enemy of enemies.values()) {
        requireRule(Object.hasOwn(ENEMIES, enemy.behavior) && Object.hasOwn(ENEMIES, enemy.visual), `Unsupported enemy behavior or visual: ${enemy.id}.`);
        const category = enemy.behavior === 'ashGuard' ? 'final-boss' : enemy.behavior === 'guardian' ? 'guardian' : isBossKind(enemy.behavior) ? 'miniboss' : 'regular';
        requireRule(enemy.category === category && (category === 'regular' ? !isBossKind(enemy.visual) && enemy.visual !== 'guardian' : (category === 'miniboss' || enemy.id === enemy.behavior) && enemy.visual === enemy.behavior && !enemy.elite), `Unsupported enemy category or special encounter: ${enemy.id}.`);
        if (enemy.spawn) {
            const allowedMaps = enemy.spawn.maps ?? [...maps.keys()];
            requireRule(category === 'regular' && allowedMaps.length > 0 && new Set(allowedMaps).size === allowedMaps.length
                && allowedMaps.every(id => maps.has(id)) && number(enemy.spawn.from ?? 0, 0, 86400), 'Invalid enemy spawn restriction: ' + enemy.id);
        }
        requireRule(number(enemy.hp, 1, 1e6) && number(enemy.speed, 0, 400) && number(enemy.damage, 0, 1000)
            && number(enemy.radius, 1, 128) && integer(enemy.xp, 0, 2000) && integer(enemy.score, 1, 100000), `Invalid enemy stats: ${enemy.id}.`);
    }
    requireRule(![...enemies.values()].some(enemy => enemy.behavior === 'splitter') || enemies.get('grunt')?.category === 'regular', 'Splitter behavior requires a grunt offspring definition.');
    requireRule([...maps.values()].every(map => map.presentation.artPack === 'grove'), 'Unsupported map art pack.');
    requireRule(integer(content.limits.maxLevel, 1, 70) && integer(content.limits.regularCap, 1, BALANCE.regularCap), 'Invalid gameplay limits.');
    requireRule(['grove', 'fixed'].includes(content.pacing) && content.waves[0]?.from === 0, 'Invalid pacing or initial wave.');
    for (const curve of [content.scaling.hp, content.scaling.damage]) {
        requireRule(number(curve.seconds, .05, 86400) && number(curve.cap, 0, 10) && number(curve.step, 0, 2), 'Invalid difficulty scaling.');
    }
    if (content.pacing === 'grove') {
        requireRule(['grunt', 'runner', 'tank', 'caster', 'rusher', 'splitter'].every(id => enemies.get(id)?.category === 'regular'), 'Grove late pacing requires its six regular enemy definitions.');
    }
    if (content.practice) {
        requireRule(heroes.get('mage')?.public && maps.has('grove') && ['ashGuard', 'guardian', 'charger', 'sorcerer', 'eclipse'].every(id => enemies.has(id)), 'The original practice sequences require Mage, Grove and their encounter definitions.');
    }
    let previous = -1;
    for (const wave of content.waves) {
        requireRule(number(wave.from, 0, 86400) && wave.from > previous && number(wave.interval, .1, 3600)
            && integer(wave.cap, 1, content.limits.regularCap) && integer(wave.burst, 1, 20) && number(wave.elite, 0, 1), `Invalid wave: ${wave.name}.`);
        previous = wave.from;
        let total = 0;
        for (const [id, weight] of Object.entries(wave.weights)) {
            requireRule(enemies.get(id)?.category === 'regular' && number(weight, 0, 1e6), `Unknown or invalid wave enemy: ${id}.`);
            total += weight;
        }
        requireRule(total > 0, 'A wave must have a positive enemy weight.');
        for (const map of maps.keys()) {
            requireRule(Object.entries(wave.weights).some(([id, weight]) => weight > 0 && enemyAvailable(enemies.get(id)!, map, wave.from)), 'Wave has no eligible enemy on map ' + map + '.');
        }
    }
    if (content.encounters.kind === 'milestones') {
        previous = -1;
        for (const event of content.encounters.milestones) {
            requireRule(number(event.at, .05, 86400) && event.at > previous && integer(event.guardians, 0, 3)
                && event.bosses.length <= 3 && new Set(event.bosses).size === event.bosses.length && (event.bosses.length || event.guardians) && event.bosses.every(id => enemies.get(id)?.category === 'miniboss')
                && (!event.guardians || enemies.has('guardian')), 'Invalid boss or guardian milestone.');
            previous = event.at;
        }
    } else {
        requireRule(content.encounters.kind === 'grove' && ['charger', 'sorcerer', 'eclipse', 'guardian'].every(id => enemies.has(id)), 'Unsupported grove encounter schedule.');
    }
    const win = content.victory;
    requireRule(number(win.at, .05, 86400) && (win.kind === 'duration' || win.kind === 'final-boss'
        && win.behavior === 'ash-warden' && enemies.get(win.enemy)?.category === 'final-boss' && enemies.has('guardian')), 'Unsupported victory rule.');
    return content;
}

export function validateRegistry(definitions: readonly GameDefinition[]) {
    const versions = new Set<string>();
    const games = new Set<string>();
    for (const definition of definitions) {
        validateGameDefinition(definition);
        requireRule(!versions.has(definition.version) && !games.has(definition.id), `Duplicate active game or content version: ${definition.version}.`);
        games.add(definition.id);
        versions.add(definition.version);
    }
}
