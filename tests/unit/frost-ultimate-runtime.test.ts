import { expect,it } from 'vitest';

import { World } from '../../game/systems/World';

import { frostUltimateNovaView,frostUltimateRuneView } from '../../game/art/frostUltimatePack';

function setup(){const w=new World(42,{spawnRate:0});w.elapsed=601;w.experience.level=40;w.ultimate.choose(w,'frost');w.ultimate.activate(w);return w;}

it('reveals a fixed-origin rune with the appearance wave, retains it during freeze and clears on end/death',()=>{
 const w=setup(),f=w.ultimate.frost;expect(frostUltimateRuneView(w,1)).toBeNull();w.elapsed=f.started+.45;expect(frostUltimateRuneView(w,1)!.reveal).toBeCloseTo(f.radius*8/220);expect(frostUltimateNovaView(w,1)).not.toBeNull();
 w.elapsed=f.started+.95;const before=JSON.stringify(w),partial=frostUltimateRuneView(w,1)!;expect(partial.reveal).toBeGreaterThan(f.radius*.5);expect(partial.reveal).toBeLessThan(f.radius);expect(JSON.stringify(w)).toBe(before);
 w.player.x=500;w.elapsed=f.started+1.5;expect(frostUltimateNovaView(w,1)).toBeNull();expect(frostUltimateRuneView(w,1)).toMatchObject({x:0,y:0,reveal:f.radius});w.pause();const view=frostUltimateRuneView(w,1);w.step(1);expect(frostUltimateRuneView(w,1)).toEqual(view);
 w.elapsed=f.endsAt;expect(frostUltimateRuneView(w,1)).toBeNull();w.elapsed=f.started+1;w.status='over';expect(frostUltimateRuneView(w,1)).toBeNull();
});
