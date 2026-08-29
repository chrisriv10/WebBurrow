import type { Archetype, BookmarkObject, RoomTemplate } from './types';
import { LEGACY_ROOM_LAYOUTS_V2, ROOM_LAYOUTS, defaultMount, pointInsideOutline, type LayoutBounds } from './room-layouts';

export const ROOM_BOUNDS = ROOM_LAYOUTS.studio.bounds;

const FOOTPRINTS:Record<Archetype,number> = {
  terminal:.95,tv:1.4,book:.72,poster:.82,arcade:.92,pedestal:.78,laptop:.82,radio:.72,'file-box':.72,
  'desk-monitor':.92,'wall-display':1.25,tablet:.68,'compact-portal':.92,
};

const LEGACY_PROTOTYPE_BOUNDS:LayoutBounds={minX:-7.25,maxX:7.25,minZ:-7.6,maxZ:7.25};

export type PlacementResult={position:[number,number,number];valid:boolean;reason?:string};

export function snapValue(value:number,step=.5){return Math.round(value/step)*step;}
export function footprintFor(archetype:Archetype){return FOOTPRINTS[archetype];}
export function suggestedMount(template:RoomTemplate,archetype:Archetype,objects:BookmarkObject[]){const layout=ROOM_LAYOUTS[template];return layout.anchors.find(anchor=>anchor.accepts.includes(archetype)&&!objects.some(object=>object.mount?.surfaceId===anchor.id));}

function insideWithPadding(template:RoomTemplate,x:number,z:number,padding:number){
  const outline=ROOM_LAYOUTS[template].outline;
  const probes:[[number,number],[number,number],[number,number],[number,number],[number,number]]=[
    [x,z],[x-padding,z],[x+padding,z],[x,z-padding],[x,z+padding],
  ];
  return probes.every(([px,pz])=>pointInsideOutline(outline,px,pz));
}

function obstacleContains(x:number,z:number,footprint:number,obstacle:{x:number;z:number;width:number;depth:number;rotation?:number}){
  const angle=-(obstacle.rotation??0),dx=x-obstacle.x,dz=z-obstacle.z;
  const localX=dx*Math.cos(angle)-dz*Math.sin(angle),localZ=dx*Math.sin(angle)+dz*Math.cos(angle);
  return Math.abs(localX)<obstacle.width/2+footprint&&Math.abs(localZ)<obstacle.depth/2+footprint;
}

export function validatePlacement(
  object:Pick<BookmarkObject,'id'|'roomId'|'archetype'>,
  desired:[number,number,number],
  roomObjects:BookmarkObject[],
  template:RoomTemplate='den',
):PlacementResult{
  const layout=ROOM_LAYOUTS[template],bounds=layout.bounds;
  const x=Math.max(bounds.minX,Math.min(bounds.maxX,snapValue(desired[0]))),z=Math.max(bounds.minZ,Math.min(bounds.maxZ,snapValue(desired[2])));
  const position:[number,number,number]=[x,0,z],footprint=footprintFor(object.archetype);
  if(Math.hypot(x-layout.portal[0],z-layout.portal[2])<1.65+footprint)return{position,valid:false,reason:'Keep the Burrow Lift approach clear.'};
  if(Math.hypot(x-layout.spawn[0],z-layout.spawn[2])<1.3+footprint)return{position,valid:false,reason:'Keep the arrival area clear.'};
  if(!insideWithPadding(template,x,z,footprint*.55))return{position,valid:false,reason:'Keep this object inside the walkable room.'};
  if(layout.obstacles.some(obstacle=>obstacleContains(x,z,footprint,obstacle)))return{position,valid:false,reason:'That position is reserved for room furniture.'};
  const overlap=roomObjects.find(candidate=>candidate.id!==object.id&&Math.hypot(candidate.position[0]-x,candidate.position[2]-z)<footprintFor(candidate.archetype)+footprint+.35);
  if(overlap)return{position,valid:false,reason:`That placement overlaps ${overlap.name}.`};
  return{position,valid:true};
}

export function firstValidPlacement(roomId:string,archetype:Archetype,objects:BookmarkObject[],template:RoomTemplate='den'):[number,number,number]{
  const layout=ROOM_LAYOUTS[template],mount=defaultMount(template,archetype);
  const candidates:[number,number,number][]=[...(mount?[[mount.position[0],0,mount.position[2]] as [number,number,number]]:[]),[-3,0,-4],[3,0,-4],[-3.5,0,0],[3.5,0,0],[-4,0,3],[4,0,3],[0,0,2.5],[-1.5,0,-2],[1.5,0,-2]];
  for(let z=layout.bounds.minZ+.8;z<=layout.bounds.maxZ-.8;z+=1.1)for(let x=layout.bounds.minX+.8;x<=layout.bounds.maxX-.8;x+=1.1)candidates.push([snapValue(x,.25),0,snapValue(z,.25)]);
  const roomObjects=objects.filter(object=>object.roomId===roomId),probe={id:'__placement-probe',roomId,archetype};
  return candidates.find(position=>validatePlacement(probe,position,roomObjects,template).valid)??[0,0,2.5];
}

