import { expect,it } from 'vitest';

import { World } from '../../game/systems/World';

import { MinibossAmbience } from '../../game/audio/MinibossAmbience';

import { freezeForUltimate } from '../../game/systems/UltimateFreeze';

it('uses real Beast movement only, keeps one quiet Rune presence signal with distance attenuation and no stacking',()=>{
 const w=new World(12,{spawnRate:0}),ambience=new MinibossAmbience(),b=w.spawn('charger',{x:160,y:0})!,r=w.spawn('sorcerer',{x:170,y:0})!;
 expect(ambience.levels(w)).toEqual({'beast-walking':0,'rune-presence':.14});w.elapsed+=.1;b.x-=1;const before=JSON.stringify(w);expect(ambience.levels(w)).toEqual({'beast-walking':.12,'rune-presence':.14});expect(JSON.stringify(w)).toBe(before);expect(ambience.levels(w)['beast-walking']).toBe(.12);
 b.boss!.phase='windup';expect(ambience.levels(w)['beast-walking']).toBe(0);b.boss!.phase='approach';w.elapsed+=.1;expect(ambience.levels(w)['beast-walking']).toBe(0);
 r.x=10000;expect(ambience.levels(w)['rune-presence']).toBeCloseTo(.049);const other=w.spawn('sorcerer',{x:10000,y:0})!;expect(ambience.levels(w)['rune-presence']).toBeCloseTo(.049);other.hp=0;r.hp=0;expect(ambience.levels(w)['rune-presence']).toBe(0);
});

it('releases ambience on pause, freeze, death, removal and a fresh run without retaining owners',()=>{
 const w=new World(),a=new MinibossAmbience(),b=w.spawn('charger',{x:120,y:0})!,r=w.spawn('sorcerer',{x:100,y:0})!;a.levels(w);w.elapsed+=.1;b.x-=1;expect(a.levels(w)['beast-walking']).toBeGreaterThan(0);
 w.pause();expect(Object.values(a.levels(w))).toEqual([0,0]);w.resume();freezeForUltimate(b,w.elapsed,w.elapsed+3);freezeForUltimate(r,w.elapsed,w.elapsed+3);expect(Object.values(a.levels(w))).toEqual([0,0]);w.enemies=[];expect(Object.values(a.levels(w))).toEqual([0,0]);expect(a.tracked).toBe(0);a.levels(new World());expect(a.tracked).toBe(0);
});
