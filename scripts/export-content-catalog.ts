import { createHash } from 'node:crypto';
import { gameDefinitions } from '../game/content/registry';
import { contentFingerprintInput } from '../game/content/definitionFingerprint';
import { MOBILITY_MAX_RANK, MOBILITY_SPECIALIZATION_LEVEL, MOBILITY_UPGRADES } from '../game/config/mobilityUpgrades';
import { ULTIMATE, ultimateDefinitions } from '../game/config/ultimates';
import { SUPPLIES, upgradesFor } from '../game/systems/UpgradeSystem';

function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : a; }

export function contentCatalogs() {
    return gameDefinitions.map(content => {
        const entry = (upgrade: (typeof SUPPLIES)[number]) => {
            const skill = content.skills.find(skill => ['unlock-', 'rank-', 'evolve-'].some(prefix => prefix + skill.id === upgrade.id));
            const mobility = MOBILITY_UPGRADES.find(item => 'mobility-' + item.id === upgrade.id);
            return {
                id: upgrade.id, max: Number.isFinite(upgrade.max) ? upgrade.max : 1000,
                rule: mobility ? 'mobility' : skill ? upgrade.id.split('-')[0] : SUPPLIES.includes(upgrade) ? 'supply' : 'stat',
                ability: skill?.id ?? null, archetype: mobility?.character ?? (upgrade.id === 'projectiles' ? 'mage' : null),
            };
        };
        const scoreStep = content.enemies.filter(enemy => enemy.elite).reduce((step, enemy) => gcd(step, 2 * enemy.score), 0) || 1;
        return {
            definitionHash: createHash('sha256').update(JSON.stringify(contentFingerprintInput(content))).digest('hex'),
            id: content.id, version: content.version, experimental: content.experimental, practice: content.practice,
            heroes: Object.fromEntries(content.heroes.map(hero => [hero.id, { name: hero.name, public: hero.public,
                skills: hero.skills, starting: hero.startingSkills, combat: hero.combat,
                ultimates: ultimateDefinitions(hero.ultimate).map(ultimate => ultimate.id),
            }])),
            skills: Object.fromEntries(content.skills.map(skill => [skill.id, { maxRank: skill.maxRank, evolutionRank: skill.evolutionRank ?? null }])),
            maps: content.maps.map(map => map.id),
            enemies: Object.fromEntries(content.enemies.map(enemy => [enemy.id, { score: enemy.score, category: enemy.category, elite: enemy.elite }])),
            scoreStep, victory: content.victory, maxLevel: content.limits.maxLevel,
            upgrades: {
                entries: [...upgradesFor(content), ...SUPPLIES].map(entry),
                mobilityLevel: MOBILITY_SPECIALIZATION_LEVEL, mobilityMax: MOBILITY_MAX_RANK,
                ultimateLevel: ULTIMATE.level, ultimateTime: ULTIMATE.time,
            },
        };
    });
}
