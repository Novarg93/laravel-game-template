import { ABILITIES, abilitiesFor, initialAbilities } from '../game/abilities/definitions';
import { isPublicCharacter, PUBLIC_CHARACTER } from '../game/bootstrap/publicCharacters';
import { AVAILABLE_MAPS } from '../game/config/biomes';
import { CHARACTERS, type CharacterId } from '../game/config/characters';
import { SUPPLIES, UPGRADES } from '../game/systems/UpgradeSystem';

interface ServerCatalog {
    heroIds: string[];
    pools: Record<string, string[]>;
    mapIds: string[];
    maxLevel: number;
    items: string[];
    shopItemIds: string[];
    premiumItemIds: string[];
    runItemIds: string[];
}

function distinct(ids: string[], label: string) {
    if (ids.length === 0 || new Set(ids).size !== ids.length || ids.some(id => !/^[a-z][a-z0-9_-]*$/.test(id))) {
        throw new Error(`Empty, invalid or duplicate IDs in ${label}.`);
    }
}

function sameIds(actual: string[], expected: string[], label: string) {
    distinct(actual, label);
    distinct(expected, label);
    if (actual.length !== expected.length || actual.some(id => !expected.includes(id))) {
        throw new Error(`Unsupported or missing IDs in ${label}: ${actual.join(', ')} (expected ${expected.join(', ')}).`);
    }
}

export function checkGameCatalog(server: ServerCatalog) {
    const characters = Object.keys(CHARACTERS) as CharacterId[];
    const playable = characters.filter(isPublicCharacter);
    sameIds(server.heroIds, playable, 'server/public heroes');
    sameIds(Object.keys(server.pools), playable, 'character ability pool owners');
    sameIds(server.mapIds, AVAILABLE_MAPS.map(map => map.id), 'server/playable maps');
    if (!playable.includes(PUBLIC_CHARACTER)) throw new Error('Default hero is not public.');

    distinct(ABILITIES.map(ability => ability.id), 'game abilities');
    sameIds(ABILITIES.map(ability => ability.id), playable.flatMap(hero => abilitiesFor(hero).map(ability => ability.id)), 'public ability ownership');
    distinct([...UPGRADES, ...SUPPLIES].map(upgrade => upgrade.id), 'game upgrades and supplies');
    for (const hero of playable) {
        const pool = abilitiesFor(hero);
        sameIds(server.pools[hero], pool.map(ability => ability.id), `${hero} ability pool`);
        const initial = initialAbilities(hero);
        for (const { id } of pool) {
            const rank = UPGRADES.find(upgrade => upgrade.id === `rank-${id}`);
            const unlock = UPGRADES.find(upgrade => upgrade.id === `unlock-${id}`);
            // These are the existing limits in UpgradePool and ProgressionService.
            const startsUnlocked = initial[id]?.level === 1 && !unlock;
            if (rank?.max !== 4 || (!startsUnlocked && (initial[id]?.level !== 0 || unlock?.max !== 1))) {
                throw new Error(`Invalid unlock or rank cap for ${id}; the server supports five ability ranks.`);
            }
        }
    }
    if (server.maxLevel !== 10) throw new Error('The current server progression service supports 10 permanent levels.');

    distinct(server.items, 'inventory items');
    for (const [label, ids] of [['shop', server.shopItemIds], ['premium', server.premiumItemIds], ['run items', server.runItemIds]] as const) {
        if (ids.some(id => !server.items.includes(id))) throw new Error(`Unsupported inventory reference in ${label}.`);
    }
    if (server.premiumItemIds.some(id => !server.runItemIds.includes(id))) throw new Error('Premium consumable is not a supported run item.');
}
