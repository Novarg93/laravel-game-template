import type { HeroDefinition } from './types';

export const HEROES = {
    mage: {
        id: 'mage', name: 'Mage', description: 'Ranged spells, crowd control and area damage.',
        hp: 100, speed: 135, armor: 0,
        skills: ['fireball', 'frost', 'lightning', 'meteor', 'shield'], startingSkills: { fireball: 1 },
        combat: 'mage', mobility: 'blink', ultimate: 'mage', visual: 'mage', public: true,
    },
    warrior: {
        id: 'warrior', name: 'Warrior', description: 'Melee combat, more health and base armor.',
        hp: 150, speed: 118, armor: .18,
        skills: ['cleave', 'whirlwind', 'slam', 'blades', 'iron'], startingSkills: { cleave: 1 },
        combat: 'warrior', mobility: 'dash', ultimate: 'warrior', visual: 'warrior', public: true,
    },
    scout: {
        id: 'scout', name: 'Scout', description: 'A fast spellcaster with a compact spell pool.',
        hp: 115, speed: 152, armor: .08,
        skills: ['trail-spark', 'frost', 'shield'], startingSkills: { 'trail-spark': 1 },
        combat: 'mage', mobility: 'blink', ultimate: 'mage', visual: 'mage', public: true,
    },
} as const satisfies Record<string, HeroDefinition>;

export type HeroId = keyof typeof HEROES;

export function heroName(id: string) {
    return knownHero(id) ? HEROES[id].name : id;
}

export function knownHero(id: unknown): id is HeroId {
    return typeof id === 'string' && Object.hasOwn(HEROES, id);
}
