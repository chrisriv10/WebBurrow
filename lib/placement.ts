import type { Archetype, BookmarkObject } from './types';

export const ROOM_BOUNDS = { minX:-7.25, maxX:7.25, minZ:-7.6, maxZ:7.25 } as const;
const PORTAL_ZONE = { x:0, z:-7.45, radius:2.15 };
const SPAWN_ZONE = { x:0, z:6.65, radius:1.3 };

const FOOTPRINTS:Record<Archetype,number> = {
  terminal:.95, tv:1.4, book:.72, poster:.82, arcade:.92,
  pedestal:.78, laptop:.82, radio:.72, 'file-box':.72,
};

export type PlacementResult = {
  position:[number,number,number];
  valid:boolean;
  reason?:string;
};

export function snapValue(value:number,step=.5) {
  return Math.round(value/step)*step;
}

export function footprintFor(archetype:Archetype) {
  return FOOTPRINTS[archetype];
}

export function validatePlacement(
  object:Pick<BookmarkObject,'id'|'roomId'|'archetype'>,
  desired:[number,number,number],
  roomObjects:BookmarkObject[],
):PlacementResult {
  const x=Math.max(ROOM_BOUNDS.minX,Math.min(ROOM_BOUNDS.maxX,snapValue(desired[0])));
  const z=Math.max(ROOM_BOUNDS.minZ,Math.min(ROOM_BOUNDS.maxZ,snapValue(desired[2])));
  const position:[number,number,number]=[x,0,z];
  const footprint=footprintFor(object.archetype);
  if(Math.hypot(x-PORTAL_ZONE.x,z-PORTAL_ZONE.z)<PORTAL_ZONE.radius+footprint) {
    return {position,valid:false,reason:'Keep the Burrow Lift approach clear.'};
  }
  if(Math.hypot(x-SPAWN_ZONE.x,z-SPAWN_ZONE.z)<SPAWN_ZONE.radius+footprint) {
    return {position,valid:false,reason:'Keep the arrival area clear.'};
  }
  const overlap=roomObjects.find(candidate=>candidate.id!==object.id&&Math.hypot(candidate.position[0]-x,candidate.position[2]-z)<footprintFor(candidate.archetype)+footprint+.35);
  if(overlap) return {position,valid:false,reason:`That placement overlaps ${overlap.name}.`};
  return {position,valid:true};
}

export function firstValidPlacement(roomId:string,archetype:Archetype,objects:BookmarkObject[]):[number,number,number] {
  const candidates:[number,number,number][]=[[-5,0,-3],[-2.5,0,-4],[2.5,0,-4],[5,0,-3],[-5,0,.5],[-2.5,0,1.5],[2.5,0,1.5],[5,0,.5],[-5,0,4],[5,0,4],[0,0,3.5]];
  const roomObjects=objects.filter(object=>object.roomId===roomId);
  const probe={id:'__placement-probe',roomId,archetype};
  return candidates.find(position=>validatePlacement(probe,position,roomObjects).valid)??[0,0,3.5];
}

export function interactionPoint(object:BookmarkObject):[number,number,number] {
  const distance=footprintFor(object.archetype)+1.25;
  const x=Math.max(ROOM_BOUNDS.minX,Math.min(ROOM_BOUNDS.maxX,object.position[0]+Math.sin(object.rotation)*distance));
  const z=Math.max(ROOM_BOUNDS.minZ,Math.min(ROOM_BOUNDS.maxZ,object.position[2]+Math.cos(object.rotation)*distance));
  return [x,1.1,z];
}
