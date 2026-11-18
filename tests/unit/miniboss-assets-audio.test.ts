import { expect,it } from 'vitest';

import { World } from '../../game/systems/World';

import { MinibossAudio } from '../../game/audio/MinibossAudio';

import type { SoundEvent } from '../../game/audio/catalog';

import { freezeForUltimate } from '../../game/systems/UltimateFreeze';

function setup(){const w=new World(42,{spawnRate:0});w.elapsed=630;w.encounterDirector.nextAt=Infinity;for(const a of Object.values(w.abilities))a.level=0;const audio=new MinibossAudio(),events:SoundEvent[]=[];return{w,audio,events,observe:()=>audio.observe(w,e=>events.push(e))};}

it('casts once per real windup, shares teleport for both mages, and sounds the Astral second volley once',()=>{
 const {w,events,observe}=setup();
 for(const kind of ['sorcerer','eclipse'] as const){
  const e=w.spawn(kind,{x:180,y:0})!,b=e.boss!;observe();b.phase='windup';observe();observe();
  expect(events.at(-1)).toBe(kind==='sorcerer'?'mini.runeCast':'mini.astralCast');
  b.magic!.phase='signal';observe();const n=events.length;observe();expect(events).toHaveLength(n);
  b.magic!.teleports++;b.magic!.phase='prepare';observe();expect(events.slice(-2)).toEqual([kind==='sorcerer'?'mini.runeCast':'mini.astralCast','mini.teleport']);observe();expect(events).toHaveLength(n+2);
  if(kind==='eclipse'){b.phase='recover';b.magic!.phase=undefined;e.shootingAt=w.elapsed+.6;observe();for(let i=0;i<60;i++)observe();expect(events.at(-1)).toBe('mini.astralCast');expect(events.filter(e=>e==='mini.astralCast')).toHaveLength(3);}
 }
 expect(events.filter(e=>e==='mini.teleport')).toHaveLength(2);
});

it('synchronizes Beast charge and melee without frame spam or freeze catchup; cleans up dead owners',()=>{
 const {w,audio,events,observe}=setup(),e=w.spawn('charger',{x:20,y:0})!,b=e.boss!;observe();expect(events).toEqual(['mini.briarMelee']);
 for(let i=0;i<60;i++)observe();expect(events).toHaveLength(1);
 w.elapsed+=1.2;observe();expect(events).toHaveLength(2);b.phase='windup';observe();observe();expect(events.at(-1)).toBe('mini.briarCharge');
 b.phase='approach';freezeForUltimate(e,w.elapsed,w.elapsed+5);w.elapsed+=4;observe();expect(events).toHaveLength(3);
 w.elapsed+=1.01;observe();expect(events).toHaveLength(3);w.elapsed+=1.2;observe();expect(events.at(-1)).toBe('mini.briarMelee');
 w.enemies=[];observe();expect(audio.tracked).toBe(0);audio.clear();expect(audio.tracked).toBe(0);
});

it('plays Totem at actual release, handles final supports, pause, and does not mutate gameplay or RNG',()=>{
 const {w,audio,events,observe}=setup(),e=w.spawn('guardian',{x:180,y:0})!;w.guardianSystem.awaken(w,e);const s=w.guardianSystem.encounters.get(e.id)!;observe();expect(events).toEqual([]);
 s.orbIndex=1;const before=JSON.stringify(w);observe();observe();expect(events).toEqual(['mini.totemCast']);expect(JSON.stringify(w)).toBe(before);
 w.pause();s.orbIndex=2;observe();expect(events).toHaveLength(1);w.resume();observe();expect(events).toHaveLength(2);
 w.finalEncounter.supports.set(e.id,{id:e.id,clock:0,next:1,warning:true});observe();events.length=0;w.finalEncounter.supports.get(e.id)!.next=3;e.shootingAt=w.elapsed;observe();expect(events).toEqual(['mini.totemCast']);observe();expect(events).toHaveLength(1);
 w.status='over';observe();expect(events).toHaveLength(1);audio.clear();expect(audio.tracked).toBe(0);
});

it('does not invent a release when first observing an already advanced Totem cycle',()=>{
 const {w,events,observe}=setup(),e=w.spawn('guardian',{x:180,y:0})!;w.guardianSystem.awaken(w,e);const s=w.guardianSystem.encounters.get(e.id)!;
 s.orbIndex=1;observe();expect(events).toEqual([]);s.orbIndex=2;observe();expect(events).toEqual(['mini.totemCast']);
});
