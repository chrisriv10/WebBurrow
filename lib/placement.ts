import type { Archetype, BookmarkObject, RoomTemplate } from './types';
import { ROOM_LAYOUTS, defaultMount, pointInside } from './room-layouts';

export const ROOM_BOUNDS = ROOM_LAYOUTS.studio.bounds;

const FOOTPRINTS:Record<Archetype,number> = {
  terminal:.95, tv:1.4, book:.72, poster:.82, arcade:.92,
  pedestal:.78, laptop:.82, radio:.72, 'file-box':.72,
  'desk-monitor':.92,'wall-display':1.25,tablet:.68,'compact-portal':.92,
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

export function suggestedMount(template:RoomTemplate,archetype:Archetype,objects:BookmarkObject[]){const layout=ROOM_LAYOUTS[template];return layout.anchors.find(anchor=>anchor.accepts.includes(archetype)&&!objects.some(object=>object.mount?.surfaceId===anchor.id));}

export function validatePlacement(
  object:Pick<BookmarkObject,'id'|'roomId'|'archetype'>,
  desired:[number,number,number],
  roomObjects:BookmarkObject[],
  template:RoomTemplate='den',
):PlacementResult {
  const layout=ROOM_LAYOUTS[template];const bounds=layout.bounds;
  const x=Math.max(bounds.minX,Math.min(bounds.maxX,snapValue(desired[0])));
  const z=Math.max(bounds.minZ,Math.min(bounds.maxZ,snapValue(desired[2])));
  const position:[number,number,number]=[x,0,z];
  const footprint=footprintFor(object.archetype);
  if(Math.hypot(x-layout.portal[0],z-layout.portal[2])<1.65+footprint) {
    return {position,valid:false,reason:'Keep the Burrow Lift approach clear.'};
  }
  if(Math.hypot(x-layout.spawn[0],z-layout.spawn[2])<1.3+footprint) {
    return {position,valid:false,reason:'Keep the arrival area clear.'};
  }
  if(!pointInside(bounds,x,z,footprint*.55))return{position,valid:false,reason:'Keep this object inside the walkable room.'};
  const blocked=layout.obstacles.find(obstacle=>Math.abs(x-obstacle.x)<obstacle.width/2+footprint&&Math.abs(z-obstacle.z)<obstacle.depth/2+footprint);
  if(blocked)return{position,valid:false,reason:'That position is reserved for room furniture.'};
  const overlap=roomObjects.find(candidate=>candidate.id!==object.id&&Math.hypot(candidate.position[0]-x,candidate.position[2]-z)<footprintFor(candidate.archetype)+footprint+.35);
  if(overlap) return {position,valid:false,reason:`That placement overlaps ${overlap.name}.`};
  return {position,valid:true};
}

export function firstValidPlacement(roomId:string,archetype:Archetype,objects:BookmarkObject[],template:RoomTemplate='den'):[number,number,number] {
  const layout=ROOM_LAYOUTS[template];const mount=defaultMount(template,archetype);
  const candidates:[number,number,number][]=[...(mount?[[mount.position[0],0,mount.position[2]] as [number,number,number]]:[]),[-3,0,-4],[3,0,-4],[-3.5,0,0],[3.5,0,0],[-4,0,3],[4,0,3],[0,0,2.5],[-1.5,0,-2],[1.5,0,-2]];
  for(let z=layout.bounds.minZ+1;z<=layout.bounds.maxZ-1;z+=1.25)for(let x=layout.bounds.minX+1;x<=layout.bounds.maxX-1;x+=1.25)candidates.push([snapValue(x,.25),0,snapValue(z,.25)]);
  const roomObjects=objects.filter(object=>object.roomId===roomId);
  const probe={id:'__placement-probe',roomId,archetype};
  return candidates.find(position=>validatePlacement(probe,position,roomObjects,template).valid)??[Math.max(layout.bounds.minX+1,0),0,2.5];
}

export function sessionWorkspacePlacement(index:number,template:RoomTemplate='studio'):[number,number,number]{
  const layout=ROOM_LAYOUTS[template];const candidates:[number,number,number][]=[];
  for(let z=layout.bounds.minZ+.7;z<=layout.bounds.maxZ-.7;z+=1.05)for(let x=layout.bounds.minX+.7;x<=layout.bounds.maxX-.7;x+=1.05){
    if(Math.hypot(x-layout.portal[0],z-layout.portal[2])<1.65||Math.hypot(x-layout.spawn[0],z-layout.spawn[2])<1.45)continue;
    if(layout.obstacles.some(obstacle=>Math.abs(x-obstacle.x)<obstacle.width/2+.38&&Math.abs(z-obstacle.z)<obstacle.depth/2+.38))continue;
    candidates.push([snapValue(x,.05),0,snapValue(z,.05)]);
  }
  return candidates[index%candidates.length]??[0,0,0];
}

export function interactionPoint(object:BookmarkObject,template:RoomTemplate='den'):[number,number,number] {
  const bounds=ROOM_LAYOUTS[template].bounds;
  const distance=footprintFor(object.archetype)+1.25;
  const x=Math.max(bounds.minX,Math.min(bounds.maxX,object.position[0]+Math.sin(object.rotation)*distance));
  const z=Math.max(bounds.minZ,Math.min(bounds.maxZ,object.position[2]+Math.cos(object.rotation)*distance));
  return [x,1.1,z];
}

export function migratePlacement(position:[number,number,number],template:RoomTemplate,index:number,placed:BookmarkObject[],object:Pick<BookmarkObject,'id'|'roomId'|'archetype'>){
  const old={minX:-7.25,maxX:7.25,minZ:-7.6,maxZ:7.25};const bounds=ROOM_LAYOUTS[template].bounds;
  const nx=(position[0]-old.minX)/(old.maxX-old.minX);const nz=(position[2]-old.minZ)/(old.maxZ-old.minZ);
  const desired:[number,number,number]=[bounds.minX+nx*(bounds.maxX-bounds.minX),0,bounds.minZ+nz*(bounds.maxZ-bounds.minZ)];
  if(validatePlacement(object,desired,placed,template).valid)return validatePlacement(object,desired,placed,template).position;
  const angles=[0,Math.PI/2,Math.PI,Math.PI*1.5];for(let radius=.5;radius<8;radius+=.5)for(const angle of angles){const candidate:[number,number,number]=[desired[0]+Math.cos(angle+index*.27)*radius,0,desired[2]+Math.sin(angle+index*.27)*radius];const result=validatePlacement(object,candidate,placed,template);if(result.valid)return result.position;}
  return firstValidPlacement(object.roomId,object.archetype,placed,template);
}
