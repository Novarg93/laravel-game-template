import { gameDefinition, publicHeroes } from '../content/registry';
import type { CharacterId } from '../config/characters';

export const PUBLIC_CHARACTER = 'mage' satisfies CharacterId;
export function runCharacter(testFixture?: CharacterId, selected?: CharacterId): CharacterId { return testFixture ?? (selected && isPublicCharacter(selected) ? selected : PUBLIC_CHARACTER); }
export function isPublicCharacter(character: CharacterId) { return publicHeroes(gameDefinition()).some(hero => hero.id === character); }
