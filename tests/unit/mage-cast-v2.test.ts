import { expect,it } from 'vitest';

import { MAGE_CAST_V2,mageCastSelectionV2 } from '../../game/art/mageCastPackV2';

import { MAGE_DIRECTIONS,MageHeroAnimation } from '../../game/art/MageHeroAnimation';

import { MageCastingController } from '../../game/art/MageCastingController';

import { World } from '../../game/systems/World';

import { ULTIMATE } from '../../game/config/ultimates';

it('maps each north direction to its own supplied clip and mirrors only west and southwest',()=>{
 for(const [direction,family,flipX]of [['north','north',false],['north-east','north-east',false],['north-west','north-west',false],['south','south',false],['south-east','south',false],['south-west','south',true],['east','east',false],['west','east',true]] as const)for(const variant of [1,2] as const)for(let i=0;i<13;i++){
  const v=mageCastSelectionV2({direction,age:0,progress:(i+.1)/13,castVariant:variant}),id=family.startsWith('north')?family:`${family}-v${variant}`;
  expect(v.id).toBe(id);expect(v.index).toBe(i);expect(v.flipX).toBe(flipX);const clip=MAGE_CAST_V2.clips[v.id];expect(v.hand.x).toBe(flipX?96-clip.frames[i]!.hand.x:clip.frames[i]!.hand.x);expect(v.origin.x*96).toBe(flipX?96-clip.pivot.x:clip.pivot.x);
 }
});

it('alternates variants per southern/eastern family, freezes a gesture and resets on a new run',()=>{
 const w=new World(11,{spawnRate:0}),a=new MageHeroAnimation(),c=new MageCastingController();a.view(w,c.view(0),false,0);
 const cast=(x:number,y:number)=>{w.elapsed+=2;c.request({ability:'fireball',rank:1,origin:{...w.player},target:{x,y}},w.elapsed);return a.view(w,c.view(w.elapsed),false,0);};
 expect(cast(0,100).castVariant).toBe(1);expect(cast(0,-100).castVariant).toBe(1);expect(cast(0,100).castVariant).toBe(2);expect(cast(100,0).castVariant).toBe(1);const second=cast(-100,0);expect(second.castVariant).toBe(2);
 const view=c.view(w.elapsed);view.directional!.target={x:0,y:-100};expect(a.view(w,view,false,0)).toMatchObject({direction:'west',castVariant:2});
 const fresh=new World(12);c.clear();a.view(fresh,c.view(0),false,0);c.request({ability:'fireball',rank:1,target:{x:100,y:0}},0);expect(a.view(fresh,c.view(0),false,0).castVariant).toBe(1);
});

it('keeps the lightning ultimate arm extended throughout its actual beam interval',()=>{
 const c=ULTIMATE.lightning,end=c.preparation+c.reveal+c.hold+c.fade;
 for(const direction of MAGE_DIRECTIONS)for(const variant of [1,2] as const)for(const age of [c.preparation+.001,(c.preparation+end)/2,end-.001]){
  const v=mageCastSelectionV2({direction,age,castAbility:'ultimate-lightning',castVariant:variant,castDuration:.975}),clip=MAGE_CAST_V2.clips[v.id];expect(v.index).toBeGreaterThanOrEqual(clip.releaseFrame);expect(v.index).toBeLessThanOrEqual(clip.holdEndFrame);
 }
 for(const direction of MAGE_DIRECTIONS)expect(mageCastSelectionV2({direction,age:.974,castAbility:'ultimate-lightning',castVariant:2,castDuration:.975}).index).toBe(12);
});

it('keeps the same variant when a long AOE resumes after the immediate shot channel',()=>{
 const w=new World(7),a=new MageHeroAnimation(),c=new MageCastingController();c.request({ability:'meteor',rank:1,target:{x:100,y:0}},0);const first=a.view(w,c.view(0),false,0);c.request({ability:'fireball',rank:1,target:{x:100,y:0}},.1);w.elapsed=.1;a.view(w,c.view(.1),false,0);c.advance(.45);w.elapsed=.45;expect(a.view(w,c.view(.45),false,0)).toMatchObject({castAbility:'meteor',castVariant:first.castVariant});
});
