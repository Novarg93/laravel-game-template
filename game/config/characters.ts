import { HEROES, type HeroId } from '../content/heroes';

export type CharacterId = HeroId;
export const CHARACTERS = { mage: HEROES.mage, warrior: HEROES.warrior } as const;
