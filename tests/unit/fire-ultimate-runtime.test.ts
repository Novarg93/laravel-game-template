import { expect,it } from 'vitest';

import { World } from '../../game/systems/World';

const setup=()=>{const w=new World(3,{spawnRate:0});w.elapsed=601;w.experience.level=40;w.ultimate.choose(w,'fire');w.ultimate.activate(w);return w;};

it('grows only at2/4/6/8s and emits exactly one pulse per growth, never at expiry or on repeat updates',()=>{
 const w=setup(),f=w.ultimate.fire;expect(w.sounds).toEqual(['ultimate-fire']);w.sounds=[];
 for(const [age,step]of [[1.999,0],[2,1],[2,1],[3.999,1],[4,2],[6,3],[8,4],[9.999,4],[10,4]] as const){w.elapsed=601+age;w.ultimate.update(w);expect(f.radius(w.elapsed)).toBeCloseTo(164*(1+step*.1));}
 expect(w.sounds).toEqual(Array(4).fill('ultimate-fire'));
 w.ultimate.clear();expect(f.radius(w.elapsed)).toBe(164);
});

it('heals on each world second using effective maxHP, respects pause, never resurrects, and caps bosses',()=>{
 const w=setup();w.player.maxHp=200;w.player.hp=1;
 for(let i=1;i<=5;i++){w.elapsed=601+i;w.ultimate.update(w);expect(w.player.hp).toBe(Math.min(200,1+40*i));}
 w.pause();w.player.hp=1;w.ultimate.update(w);expect(w.player.hp).toBe(1);w.resume();w.elapsed=607;w.ultimate.update(w);expect(w.player.hp).toBe(41);w.player.hp=0;w.elapsed=608;w.ultimate.update(w);expect(w.player.hp).toBe(0);
});
