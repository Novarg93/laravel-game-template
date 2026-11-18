import type { AbilityDefinition, AbilityId } from '../abilities/types';
import type { MapDefinition } from '../config/biomes';
import type { EnemyKind } from '../config/enemyDefinitions';

export type HeroArchetype = 'mage' | 'warrior';
export interface HeroDefinition {
    id: string;
    name: string;
    description: string;
    hp: number;
    speed: number;
    armor: number;
    skills: readonly string[];
    startingSkills: Readonly<Record<string, number>>;
    combat: HeroArchetype;
    mobility: 'blink' | 'dash';
    ultimate: HeroArchetype;
    visual: HeroArchetype;
    public: boolean;
}

export interface SkillDefinition extends Omit<AbilityDefinition, 'id' | 'character'> {
    id: string;
    behavior: AbilityId;
    visual: AbilityId;
    maxRank: number;
    unlockable: boolean;
    damageMultiplier?: number;
    radiusMultiplier?: number;
    evolutionRank?: number;
}

export interface EnemyDefinition {
    id: string;
    name: string;
    hp: number;
    speed: number;
    damage: number;
    radius: number;
    xp: number;
    score: number;
    color: number;
    behavior: EnemyKind;
    visual: EnemyKind;
    category: 'regular' | 'guardian' | 'miniboss' | 'final-boss';
    elite: boolean;
    spawn?: { maps?: readonly string[]; from?: number };
}

export interface DifficultyScaling {
    hp: { seconds: number; cap: number; step: number };
    damage: { seconds: number; cap: number; step: number };
}

export interface WaveDefinition {
    from: number;
    name: string;
    interval: number;
    burst: number;
    cap: number;
    elite: number;
    weights: Readonly<Record<string, number>>;
}

export interface EncounterMilestone {
    at: number;
    label: string;
    bosses: readonly string[];
    guardians: number;
}

export type VictoryDefinition = { kind: 'duration'; at: number } | { kind: 'final-boss'; at: number; enemy: 'ashGuard'; behavior: 'ash-warden' };

export interface GameDefinition {
    id: string;
    version: string;
    experimental: boolean;
    heroes: readonly HeroDefinition[];
    defaultHero: string;
    skills: readonly SkillDefinition[];
    enemies: readonly EnemyDefinition[];
    maps: readonly MapDefinition[];
    waves: readonly WaveDefinition[];
    pacing: 'grove' | 'fixed';
    scaling: DifficultyScaling;
    encounters: { kind: 'grove' } | { kind: 'milestones'; milestones: readonly EncounterMilestone[] };
    practice: boolean;
    victory: VictoryDefinition;
    limits: { maxLevel: number; regularCap: number };
}
