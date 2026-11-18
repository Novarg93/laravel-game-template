import { expect,it } from 'vitest';

import { ASTRAL_FLAME_TEXTURE } from '../../game/art/astralFlamePixellabPack';

import { World } from '../../game/systems/World';

import { astralRevenantViews,necroticGroundViews } from '../../game/art/AstralRevenantArt';

it('retains real warning geometry, stage and damage clocks, pause and cleanup without mutating simulation from art',()=>{
 const w=new World(42,{spawnRate:0});w.elapsed=630;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;const e=w.spawn('eclipse',{x:180,y:0})!;e.boss!.magic=undefined;e.boss!.until=Infinity;w.necroticFlames.queue(w,e,w.elapsed+1);const z=w.zones[0]!,n=z.necrotic!;expect(n.activeAt-n.spawnAt).toBeCloseTo(.6);expect(n.fadeAt-n.activeAt).toBeCloseTo(3);expect(z.expires-n.fadeAt).toBeCloseTo(.6);expect(necroticGroundViews(w,1)).toHaveLength(4);expect(astralRevenantViews(w,1)).toEqual([]);
 for(const [t,prefix]of [[n.spawnAt,'spawn'],[n.activeAt,'idle'],[n.fadeAt,'vanish']] as const){w.elapsed=t;const before=JSON.stringify(w),v=astralRevenantViews(w,1);expect(v).toHaveLength(4);expect(v.every(v=>v.texture===ASTRAL_FLAME_TEXTURE&&v.frame===`eclipse-flame-ai-${prefix}-0`&&v.originX===60/128&&v.originY===116/128&&v.size===62)).toBe(true);expect(JSON.stringify(w)).toBe(before);}
 w.pause();const v=astralRevenantViews(w,1);w.step(1);expect(astralRevenantViews(w,1)).toEqual(v);w.elapsed=z.expires;expect(astralRevenantViews(w,1)).toEqual([]);w.status='over';expect(necroticGroundViews(w,1)).toEqual([]);
});
