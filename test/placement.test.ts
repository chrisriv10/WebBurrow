import { describe,expect,it } from 'vitest';
import { firstValidPlacement, interactionPoint, migrateLayoutObjects, sessionWorkspacePlacement, snapValue, suggestedMount, validatePlacement } from '@/lib/placement';
import { DEMO_OBJECTS } from '@/lib/demo';
import { ROOM_LAYOUTS } from '@/lib/room-layouts';

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

  it('keeps secondary lounge media off the TV anchor',()=>{
    const tv=DEMO_OBJECTS.find(object=>object.id==='site-youtube')!;
    expect(suggestedMount('lounge','radio',[tv])?.id).toBe('lounge-table');

    const table=DEMO_OBJECTS.find(object=>object.id==='site-spotify')!;
    expect(suggestedMount('lounge','radio',[tv,table])?.id).toBe('lounge-shelf');
  });

  it('provides 100 stable compact workspace stations inside the Studio layout',()=>{
    const positions=Array.from({length:100},(_,index)=>sessionWorkspacePlacement(index,'studio'));
    expect(new Set(positions.map(position=>position.join(','))).size).toBe(100);
    expect(positions.every(([x,,z])=>x>=-8&&x<=8&&z>=-8.5&&z<=7.5)).toBe(true);
  });

  it('migrates layout-v2 objects deterministically into the polygonal layouts',()=>{
    const legacy=DEMO_OBJECTS.filter(object=>object.roomId==='room-home').map((object,index)=>({...object,position:[-5+index*4,0,-5+index] as [number,number,number]}));
    const first=migrateLayoutObjects('den',legacy,2),second=migrateLayoutObjects('den',legacy,2);
    expect(first.map(object=>object.position)).toEqual(second.map(object=>object.position));
    expect(first.every(object=>object.mount||validatePlacement(object,object.position,first.filter(item=>item.id!==object.id),'den').valid)).toBe(true);
  });

  it('updates layout-v3 mount heights without moving floor objects',()=>{
    const laptop={...DEMO_OBJECTS.find(object=>object.id==='site-github')!,position:[-5.55,1.08,-2.4] as [number,number,number]};
    const floor={...DEMO_OBJECTS[0],id:'floor-object',roomId:'room-dev',position:[1.37,.4,2.22] as [number,number,number]};
    const migrated=migrateLayoutObjects('studio',[laptop,floor],3);
    expect(migrated.find(object=>object.id===laptop.id)?.position).toEqual([-6.05,1.15,-2.4]);
    expect(migrated.find(object=>object.id===floor.id)?.position).toEqual([1.37,0,2.22]);
  });

  it('keeps the Lounge media console clear of the Burrow Lift opening',()=>{
    const layout=ROOM_LAYOUTS.lounge,media=layout.obstacles.find(obstacle=>obstacle.id==='media-console')!;
    expect(media.x-media.width/2).toBeGreaterThan(1.275);
    expect(layout.anchors.find(anchor=>anchor.id==='lounge-media')?.position[0]).toBe(media.x);
  });

  it('keeps the Den storage object in the open floor pocket',()=>{
    const storage=DEMO_OBJECTS.find(object=>object.id==='site-wiki')!;
    expect(validatePlacement(storage,storage.position,DEMO_OBJECTS.filter(object=>object.id!==storage.id),'den').valid).toBe(true);
    expect(storage.position[2]).toBeLessThan(-1.5);
  });
});
