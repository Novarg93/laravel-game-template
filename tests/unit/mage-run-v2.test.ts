import { expect,it } from 'vitest';

import { MAGE_RUN_V2,mageRunDuration,mageRunMappedAge,mageRunSelection } from '../../game/art/mageRunPackV2';

import { MageRunningAnimation } from '../../game/art/MageRunningAnimation';

import { MAGE_DIRECTIONS } from '../../game/art/MageHeroAnimation';

it('maps all8 directions to three source views with only W/SW and NW mirrored',()=>{
 for(const [direction,body,flipX]of [['south','south',false],['south-east','south',false],['east','south',false],['south-west','south',true],['west','south',true],['north','north',false],['north-east','north-east',false],['north-west','north-east',true]] as const)for(const motion of ['run-start','run','run-stop'] as const){
  const c=MAGE_RUN_V2.clips[body][motion],v=mageRunSelection(direction,motion,.1),pivot=MAGE_RUN_V2.clips[body].pivot;
  expect(v).toMatchObject({body,flipX,texture:'mage-run-v2'});expect(v.pivot).toEqual({x:flipX?96-pivot.x:pivot.x,y:pivot.y});
  expect(v.frame).toBe(c.frames[Math.min(1,c.frames.length-1)]!.frame);
  expect(mageRunSelection(direction,motion,c.periodMs/1000).index).toBe(motion==='run'?0:c.frames.length-1);
 }
});

it.each(MAGE_DIRECTIONS)('starts once, loops and stops/resumes %s without changing the physical player',direction=>{
 const a=new MageRunningAnimation();expect(a.current()).toBeUndefined();expect(a.view(.01,1.35,direction,true)?.motion).toBe('run-start');
 for(let i=0;i<160;i++)a.view(.01,1.35,direction,true);expect(a.current()?.motion).toBe('run');
 const old=a.current()!;expect(a.view(0,0,direction,true)).toEqual(old);a.view(.01,0,direction,false);expect(a.current()?.motion).toBe('run-stop');
 expect(a.view(0,0,direction,false)).toEqual(a.current());expect(a.view(.01,1.35,direction,true)?.motion).toBe('run');
 a.view(.01,0,direction,false);for(let i=0;i<110;i++)a.view(.01,0,direction,false);expect(a.current()).toBeUndefined();
 expect(a.view(.01,1.35,direction,true)?.motion).toBe('run-start');a.clear();expect(a.current()).toBeUndefined();
});

it('scales the repeated stride by distance, preserves phase on turns and settles short taps quickly',()=>{
 const a=new MageRunningAnimation();for(let i=0;i<140;i++)a.view(.01,1.35,'east',true);
 const p=a.current()!,slow=a.view(.1,6.75,'east',true)!;expect(slow.age-p.age).toBeCloseTo(.05);
 const north=a.view(0,0,'north',true)!;expect(north.age).toBeCloseTo(mageRunMappedAge('east','north','run',slow.age));
 const turned=a.view(0,0,'north-east',true)!;expect(turned.motion).toBe('run');expect(mageRunDuration('north-east','run')).toBe(.54);
 a.clear();a.view(.01,1.35,'south',true);const end=a.view(.01,0,'south',false)!;
 expect(mageRunDuration('south','run-stop')-end.age).toBeLessThanOrEqual(.2);a.view(.2,0,'south',false);expect(a.current()).toBeUndefined();
});
