import { expect,it } from 'vitest';

import { WARRIOR_SAMPLES,audioSampleForEvent } from '../../game/audio/samples';

import { World } from '../../game/systems/World';

import { AudioPresentation } from '../../game/audio/AudioPresentation';

import { AudioController } from '../../game/audio/AudioController';

import { DEFAULT_SETTINGS } from '../../game/services/storage';

it('maps every Warrior action independently of Mage sounds',()=>{
 const events=['cleave.swing','whirlwind.active','groundSlam.cast','bladestorm.active','ironSkin.trigger','player.dash','ultimate.banner','ultimate.earthbreaker','ultimate.ruin'] as const;
 expect(new Set(events.map(audioSampleForEvent)).size).toBe(9);
 expect(events.map(audioSampleForEvent).sort()).toEqual(Object.keys(WARRIOR_SAMPLES).sort());
 expect(audioSampleForEvent('arcaneShield.trigger')).toBe('mage-shield');
});

it.each(['banner','earthbreaker','ruin'] as const)('%s emits exactly one dedicated cue on successful activation and never the Mage shield',async kind=>{
 const w=new World(47,{character:'warrior',spawnRate:0});w.elapsed=300;w.experience.level=30;
 const c=new AudioController({supported:true,running:true,now:0,unlock:async()=>true,bus:()=>{},music:()=>true,start:()=>({gain:()=>{},stop:()=>{}}),stopAll:()=>{},destroy:()=>{},diagnostics:()=>({nodes:0,sources:0,loops:0,decodedBytes:0,rms:0})});
 c.settings(DEFAULT_SETTINGS);c.gesture();await Promise.resolve();await Promise.resolve();const p=new AudioPresentation(c);p.observe(w);
 expect(w.ultimate.choose(w,kind)).toBe(true);expect(w.ultimate.activate(w)).toBe(true);expect(w.ultimate.activate(w)).toBe(false);
 p.observe(w);p.observe(w);expect(c.diagnostics().requested[`ultimate.${kind}`]).toBe(1);expect(c.diagnostics().requested['arcaneShield.trigger']).toBeUndefined();c.destroy();
});
