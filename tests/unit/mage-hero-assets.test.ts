import { expect,it } from 'vitest';

import { readFileSync } from 'node:fs';

import { MAGE_HERO_ORIGIN,mageHeroFrame,mageHeroSelection,MAGE_HERO as pack } from '../../game/art/mageHeroPack';

import { MAGE_DIRECTIONS,type MageMotion } from '../../game/art/MageHeroAnimation';

import { playerHealthLayout } from '../../game/art/PlayerHealthBar';

import { World } from '../../game/systems/World';

interface Frame {frame:{x:number;y:number;w:number;h:number};sourceSize:{w:number;h:number};spriteSourceSize:{x:number;y:number;w:number;h:number};trimmed:boolean;rotated:boolean}

it('ships 72 native eight-direction clips with separate running transitions and the original four south casts',()=>{
  expect(pack.complete).toBe(true);expect(pack.missing).toEqual([]);expect(Object.keys(pack.clips)).toHaveLength(72);expect(pack.frameCount).toBe(799);
  for(const motion of ['idle','run-start','run','run-stop','fireball','lightning','meteor','defensive','death'] as MageMotion[])for(const direction of MAGE_DIRECTIONS){
    const clip=(pack.clips as Record<string,{frames:string[];loop:boolean}>)[motion+'-'+direction]!;
    expect(clip.frames.length).toBe(motion==='idle'?(direction==='south'?8:1):motion==='run'?8:motion==='run-start'?4:motion==='run-stop'?5:motion==='death'?13:17);
    for(const age of [0,.01,.2,1,999])expect(mageHeroSelection({motion,direction,age,casting:false}).texture).toMatch(/^mage-hero-v2-\d+$/);
    if(!clip.loop)expect(mageHeroFrame({motion,direction,age:999,progress:1,casting:true})).toBe(clip.frames.at(-1));
  }
  expect(pack.clips['fireball-south'].sourceFiles[0]).toContain('/originals/fireball/');
  expect(pack.clips['meteor-north'].sourceFiles[0]).toContain('/attempt-02/');
  expect(pack.clips['run-start-south-west'].sourceFiles[1]).toContain('/south-west/run/');
  expect(pack.clips['run-north'].sourceFiles[0]).toContain('/run-cycle-v2/north/');
});

it('packs all frames in bounded trimmed pages with a fixed full-canvas pivot and no overlapping rectangles',()=>{
  let count=0;expect(pack.rgbaBytes).toBeLessThan(24*1024*1024);expect(pack.uniqueFrameCount).toBeLessThan(pack.frameCount);expect(MAGE_HERO_ORIGIN).toEqual({x:.5,y:126/128});expect(pack.displaySize).toBe(40);
  for(const page of pack.pages){
    const data=JSON.parse(readFileSync(`public/game-assets/hd/mage-hero-v2/${page.index}.json`,'utf8')) as {frames:Record<string,Frame>};
    const entries=Object.entries(data.frames);count+=entries.length;
    expect(page.width).toBeLessThanOrEqual(2048);expect(page.height).toBeLessThanOrEqual(2048);
    for(const [i,[name,f]]of entries.entries()){
      expect((pack.locations as Record<string,number>)[name]).toBe(page.index);expect(f.sourceSize).toEqual({w:pack.canvas,h:pack.canvas});expect(f.trimmed).toBe(true);expect(f.rotated).toBe(false);
      expect(f.frame.x+f.frame.w).toBeLessThanOrEqual(page.width);expect(f.frame.y+f.frame.h).toBeLessThanOrEqual(page.height);
      expect(f.spriteSourceSize.x+f.spriteSourceSize.w).toBeLessThanOrEqual(pack.canvas);expect(f.spriteSourceSize.y+f.spriteSourceSize.h).toBeLessThanOrEqual(pack.canvas);
      for(const [otherName,other]of entries.slice(i+1)){
        const a=f.frame,b=other.frame,aliases=pack.aliases as Record<string,string>;
        if(!(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y)){
          expect(aliases[name]??name).toBe(aliases[otherName]??otherName);expect(a).toEqual(b);
        }
      }
    }
  }
  expect(count).toBe(pack.frameCount);
});

it('places HP above both accepted hero heads without changing gameplay',()=>{
  const w=new World(8),before=JSON.stringify(w);expect(playerHealthLayout(w).y-w.player.y).toBe(-44);expect(JSON.stringify(w)).toBe(before);
  const warrior=new World(9,{character:'warrior'});expect(playerHealthLayout(warrior).y-warrior.player.y).toBe(-46);
});
