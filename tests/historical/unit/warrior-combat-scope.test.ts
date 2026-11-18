import { historicalWalk } from '../../helpers/runtimePath';
import {warriorSoundsIntegration} from '../helpers/approvedWardenIntegration';
import {warriorUltimatesIntegration} from '../helpers/approvedWardenIntegration';
import {warriorBuffsIntegration} from '../helpers/approvedWardenIntegration';
import {warriorCleaveIntegration} from '../helpers/approvedWardenIntegration';
import {it,expect} from 'vitest';
import { readRuntimeFile as readFileSync } from '../../helpers/runtimeFile';
import {createHash} from 'node:crypto';
import {warriorCombatIntegration as proof,warriorSkillsIntegration,wardenApprovedHash} from '../helpers/approvedWardenIntegration';
it('changes only the seven authored presentation files and adds one legacy charge atlas page',()=>{
 const baseline=JSON.parse(readFileSync('art/generated/warrior-combat-sync-runtime-v2/runtime-baseline.json','utf8'))as Record<string,string>;
 const walk=historicalWalk;
 expect(proof.changed).toEqual(['game/art/CombatFeedback.ts','game/art/GameArt.ts','game/art/WarriorHeroAnimation.ts','game/art/WarriorMagic.ts','game/art/warriorHeroManifest.json','game/art/warriorHeroPack.ts','game/scenes/GameScene.ts']);
 expect(proof.added).toEqual(['public/game-assets/hd/warrior-hero-v1/5.json','public/game-assets/hd/warrior-hero-v1/5.png']);
 expect(proof.baselineFiles).toBe(428);expect(proof.unchanged).toBe(421);
 expect([...walk('src'),...walk('public')].sort()).toEqual([...Object.keys(baseline),...proof.added,...warriorSkillsIntegration.added,...warriorCleaveIntegration.added,...warriorBuffsIntegration.added,...warriorUltimatesIntegration.added,...warriorSoundsIntegration.added].sort());
 for(const[p,old]of Object.entries({...baseline,...proof.currentSHA256}))expect(createHash('sha256').update(readFileSync(p)).digest('hex'),p).toBe(wardenApprovedHash(p,proof.currentSHA256[p]??old));
});
