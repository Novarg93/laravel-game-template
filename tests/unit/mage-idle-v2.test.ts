import { expect,it } from 'vitest';

import { MAGE_IDLE,MAGE_IDLE_TEXTURE,mageIdleSelection } from '../../game/art/mageIdlePack';

import { MAGE_HERO } from '../../game/art/mageHeroPack';

it('uses exactly two views and mirrors the agreed W/SW and NE directions with reflected pivots and hands',()=>{
 for(const [direction,body,flipX]of [['south','front',false],['south-east','front',false],['east','front',false],['west','front',true],['south-west','front',true],['north','north',false],['north-west','north',false],['north-east','north',true]] as const){
  const v=mageIdleSelection(direction,.27),base=MAGE_IDLE.clips[body];expect(v).toMatchObject({body,flipX,texture:MAGE_IDLE_TEXTURE,index:2});
  expect(v.origin.x*96).toBe(flipX?96-base.pivot.x:base.pivot.x);expect(v.origin.y*96).toBe(base.pivot.y);
  expect(v.hand.x).toBe(flipX?96-base.frames[2]!.hand.x:base.frames[2]!.hand.x);expect(v.hand.y).toBe(base.frames[2]!.hand.y);
 }
});

it('preserves the authored 130ms cadence, complete 13-frame cycle and exact loop boundary',()=>{
 for(const direction of ['south','north'] as const){
  expect(mageIdleSelection(direction,-1).index).toBe(0);expect(mageIdleSelection(direction,.129999).index).toBe(0);
  for(let i=0;i<13;i++)expect(mageIdleSelection(direction,i*.13).index).toBe(i);
  expect(mageIdleSelection(direction,1.689).index).toBe(12);expect(mageIdleSelection(direction,1.69).index).toBe(0);expect(mageIdleSelection(direction,169).index).toBe(0);
 }
});

it('preserves the previous rendered hero height and anchors both views at their original soles',()=>{
 const front=MAGE_IDLE.clips.front,back=MAGE_IDLE.clips.north;
 expect((front.frames[0]!.bounds.bottom-front.frames[0]!.bounds.top+1)*MAGE_IDLE.displaySize/96).toBeCloseTo(MAGE_IDLE.visibleHeightWorld,10);
 expect(MAGE_IDLE.visibleHeightWorld).toBeCloseTo(96*MAGE_HERO.displaySize/MAGE_HERO.canvas,10);
 expect(front.pivot.y).toBe(front.frames[0]!.bounds.bottom+1);expect(back.pivot.y).toBe(back.frames[0]!.bounds.bottom+1);
});
