import { expect,it } from 'vitest';

import { World } from '../../game/systems/World';

import { WarriorHeroAnimation } from '../../game/art/WarriorHeroAnimation';

import { warriorUltimateBody } from '../../game/art/warriorUltimatesPack';

import { ULTIMATE as C } from '../../game/config/ultimates';

it('Banner contact synchronizes healing and the eight accepted body routes; pause, cancellation and restart are clean', () => {
  const w = new World(57, { character: 'warrior', spawnRate: 0 }), anim = new WarriorHeroAnimation();
  w.encounterDirector.nextAt = Infinity; for (const a of Object.values(w.abilities)) a.level = 0;
  w.elapsed = 300; w.experience.level = 30; w.player.hp = 20; w.facing = { x: 1, y: 0 };
  expect(w.ultimate.choose(w, 'banner')).toBe(true);
  w.warrior.pendingSpear = { releaseAt: 301, vx: 100, vy: 0, damage: 100, pierce: 3, hitRadius: 14 };
  expect(w.ultimate.activate(w)).toBe(true); expect(w.warrior.pendingSpear).toBeUndefined();
  expect(w.ultimate.casting).toBe(true); expect(w.mobility.activate(w)).toBe(false);
  const started = w.ultimate.started;
  w.elapsed = started + C.banner.windup - .001; w.ultimate.update(w);
  expect(w.ultimate.banner.active(w.elapsed)).toBe(false); expect(w.player.hp).toBe(20);
  w.pause(); w.step(1); expect(w.elapsed).toBe(started + C.banner.windup - .001); w.resume();
  w.elapsed = started + C.banner.windup; w.ultimate.update(w);
  expect(w.ultimate.casting).toBe(false); expect(w.player.hp).toBe(20);
  expect(w.ultimate.banner.active(w.elapsed)).toBe(true); expect(w.ultimate.banner.origin).toEqual({ x: 38, y: 0 });
  expect(anim.view(w, false).motion).toBe('ultimate-banner');
  for (const direction of ['south','south-east','east','north-east','north','north-west','west','south-west'] as const) {
    const p = warriorUltimateBody(direction, 'banner', C.banner.windup);
    expect(p.id).toBe(direction.startsWith('north') ? 'north-block' : 'gesture-banner');
    expect(p.index).toBe(direction.startsWith('north') ? 4 : 5);
    expect(p.flipX).toBe(['north-west','west','south-west'].includes(direction));
  }
  w.elapsed++; w.ultimate.update(w); expect(w.player.hp).toBeCloseTo(35);
  w.elapsed = started + C.banner.windup + C.banner.duration; w.ultimate.update(w);
  expect(w.ultimate.banner.active(w.elapsed)).toBe(false);
  w.clearTemporaryState(); expect(w.ultimate.selected).toBeNull(); expect(w.ultimate.banner.started).toBe(-Infinity);
});
