import { expect,it,vi } from 'vitest';

import { World } from '../../game/systems/World';

import { GuardianAnimation } from '../../game/art/GuardianAnimation';

import { guardianDuration,guardianFrame,guardianWindupFrame } from '../../game/art/guardianPack';

import { freezeForUltimate } from '../../game/systems/UltimateFreeze';

import { drawEnrageDanger } from '../../game/art/EncounterArt';

import { astralRevenantViews } from '../../game/art/AstralRevenantArt';

function setup(){const w=new World(42,{spawnRate:0});w.elapsed=20;w.encounterDirector.nextAt=Infinity;w.player.invulnerableUntil=Infinity;for(const a of Object.values(w.abilities))a.level=0;const e=w.spawn('guardian',{x:120,y:0})!,art=new GuardianAnimation();art.prepare(w);return{w,e,art};}

function tick(w:World,art:GuardianAnimation,seconds:number){for(let t=0;t<seconds-1e-8;t+=.025){art.prepare(w);w.step(Math.min(.025,seconds-t));for(const e of w.guardians)art.frame(e,w);art.finish(w);}}

it('loops all13 idle frames and splits the complete cast exactly at projectile release',()=>{
  for(let i=0;i<13;i++)expect(guardianFrame('idle',i*.13+.001)).toBe(`guardian-idle-${i}`);
  expect(guardianFrame('idle',1.69)).toBe('guardian-idle-0');expect(guardianWindupFrame(-1)).toBe('guardian-cast-0');expect(guardianWindupFrame(1)).toBe('guardian-cast-5');
  for(let i=0;i<6;i++)expect(guardianWindupFrame((i+.1)/6)).toBe(`guardian-cast-${i}`);
  for(let i=6;i<13;i++)expect(guardianFrame('release',(i-6)*.13+.001)).toBe(`guardian-cast-${i}`);
  expect(guardianFrame('release',10)).toBe('guardian-cast-12');expect(guardianDuration('release')).toBeCloseTo(.91);
});

it('runs real awakening→warning→release→idle, without hits restarting casts or world writes',()=>{
  const {w,e,art}=setup();expect(art.frame(e,w)).toBe('guardian-idle-0');tick(w,art,.5);expect(art.frame(e,w)).toBe('guardian-cast-0');
  tick(w,art,.3);const frame=art.frame(e,w);expect(frame).toMatch(/^guardian-cast-/);w.damageEnemy(e,1);const before=JSON.stringify(w);expect(art.frame(e,w)).toBe(frame);expect(JSON.stringify(w)).toBe(before);
  tick(w,art,.3);expect(art.frame(e,w)).toBe('guardian-cast-6');expect(w.projectiles[0]?.appearance).toBe('astral-volley');
  tick(w,art,.92);expect(art.frame(e,w)).toMatch(/^guardian-idle-/);expect(e).toMatchObject({x:120,y:0});
});

it('pauses idle/release owner clocks during freeze and resumes without jumping or emitting phantom releases',()=>{
  const {w,e,art}=setup();tick(w,art,1.2);const before=art.frame(e,w);freezeForUltimate(e,w.elapsed,w.elapsed+.5);tick(w,art,.5);expect(art.frame(e,w)).toBe(before);tick(w,art,.14);expect(art.frame(e,w)).not.toBe(before);
  w.pause();const frozen=art.frame(e,w);tick(w,art,.4);expect(art.frame(e,w)).toBe(frozen);w.resume();
  e.finalRole='guardian';const support={id:e.id,clock:0,next:2,warning:false};w.finalEncounter.supports.set(e.id,support);art.clear();art.prepare(w);
  e.shootingAt=w.elapsed;support.next=10;expect(art.frame(e,w)).toBe('guardian-cast-6');
  tick(w,art,.14);const release=art.frame(e,w);freezeForUltimate(e,w.elapsed,w.elapsed+.5);tick(w,art,.5);expect(art.frame(e,w)).toBe(release);
});

it('shares Astral projectile art/impact while retaining homing, hit damage, owner cleanup and pooling',()=>{
  const {w,e,art}=setup();tick(w,art,1.1);const p=w.projectiles[0]!;expect(p.appearance).toBe('astral-volley');expect(p.homing?.variant).toBe('slow');
  const graphics={fillStyle:vi.fn().mockReturnThis(),fillRect:vi.fn().mockReturnThis()};drawEnrageDanger(graphics as unknown as Parameters<typeof drawEnrageDanger>[0],w);expect(graphics.fillRect).not.toHaveBeenCalled();
  w.player.invulnerableUntil=0;p.x=w.player.x;p.y=w.player.y;const hp=w.player.hp;tick(w,art,.025);expect(w.player.hp).toBe(hp-p.damage);expect(w.projectiles).toHaveLength(0);
  expect(astralRevenantViews(w,1).some(v=>v.frame==='volley-impact-5')).toBe(true);expect(w.effects.some(f=>f.kind==='astral-impact'&&f.ownerId===e.id)).toBe(true);
  w.clearOwnedEffects(e.id);expect(w.effects.some(f=>f.ownerId===e.id)).toBe(false);
  w.shoot({x:200,y:0,vx:1,vy:0,damage:1,hostile:true});expect(w.projectiles[0]!.appearance).toBeUndefined();expect(w.projectiles[0]!.homing).toBeUndefined();
});
