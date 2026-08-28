import { describe,expect,it } from 'vitest';
import { firstValidPlacement, interactionPoint, sessionWorkspacePlacement, snapValue, suggestedMount, validatePlacement } from '@/lib/placement';
import { DEMO_OBJECTS } from '@/lib/demo';

describe('room placement',()=>{
  it('snaps values to the shared half-meter grid',()=>{
    expect(snapValue(1.24)).toBe(1);
    expect(snapValue(1.26)).toBe(1.5);
  });

  it('keeps the lift and arrival approach clear',()=>{
    const source=DEMO_OBJECTS[0];
    expect(validatePlacement(source,[0,0,-7.2],[])).toMatchObject({valid:false,reason:'Keep the Burrow Lift approach clear.'});
    expect(validatePlacement(source,[0,0,6.7],[])).toMatchObject({valid:false,reason:'Keep the arrival area clear.'});
  });

  it('rejects overlapping footprints and finds a valid fallback',()=>{
    const source={...DEMO_OBJECTS[0],position:[-5,0,-3] as [number,number,number]};
    const candidate={...DEMO_OBJECTS[1],id:'candidate',roomId:source.roomId};
    expect(validatePlacement(candidate,[-5.1,0,-3.2],[source])).toMatchObject({valid:false});
    const placement=firstValidPlacement(source.roomId,candidate.archetype,[source]);
    expect(validatePlacement(candidate,placement,[source]).valid).toBe(true);
  });

  it('creates a bounded interaction point in front of an object',()=>{
    const point=interactionPoint({...DEMO_OBJECTS[0],position:[7.2,0,7.2],rotation:0});
    expect(point[0]).toBeLessThanOrEqual(7.25);
    expect(point[2]).toBeLessThanOrEqual(7.25);
    expect(point[1]).toBe(1.1);
  });

  it('chooses a compatible contextual surface without reusing an occupied anchor',()=>{
    const anchor=suggestedMount('studio','desk-monitor',[]);
    expect(anchor).toMatchObject({id:'studio-left-desk',kind:'desk'});
    const occupied={...DEMO_OBJECTS[0],mount:{kind:anchor!.kind,surfaceId:anchor!.id}};
    expect(suggestedMount('studio','desk-monitor',[occupied])?.id).toBe('studio-right-desk');
    expect(suggestedMount('studio','poster',[])?.kind).toBe('wall');
  });

  it('provides 100 stable compact workspace stations inside the Studio layout',()=>{
    const positions=Array.from({length:100},(_,index)=>sessionWorkspacePlacement(index,'studio'));
    expect(new Set(positions.map(position=>position.join(','))).size).toBe(100);
    expect(positions.every(([x,,z])=>x>=-8&&x<=8&&z>=-8.5&&z<=7.5)).toBe(true);
  });
});
