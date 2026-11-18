import { historicalWalk } from '../../helpers/runtimePath';
import {warriorSoundsIntegration,wardenApprovedHash} from '../helpers/approvedWardenIntegration';
import { expect, it } from 'vitest';
import { readRuntimeFile as readFileSync } from '../../helpers/runtimeFile';
import { createHash } from 'node:crypto';
import { berserkSprintIntegration as proof, warriorUltimatesIntegration as later, warriorUltimatesAcceptedIntegration as accepted } from '../helpers/approvedWardenIntegration';

it('limits the Berserk sprint change to four runtime files and preserves all other runtime bytes', () => {
  const baseline = JSON.parse(readFileSync('docs/verification/berserk-sprint-v1/runtime-baseline.json', 'utf8')) as Record<string, string>;
  const walk=historicalWalk;
  expect([...walk('src'), ...walk('public')].sort()).toEqual([...Object.keys(baseline), ...later.added,...warriorSoundsIntegration.added].sort());
  const laterBaseline = JSON.parse(readFileSync('docs/verification/warrior-ultimates-v1/runtime-baseline.json', 'utf8')) as Record<string, string>;
  const acceptedBaseline = JSON.parse(readFileSync('docs/verification/warrior-ultimates-accepted-v1/runtime-baseline.json', 'utf8')) as Record<string, string>;
  const changed: string[] = [];
  for (const [file, before] of Object.entries(baseline)) {
    const current = createHash('sha256').update(readFileSync(file)).digest('hex');
    expect(current, file).toBe(wardenApprovedHash(file,accepted.currentSHA256[file] ?? later.currentSHA256[file] ?? proof.currentSHA256[file] ?? before));
    const historical = Object.hasOwn(later.currentSHA256, file) ? laterBaseline[file] : acceptedBaseline[file] ?? current;
    if (historical !== before) changed.push(file);
  }
  expect(changed.sort()).toEqual(['game/config/mobilityUpgrades.ts', 'game/systems/MobilitySystem.ts', 'game/ui/components/BuffDock.vue', 'game/ui/upgradeCards.ts']);
  expect(proof.changed).toEqual(changed); expect(proof.unchanged).toBe(449);
});
