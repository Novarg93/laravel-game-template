import { expect,it,vi } from 'vitest';

import { NORTH_SLAM,northSlamAge,WARDEN_AI,wardenMeteorView,wardenMeteorWarning } from '../../game/art/ashWardenPixellabPack';

import { WARDEN,wardenPose } from '../../game/art/ashWardenPack';

import { World } from '../../game/systems/World';

import { FINAL_BOSS as C } from '../../game/config/finalBoss';

import { freezeForUltimate } from '../../game/systems/UltimateFreeze';

function tick(w:World,s:number){while(s>1e-8){const dt=Math.min(.01,s);w.step(dt);s-=dt;}}

function setup(){const w=new World(42,{spawnRate:0});w.practice=true;w.encounterDirector.nextAt=Infinity;w.elapsed=1200;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;w.finalEncounter.begin(w);tick(w,C.intro);const f=w.finalEncounter;f.nextCombo=f.nextMelee=f.nextMeteor=Infinity;return w;}

it('plays north overhead at the actual565.217ms hit, keeps32damage once, and leaves other facing clips unchanged',()=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!,archive=JSON.stringify(WARDEN);f.nextMelee=0;w.player.x=e.x;w.player.y=e.y-45;w.step(.001);expect(f.attack.meleeVariant).toBe('b');expect(f.attack.direction).toEqual({x:0,y:-1});const hurt=vi.spyOn(w,'damagePlayer'),hit=f.meleeHitTime;expect(hit).toBeCloseTo(.65/1.15);expect(f.attack.duration).toBeCloseTo(1.2/1.15);tick(w,hit-.001);expect(hurt).not.toHaveBeenCalled();tick(w,.001);expect(hurt).toHaveBeenCalledExactlyOnceWith(32);const pose=wardenPose(f);expect(pose.index).toBe(12);expect(pose.frame).toBe(NORTH_SLAM.frames[12]);expect(pose.presentationDirection).toBe('north');expect(pose.frame.flipX).toBe(false);expect(pose.frame.layers[0]!.pivot).toEqual([128,202]);tick(w,.3);expect(hurt).toHaveBeenCalledTimes(1);expect(northSlamAge(f.attack.duration,hit,f.attack.duration)).toBeCloseTo(1.043);
 for(const[x,y,clip]of [[1,0,'east-melee'],[-1,0,'west-melee'],[0,1,'south-cleave']] as const){f.attack.direction={x,y};expect(wardenPose(f).clip).toBe(clip);expect(wardenPose(f).frame.layers[0]!.texture).not.toBe('ash-warden-pixellab-v1-north');}expect(JSON.stringify(WARDEN)).toBe(archive);
});

it('keeps the accepted warning/flight/impact anchors, delays hidden strikes and lands after the full warning',()=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;w.player.x=e.x+400;w.player.y=e.y;f.nextMeteor=0;w.step(.001);const m=f.meteors[0]!;expect(m.warning).toBe(1.3);const target={x:m.x,y:m.y};expect(wardenMeteorView({...m,age:-.001})).toBeNull();expect(wardenMeteorView({...m,age:.1})).toEqual([]);expect(wardenMeteorWarning({...m,age:.1})).toMatchObject({...target,style:'crosshair',radius:C.meteorRadius});const v=wardenMeteorView({...m,age:1.15})!;expect(v).toHaveLength(1);expect(v[0]!.x).toBeGreaterThan(m.x);expect(v[0]!.y).toBeLessThan(m.y);expect((v[0]!.x-m.x)/(v[0]!.y-m.y)).toBeCloseTo(WARDEN_AI.scene.fallUnit[0]!/WARDEN_AI.scene.fallUnit[1]!);expect(v[0]!.index).toBe(4);
 w.player.x=m.x;w.player.y=m.y;f.nextMelee=Infinity;const hurt=vi.spyOn(w,'damagePlayer');tick(w,1.299);expect(hurt).not.toHaveBeenCalled();tick(w,.001);expect(m.landed).toBe(true);expect(hurt).toHaveBeenCalledExactlyOnceWith(54);expect(wardenMeteorView(m)![0]).toMatchObject({...target,id:'landing-impact'});expect(wardenMeteorView(m)![0]!.layer.pivot).toEqual([61,65]);tick(w,.49);expect(wardenMeteorView(m)![0]!.index).toBe(22);tick(w,.01);expect(f.meteors).toHaveLength(0);expect(hurt).toHaveBeenCalledTimes(1);
});

it('uses owner simulation clocks for freeze/pause and clears visuals with encounter ownership',()=>{
 const w=setup(),f=w.finalEncounter,e=f.boss!;f.attack={...f.attack,kind:'basicMelee',direction:{x:0,y:-1},age:.4,duration:C.meleeDuration/C.meleeSpeedMultiplier,meleeVariant:'b'};f.meteors=[{id:1,group:1,owner:'boss',x:300,y:300,age:1.1,landed:false,warning:1.3},{id:2,group:2,owner:'arena',x:450,y:450,age:.5,landed:false,warning:1.3}];freezeForUltimate(e,w.elapsed,w.elapsed+2);const before=wardenPose(f),boss=wardenMeteorView(f.meteors[0]!),arena=f.meteors[1]!.age;tick(w,.1);expect(wardenPose(f)).toEqual(before);expect(wardenMeteorView(f.meteors[0]!)).toEqual(boss);expect(f.meteors[1]!.age).toBeCloseTo(arena+.1);w.pause();const snap=JSON.stringify(f);tick(w,.1);expect(JSON.stringify(f)).toBe(snap);w.resume();w.damageEnemy(e,1e9);expect(f.meteors).toHaveLength(0);
});
