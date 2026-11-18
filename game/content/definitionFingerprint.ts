import type { GameDefinition } from './types';

function without<T extends object, K extends keyof T>(row: T, ...keys: K[]): Omit<T, K> {
    const rules: Partial<T> = { ...row };
    for (const key of keys) delete rules[key];
    return rules as Omit<T, K>;
}

// These published versions store a hash of the full v2 object in server rules.
// Retain the same input for existing snapshots. Pack bindings live outside it.
export function contentFingerprintInput(content: GameDefinition) {
    if (content.version === 'pixel-survivor-v1' || content.version === 'training-grove-v1') return content;
    return {
        ...content,
        heroes: content.heroes.map(hero => without(hero, 'visual')),
        enemies: content.enemies.map(enemy => without(enemy, 'visual', 'color')),
        skills: content.skills.map(skill => without(skill, 'visual', 'color', 'icon')),
        maps: content.maps.map(map => without(map, 'presentation')),
    };
}
