import { expect,it } from 'vitest';

import { audioSampleRange,type AudioSampleId,type SampleRange } from '../../game/audio/samples';

import { AudioController } from '../../game/audio/AudioController';

import { AudioPresentation } from '../../game/audio/AudioPresentation';

import type { AudioBackend,AudioVoice } from '../../game/audio/AudioBackend';

import type { AssetId,AudioBus } from '../../game/audio/catalog';

import { World } from '../../game/systems/World';

import { freezeForUltimate } from '../../game/systems/UltimateFreeze';

import { DEFAULT_SETTINGS } from '../../game/services/storage';

class Backend implements AudioBackend{
  supported=true;running=true;now=0;
  calls:{sample?:AudioSampleId;range?:SampleRange}[]=[];active=new Set<AudioVoice>();
  async unlock(){return true;}bus(){}music(){return true;}
  start(_asset:AssetId,_bus:AudioBus,_gain:number,_rate:number,_loop:boolean,ended:()=>void,sample?:AudioSampleId,range?:SampleRange){
    const voice={gain:()=>{},stop:()=>{this.active.delete(voice);ended();}};this.active.add(voice);this.calls.push({sample,range});return voice;
  }
  stopAll(){for(const v of [...this.active])v.stop();}destroy(){this.stopAll();}
  diagnostics(){return{nodes:0,sources:this.active.size,loops:0,decodedBytes:0,rms:0};}
}

async function setup(){
  const w=new World(47,{spawnRate:0});w.practice=true;w.elapsed=1200;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;
  w.finalEncounter.begin(w);for(let i=0;i<47;i++)w.step(.05);
  const f=w.finalEncounter;f.nextCombo=f.nextMelee=f.nextMeteor=Infinity;w.sounds=[];
  const b=new Backend(),c=new AudioController(b,()=>.5),p=new AudioPresentation(c);c.settings(DEFAULT_SETTINGS);c.gesture();await Promise.resolve();await Promise.resolve();p.observe(w);b.calls=[];
  const observe=()=>{b.now=w.elapsed;b.stopAll();p.observe(w);};
  const step=(seconds=.05)=>{w.step(seconds);observe();};return{w,f,b,c,p,step,observe};
}

it.each([[1,0],[-1,0]])('uses swing for both horizontal variants and thrust, with one lead and one real contact (%s,%s)',async(x,y)=>{
  const {w,f,b,step,observe}=await setup(),e=f.boss!;
  for(const variant of ['b','a'] as const){
    b.calls=[];f.attack={...f.attack,kind:'approach',age:0};f.nextMelee=0;w.player.x=e.x+x*45;w.player.y=e.y+y*45;step();
    expect(f.attack.meleeVariant).toBe(variant);
    for(let i=0;i<24;i++)step();
    const swings=b.calls.filter(c=>c.sample==='warden-swing');expect(swings).toHaveLength(2);
    expect(swings[0]!.range).toEqual({offset:0,duration:.3});expect(swings[1]!.range).toEqual({offset:.3,duration:undefined});
    expect(b.calls.some(c=>c.sample==='warden-slam')).toBe(false);observe();expect(b.calls.filter(c=>c.sample==='warden-swing')).toHaveLength(2);
  }
});

it.each([[0,1],[0,-1],[1,1],[-1,-1]])('uses slam for vertical/diagonal South and North without a side swing (%s,%s)',async(x,y)=>{
  const {w,f,b,step}=await setup(),e=f.boss!;f.nextMelee=0;w.player.x=e.x+x*30;w.player.y=e.y+y*30;
  for(let i=0;i<25;i++)step();
  expect(b.calls.filter(c=>c.sample==='warden-slam')).toHaveLength(1);expect(b.calls.some(c=>c.sample==='warden-swing')).toBe(false);
});

it('holds Meteor contact through boss freeze and never repeats a fall cue or replays a cancelled meteor',async()=>{
  const {w,f,b,step,observe}=await setup();f.meteors=[{id:501,group:501,owner:'boss',x:w.player.x+150,y:w.player.y,age:1.05,warning:1.3,landed:false}];
  step();expect(b.calls.filter(c=>c.sample==='warden-meteor')).toEqual([{sample:'warden-meteor',range:{offset:0,duration:.2}}]);
  freezeForUltimate(f.boss!,w.elapsed,w.elapsed+.5);for(let i=0;i<4;i++)step();expect(f.meteors[0]!.age).toBeCloseTo(1.1);expect(b.calls.filter(c=>c.sample==='warden-meteor')).toHaveLength(1);
  delete f.boss!.ultimateFreeze;for(let i=0;i<4;i++)step();expect(b.calls.filter(c=>c.sample==='warden-meteor')).toHaveLength(2);expect(b.calls.at(-1)?.range?.offset).toBe(.2);
  f.meteors=[];observe();observe();expect(b.calls.filter(c=>c.sample==='warden-meteor')).toHaveLength(2);
});

it('preserves SFX controls and avoids doubled Charge braking or Flame Strike fan playback',async()=>{
  const{w,b,c,observe}=await setup();w.sound('final-charge');w.sound('final-stop');observe();expect(b.calls.filter(v=>v.sample==='warden-charge')).toHaveLength(1);expect(c.diagnostics().requested['final.stop']).toBeUndefined();
  b.now+=2;b.stopAll();w.sound('final-cleave');w.sound('final-cleave');new AudioPresentation(c).observe(w);expect(b.calls.filter(v=>v.sample==='warden-flamestrike')).toHaveLength(1);
  c.settings({...DEFAULT_SETTINGS,sfxVolume:0});b.now+=2;expect(c.play('final.slam')).toBe(false);c.settings(DEFAULT_SETTINGS);c.update('paused','grove');expect(c.play('final.slam')).toBe(false);c.destroy();expect(b.active.size).toBe(0);
  expect(audioSampleRange('final.impact')).toEqual({offset:.2,duration:undefined});
});