export function sessionWorkspacePlacement(index:number,template:RoomTemplate='studio'):[number,number,number]{
  const layout=ROOM_LAYOUTS[template],candidates:[number,number,number][]=[];
  for(let z=layout.bounds.minZ+.65;z<=layout.bounds.maxZ-.65;z+=.95)for(let x=layout.bounds.minX+.65;x<=layout.bounds.maxX-.65;x+=.95){
    if(!insideWithPadding(template,x,z,.35)||Math.hypot(x-layout.portal[0],z-layout.portal[2])<1.7||Math.hypot(x-layout.spawn[0],z-layout.spawn[2])<1.45)continue;
    if(layout.obstacles.some(obstacle=>obstacleContains(x,z,.32,obstacle)))continue;
    candidates.push([snapValue(x,.05),0,snapValue(z,.05)]);
  }
  return candidates[index%candidates.length]??[0,0,0];
}

export function interactionPoint(object:BookmarkObject,template:RoomTemplate='den'):[number,number,number]{
  const layout=ROOM_LAYOUTS[template],distance=footprintFor(object.archetype)+1.25;
  const desired:[number,number,number]=[object.position[0]+Math.sin(object.rotation)*distance,1.1,object.position[2]+Math.cos(object.rotation)*distance];
  if(insideWithPadding(template,desired[0],desired[2],.25))return desired;
  for(let radius=distance;radius>=.6;radius-=.25)for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
    const candidate:[number,number,number]=[object.position[0]+Math.sin(object.rotation+angle)*radius,1.1,object.position[2]+Math.cos(object.rotation+angle)*radius];
    if(insideWithPadding(template,candidate[0],candidate[2],.25))return candidate;
  }
  return layout.spawn;
}

export function migratePlacement(
  position:[number,number,number],template:RoomTemplate,index:number,placed:BookmarkObject[],
  object:Pick<BookmarkObject,'id'|'roomId'|'archetype'>,sourceBounds:LayoutBounds=LEGACY_PROTOTYPE_BOUNDS,
){
  const bounds=ROOM_LAYOUTS[template].bounds,nx=(position[0]-sourceBounds.minX)/(sourceBounds.maxX-sourceBounds.minX),nz=(position[2]-sourceBounds.minZ)/(sourceBounds.maxZ-sourceBounds.minZ);
  const desired:[number,number,number]=[bounds.minX+Math.max(0,Math.min(1,nx))*(bounds.maxX-bounds.minX),0,bounds.minZ+Math.max(0,Math.min(1,nz))*(bounds.maxZ-bounds.minZ)];
  const direct=validatePlacement(object,desired,placed,template);if(direct.valid)return direct.position;
  const angles=[0,Math.PI/2,Math.PI,Math.PI*1.5];
  for(let radius=.5;radius<10;radius+=.5)for(const angle of angles){
    const candidate:[number,number,number]=[desired[0]+Math.cos(angle+index*.27)*radius,0,desired[2]+Math.sin(angle+index*.27)*radius],result=validatePlacement(object,candidate,placed,template);
    if(result.valid)return result.position;
  }
  return firstValidPlacement(object.roomId,object.archetype,placed,template);
}

export function migrateLayoutObjects(template:RoomTemplate,objects:BookmarkObject[],fromVersion:number){
  const source=fromVersion>=3?ROOM_LAYOUTS[template].bounds:fromVersion>=2?LEGACY_ROOM_LAYOUTS_V2[template].bounds:LEGACY_PROTOTYPE_BOUNDS,placed:BookmarkObject[]=[],byId=new Map<string,BookmarkObject>();
  for(const object of [...objects].sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id))){
    const anchor=object.mount&&ROOM_LAYOUTS[template].anchors.find(item=>item.id===object.mount?.surfaceId&&item.kind===object.mount.kind&&item.accepts.includes(object.archetype));
    const preserved:[number,number,number]=[object.position[0],0,object.position[2]];
    const migrated:BookmarkObject=anchor?{...object,position:anchor.position,rotation:anchor.rotation}:fromVersion>=3?{...object,mount:undefined,position:preserved}:{...object,mount:undefined,position:migratePlacement(object.position,template,placed.length,placed,object,source)};
    placed.push(migrated);byId.set(migrated.id,migrated);
  }
  return objects.map(object=>byId.get(object.id)??object);
}
