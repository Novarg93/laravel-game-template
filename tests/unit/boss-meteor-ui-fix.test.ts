import { expect,it } from 'vitest';

import { wardenMeteorView,wardenMeteorWarning } from '../../game/art/ashWardenPixellabPack';

import type { FinalMeteor } from '../../game/systems/FinalEncounter';

const meteor:FinalMeteor={id:1,group:1,owner:'boss',x:300,y:200,age:0,warning:1.3,landed:false};

it('shows only a sparse marker before the falling meteor, with bounded progress and the real42px radius',()=>{
  expect(wardenMeteorWarning({...meteor,age:-.01})).toBeNull();expect(wardenMeteorView({...meteor,age:-.01})).toBeNull();
  for(const age of [0,.1,.65,.99]){
    const marker=wardenMeteorWarning({...meteor,age})!;
    expect(marker).toMatchObject({x:300,y:200,radius:42,style:'crosshair'});expect(marker.progress).toBeCloseTo(age/1.3);expect(marker.alpha).toBeGreaterThanOrEqual(.7);expect(marker.alpha).toBeLessThanOrEqual(.95);
    expect(wardenMeteorView({...meteor,age})).toEqual([]);
  }
  expect(wardenMeteorWarning({...meteor,age:.65,warning:2})!.progress).toBe(.325);
  expect(wardenMeteorWarning({...meteor,age:2})!.progress).toBe(1);
  expect(wardenMeteorView({...meteor,age:1.15})!.map(v=>v.id)).toEqual(['meteor-flight']);
  expect(wardenMeteorWarning({...meteor,age:1.3,landed:true})).toBeNull();
  expect(wardenMeteorView({...meteor,age:1.3,landed:true})![0]).toMatchObject({id:'landing-impact',x:300,y:200});
});
