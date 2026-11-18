import { expect,it } from 'vitest';

import { World } from '../../game/systems/World';

import { frostUltimateNovaView } from '../../game/art/FrostUltimateArt';

it('anchors the appearance pulse to cast origin, pauses and ends once without changing combat state',()=>{
 const w=new World(42,{spawnRate:0});w.experience.level=40;w.elapsed=900;w.ultimate.choose(w,'frost');w.ultimate.activate(w);
 const f=w.ultimate.frost;expect(frostUltimateNovaView(w,1)).toBeNull();
 w.player.x=800;w.player.y=-6000;
 for(let i=0;i<16;i++){w.elapsed=f.started+.45+i/16+.001;const before=JSON.stringify(w),v=frostUltimateNovaView(w,.7)!;expect(v).toMatchObject({frame:`pixel-survivor-ice-wave ${i}.png`,x:f.origin.x,y:f.origin.y,alpha:.7});expect(v.depth).toBeLessThan(w.player.y/10000);expect(JSON.stringify(w)).toBe(before);}
 w.pause();const paused=frostUltimateNovaView(w,1);w.step(5);expect(frostUltimateNovaView(w,1)).toEqual(paused);expect(frostUltimateNovaView(w,0)).toBeNull();
 w.elapsed=f.started+1.45;expect(frostUltimateNovaView(w,1)).toBeNull();w.status='over';expect(frostUltimateNovaView(w,1)).toBeNull();f.clear();expect(frostUltimateNovaView(w,1)).toBeNull();
});
