import { pixelSurvivor, trainingGrove } from './presets';
import { knownHero, type HeroId } from './heroes';
import type { GameDefinition, HeroDefinition, WaveDefinition } from './types';
import { validateRegistry } from './validation';

export const gameDefinitions = [pixelSurvivor, trainingGrove] as const;
validateRegistry(gameDefinitions);

export function gameDefinition(id = 'pixel-survivor'): GameDefinition {
    const found = gameDefinitions.find(definition => definition.id === id);
    if (!found) throw new Error(`Unknown game content preset: ${id}.`);
    return found;
}

export function heroDefinition(content: GameDefinition, id: string = content.defaultHero): HeroDefinition {
    const hero = content.heroes.find(row => row.id === id);
    if (!hero) throw new Error(`Unsupported hero ${id} for ${content.version}.`);
    return hero;
}

export function publicHeroes(content: GameDefinition) {
    return content.heroes.filter((hero): hero is HeroDefinition & { id: HeroId } => hero.public && knownHero(hero.id));
}

export function selectedHero(content: GameDefinition, value = content.defaultHero) {
    const id = publicHeroes(content).some(hero => hero.id === value) ? value : content.defaultHero;
    if (!knownHero(id)) throw new Error(`Unsupported hero: ${id}.`);
    return id;
}

export function heroSkills(content: GameDefinition, hero: HeroDefinition) {
    return content.skills.filter(skill => hero.skills.includes(skill.id)).map(({ id, ...skill }) => ({ ...skill, id: skill.behavior, contentId: id }));
}

export function configuredWave(content: GameDefinition, elapsed: number): WaveDefinition {
    for (let index = content.waves.length - 1; index > 0; index--) {
        if (content.waves[index].from <= elapsed) return content.waves[index];
    }
    return content.waves[0];
}

export function weightedEnemy(wave: WaveDefinition, random: number, available?: (id: string) => boolean) {
    const weights = Object.entries(wave.weights);
    const entries = available ? weights.filter(([id]) => available(id)) : weights;
    let roll = random * entries.reduce((sum, [, weight]) => sum + weight, 0);
    for (const [id, weight] of entries) {
        roll -= weight;
        if (roll < 0) return id;
    }
    return entries.find(([, weight]) => weight > 0)?.[0];
}

export function describeVictory(content: GameDefinition) {
    const seconds = content.victory.at;
    const time = `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
    return content.victory.kind === 'duration'
        ? `Survive until ${time}.`
        : `Survive until ${time}, then defeat ${content.enemies.find(enemy => enemy.category === 'final-boss')!.name}.`;
}
