import type { Archetype, Room, RoomTemplate } from './types';

export type LayoutBounds={minX:number;maxX:number;minZ:number;maxZ:number};
export type LayoutObstacle={id:string;x:number;z:number;width:number;depth:number};
export type MountKind='floor'|'desk'|'shelf'|'wall'|'media';
export type LayoutAnchor={id:string;kind:MountKind;position:[number,number,number];rotation:number;accepts:Archetype[]};
export type RoomLayoutDefinition={
  template:RoomTemplate;bounds:LayoutBounds;outline:[number,number][];spawn:[number,number,number];portal:[number,number,number];
  obstacles:LayoutObstacle[];anchors:LayoutAnchor[];miniFurniture:{x:number;z:number;width:number;depth:number;kind:string}[];
};

const deskTypes:Archetype[]=['terminal','laptop','desk-monitor','tablet','book','radio'];
const wallTypes:Archetype[]=['poster','wall-display','tv'];
const shelfTypes:Archetype[]=['book','tablet','file-box','radio'];

export const ROOM_LAYOUTS:Record<RoomTemplate,RoomLayoutDefinition>={
  den:{template:'den',bounds:{minX:-6,maxX:6,minZ:-7,maxZ:6.5},outline:[[-6,-7],[6,-7],[6,3.8],[4.5,6.5],[-4.5,6.5],[-6,4]],spawn:[0,1.1,5.25],portal:[0,0,-6.35],
    obstacles:[{id:'desk-nook',x:-4.7,z:-2.5,width:2.2,depth:3.5},{id:'reading-seat',x:3.7,z:1.4,width:2.7,depth:2.7},{id:'shelves',x:4.9,z:-2.8,width:1.1,depth:3.2}],
    anchors:[{id:'den-desk',kind:'desk',position:[-4.05,1.05,-2.25],rotation:Math.PI/2,accepts:deskTypes},{id:'den-shelf',kind:'shelf',position:[4.55,1.3,-2.5],rotation:-Math.PI/2,accepts:shelfTypes},{id:'den-wall',kind:'wall',position:[2.5,1.35,-5.75],rotation:0,accepts:wallTypes},{id:'den-media',kind:'media',position:[3.75,.8,1.1],rotation:-Math.PI/2,accepts:['tv','wall-display','radio']}],
    miniFurniture:[{x:-4.6,z:-2.6,width:2.1,depth:3.3,kind:'desk'},{x:3.7,z:1.4,width:2.6,depth:2.6,kind:'seat'},{x:4.9,z:-2.8,width:1,depth:3,kind:'shelf'}]},
  studio:{template:'studio',bounds:{minX:-8,maxX:8,minZ:-8.5,maxZ:7.5},outline:[[-8,-8.5],[8,-8.5],[8,7.5],[-8,7.5]],spawn:[0,1.1,6.15],portal:[0,0,-7.8],
    obstacles:[{id:'workbench-left',x:-5.8,z:-2.5,width:2.8,depth:5.2},{id:'workbench-right',x:5.8,z:-2.5,width:2.8,depth:5.2},{id:'utility',x:-6.8,z:3.6,width:1.8,depth:2.7}],
    anchors:[{id:'studio-left-desk',kind:'desk',position:[-5.35,1.05,-2.5],rotation:Math.PI/2,accepts:deskTypes},{id:'studio-right-desk',kind:'desk',position:[5.35,1.05,-2.5],rotation:-Math.PI/2,accepts:deskTypes},{id:'studio-display',kind:'wall',position:[0,1.5,-7.65],rotation:0,accepts:wallTypes},{id:'studio-shelf',kind:'shelf',position:[-6.35,1.3,3.3],rotation:Math.PI/2,accepts:shelfTypes}],
    miniFurniture:[{x:-5.8,z:-2.5,width:2.7,depth:5,kind:'desk'},{x:5.8,z:-2.5,width:2.7,depth:5,kind:'desk'},{x:-6.8,z:3.6,width:1.7,depth:2.6,kind:'utility'}]},
  lounge:{template:'lounge',bounds:{minX:-8,maxX:8,minZ:-7.5,maxZ:7},outline:[[-8,-7.5],[8,-7.5],[8,5.2],[6.2,7],[-6.2,7],[-8,5.2]],spawn:[0,1.1,5.8],portal:[0,0,-6.8],
    obstacles:[{id:'sofa',x:0,z:1.5,width:5.2,depth:2.2},{id:'media-console',x:0,z:-5.8,width:5.8,depth:1.2},{id:'low-seat-left',x:-5.6,z:1.4,width:2,depth:2.2}],
    anchors:[{id:'lounge-media',kind:'media',position:[0,1.15,-5.55],rotation:0,accepts:['tv','wall-display','radio','arcade']},{id:'lounge-table',kind:'desk',position:[0,.6,-.4],rotation:0,accepts:['tablet','book','laptop','radio']},{id:'lounge-wall-left',kind:'wall',position:[-5.8,1.45,-5.9],rotation:0,accepts:wallTypes},{id:'lounge-shelf',kind:'shelf',position:[5.9,1.2,-2.8],rotation:-Math.PI/2,accepts:shelfTypes}],
    miniFurniture:[{x:0,z:1.5,width:5,depth:2.1,kind:'sofa'},{x:0,z:-5.8,width:5.6,depth:1.1,kind:'media'},{x:-5.6,z:1.4,width:1.9,depth:2.1,kind:'seat'}]},
};

export function layoutFor(room:Pick<Room,'template'>|RoomTemplate){return ROOM_LAYOUTS[typeof room==='string'?room:room.template];}

export function defaultMount(template:RoomTemplate,archetype:Archetype){return ROOM_LAYOUTS[template].anchors.find(anchor=>anchor.accepts.includes(archetype));}

export function pointInside(bounds:LayoutBounds,x:number,z:number,padding=0){return x>=bounds.minX+padding&&x<=bounds.maxX-padding&&z>=bounds.minZ+padding&&z<=bounds.maxZ-padding;}
