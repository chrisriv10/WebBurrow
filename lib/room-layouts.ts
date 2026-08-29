import type { Archetype, Room, RoomTemplate } from './types';

export const CURRENT_LAYOUT_VERSION = 17;

export type LayoutBounds={minX:number;maxX:number;minZ:number;maxZ:number};
export type LayoutObstacle={id:string;x:number;z:number;width:number;depth:number;rotation?:number};
export type MountKind='floor'|'desk'|'shelf'|'wall'|'media';
export type LayoutAnchor={id:string;kind:MountKind;position:[number,number,number];rotation:number;accepts:Archetype[]};
export type LayoutWindow={id:string;position:[number,number,number];rotation:number;width:number;height:number;depth:number};
export type LayoutFurnitureKind='desk'|'sofa'|'shelf'|'lamp'|'plant'|'coffee-table'|'media-console'|'lounge-chair'|'utility'|'notes-board'|'activity-rack';
export type LayoutFurniture={id:string;kind:LayoutFurnitureKind;position:[number,number,number];rotation?:number;variant?:'compact'|'wide'|'technical'|'low'|'modular'};
export type IntegrationAnchor={id:string;kind:'weather-window'|'calendar'|'github-repo'|'feed';position:[number,number,number];rotation:number};
export type SessionZone={id:string;label:string;x:number;z:number;width:number;depth:number;rotation?:number};
export type MiniFurniture={x:number;z:number;width:number;depth:number;kind:string;rotation?:number};

export type RoomLayoutDefinition={
  version:number;template:RoomTemplate;bounds:LayoutBounds;outline:[number,number][];spawn:[number,number,number];portal:[number,number,number];
  ceilingHeight:number;obstacles:LayoutObstacle[];anchors:LayoutAnchor[];windows:LayoutWindow[];furniture:LayoutFurniture[];
  integrations:IntegrationAnchor[];sessionZones:SessionZone[];miniFurniture:MiniFurniture[];
};

const deskTypes:Archetype[]=['terminal','laptop','desk-monitor','tablet','book','radio'];
const wallTypes:Archetype[]=['poster','wall-display','tv'];
const shelfTypes:Archetype[]=['book','tablet','file-box','radio'];

export const LEGACY_ROOM_LAYOUTS_V2:Record<RoomTemplate,{bounds:LayoutBounds;spawn:[number,number,number];portal:[number,number,number]}>= {
  den:{bounds:{minX:-6,maxX:6,minZ:-7,maxZ:6.5},spawn:[0,1.1,5.25],portal:[0,0,-6.35]},
  studio:{bounds:{minX:-8,maxX:8,minZ:-8.5,maxZ:7.5},spawn:[0,1.1,6.15],portal:[0,0,-7.8]},
  lounge:{bounds:{minX:-8,maxX:8,minZ:-7.5,maxZ:7},spawn:[0,1.1,5.8],portal:[0,0,-6.8]},
};

export const ROOM_LAYOUTS:Record<RoomTemplate,RoomLayoutDefinition>={
  den:{
    version:CURRENT_LAYOUT_VERSION,template:'den',bounds:{minX:-6.2,maxX:6,minZ:-7.2,maxZ:6.2},
    outline:[[-5,-7.2],[6,-7.2],[6,-.5],[5.05,.65],[5.05,4.35],[3.35,6.2],[-4.55,6.2],[-6.2,4.55],[-6.2,-3.75],[-5,-3.75]],
    spawn:[0,1.1,5.05],portal:[0,0,-6.7],ceilingHeight:5.7,
    obstacles:[
      {id:'desk-nook',x:-5.1,z:-2.15,width:2.05,depth:3.25,rotation:Math.PI/2},
      {id:'reading-seat',x:3.65,z:1.45,width:3.95,depth:1.95,rotation:-Math.PI/2},
      {id:'shelves',x:4.25,z:-6.15,width:3.2,depth:.95},
      {id:'coffee-table',x:.35,z:1.1,width:2.2,depth:1.2},
    ],
    anchors:[
      {id:'den-desk',kind:'desk',position:[-5.05,1.15,-2.15],rotation:Math.PI/2,accepts:deskTypes},
      {id:'den-shelf',kind:'shelf',position:[4.25,1.27,-6.15],rotation:0,accepts:shelfTypes},
      {id:'den-wall',kind:'wall',position:[2.35,1.45,-6.86],rotation:0,accepts:wallTypes},
      {id:'den-media',kind:'wall',position:[-5.94,1.45,3.45],rotation:Math.PI/2,accepts:wallTypes},
      {id:'den-search',kind:'floor',position:[-2.5,0,-2.2],rotation:0,accepts:['pedestal','compact-portal']},
      {id:'den-storage',kind:'floor',position:[2,0,-2.2],rotation:0,accepts:['file-box','arcade']},
    ],
    windows:[{id:'den-window',position:[5.9,3.1,-2.2],rotation:-Math.PI/2,width:3.35,height:2.45,depth:2.2}],
    furniture:[
      {id:'den-desk',kind:'desk',position:[-5.05,0,-2.15],rotation:Math.PI/2,variant:'compact'},
      {id:'den-sofa',kind:'sofa',position:[3.65,0,1.45],rotation:-Math.PI/2,variant:'compact'},
      {id:'den-shelf',kind:'shelf',position:[4.25,0,-6.15],rotation:0,variant:'compact'},
      {id:'den-coffee',kind:'coffee-table',position:[.35,0,1.1],rotation:.08,variant:'low'},
      {id:'den-lamp',kind:'lamp',position:[4.55,0,4.35]},
      {id:'den-plant',kind:'plant',position:[-4.85,0,4.45]},
      {id:'den-notes',kind:'notes-board',position:[-6.02,3.05,.7],rotation:Math.PI/2},
      {id:'den-activity',kind:'activity-rack',position:[-3.55,2.8,-6.98]},
    ],
    integrations:[
      {id:'den-weather',kind:'weather-window',position:[5.65,0,-2.2],rotation:-Math.PI/2},
      {id:'den-calendar',kind:'calendar',position:[2.25,0,-6.65],rotation:0},
      {id:'den-github',kind:'github-repo',position:[-5.05,0,-2.15],rotation:Math.PI/2},
      {id:'den-feed',kind:'feed',position:[-2.2,0,2.9],rotation:0},
    ],
    sessionZones:[{id:'den-open',label:'Open floor',x:-.5,z:-1.25,width:6.1,depth:7.2}],
    miniFurniture:[
      {x:-5.05,z:-2.15,width:2,depth:3.15,kind:'desk',rotation:Math.PI/2},{x:3.65,z:1.45,width:2.15,depth:3.8,kind:'sofa',rotation:-Math.PI/2},
      {x:4.25,z:-6.15,width:3,depth:.85,kind:'shelf'},{x:.35,z:1.1,width:2.1,depth:1.1,kind:'table',rotation:.08},
    ],
  },
  studio:{
    version:CURRENT_LAYOUT_VERSION,template:'studio',bounds:{minX:-8.4,maxX:8.4,minZ:-8.5,maxZ:7.5},
    outline:[[-8.4,-8.5],[8.4,-8.5],[8.4,5.2],[6.75,5.2],[6.75,7.5],[-6.75,7.5],[-6.75,5.2],[-8.4,5.2]],
    spawn:[0,1.1,6.25],portal:[0,0,-7.95],ceilingHeight:6.05,
    obstacles:[
      {id:'workbench-left',x:-6.05,z:-2.3,width:2.35,depth:4.7,rotation:Math.PI/2},
      {id:'workbench-right',x:6.05,z:-2.3,width:2.35,depth:4.7,rotation:-Math.PI/2},
      {id:'shelves',x:-3.8,z:6.7,width:3.2,depth:.95},
      {id:'utility-right',x:5.65,z:6.1,width:1.9,depth:1.2},
    ],
    anchors:[
      {id:'studio-left-desk',kind:'desk',position:[-6.05,1.15,-2.4],rotation:Math.PI/2,accepts:deskTypes},
      {id:'studio-right-desk',kind:'desk',position:[6.05,1.15,-2.4],rotation:-Math.PI/2,accepts:deskTypes},
      {id:'studio-display',kind:'wall',position:[2.7,1.55,-8.15],rotation:0,accepts:wallTypes},
      {id:'studio-shelf',kind:'shelf',position:[-3.8,1.27,6.7],rotation:Math.PI,accepts:shelfTypes},
    ],
    windows:[{id:'studio-window',position:[8.28,3.35,-1.35],rotation:-Math.PI/2,width:5.2,height:3.05,depth:2.8}],
    furniture:[
      {id:'studio-desk-left',kind:'desk',position:[-6.05,0,-2.3],rotation:Math.PI/2,variant:'technical'},
      {id:'studio-desk-right',kind:'desk',position:[6.05,0,-2.3],rotation:-Math.PI/2,variant:'technical'},
      {id:'studio-shelf',kind:'shelf',position:[-3.8,0,6.7],rotation:Math.PI,variant:'technical'},
      {id:'studio-utility',kind:'utility',position:[5.65,0,6.1],rotation:Math.PI,variant:'modular'},
      {id:'studio-plant',kind:'plant',position:[7.1,0,4.35]},
      {id:'studio-activity',kind:'activity-rack',position:[-4,2.95,-8.25]},
    ],
    integrations:[
      {id:'studio-weather',kind:'weather-window',position:[8.05,0,-1.35],rotation:-Math.PI/2},
      {id:'studio-calendar',kind:'calendar',position:[2.4,0,-8.15],rotation:0},
      {id:'studio-github',kind:'github-repo',position:[-6.05,0,-2.3],rotation:Math.PI/2},
      {id:'studio-feed',kind:'feed',position:[-5.7,0,3.35],rotation:Math.PI/2},
    ],
    sessionZones:[
      {id:'studio-center-left',label:'Left bank',x:-2.25,z:-1.25,width:3.6,depth:9.6},
      {id:'studio-center-right',label:'Right bank',x:2.25,z:-1.25,width:3.6,depth:9.6},
      {id:'studio-rear',label:'Rear bank',x:0,z:4.1,width:7.5,depth:2.4},
    ],
    miniFurniture:[
      {x:-6.05,z:-2.3,width:2.25,depth:4.55,kind:'desk',rotation:Math.PI/2},{x:6.05,z:-2.3,width:2.25,depth:4.55,kind:'desk',rotation:-Math.PI/2},
      {x:-3.8,z:6.7,width:3,depth:.85,kind:'shelf',rotation:Math.PI},{x:5.65,z:6.1,width:1.8,depth:1.1,kind:'utility'},
    ],
  },
  lounge:{
    version:CURRENT_LAYOUT_VERSION,template:'lounge',bounds:{minX:-8.5,maxX:8.5,minZ:-7.5,maxZ:7.1},
    outline:[[-6.75,-7.5],[6.75,-7.5],[8.5,-5.35],[8.5,4.75],[6.15,7.1],[-6.15,7.1],[-8.5,4.75],[-8.5,-5.35]],
    spawn:[0,1.1,5.75],portal:[0,0,-6.92],ceilingHeight:5.85,
    obstacles:[
      {id:'sofa',x:-4.05,z:1.35,width:5.35,depth:2.15,rotation:Math.PI/2},
      {id:'media-console',x:4.6,z:-6.15,width:4.15,depth:1.05},
      {id:'coffee-table',x:.15,z:-.25,width:3.1,depth:1.55},
      {id:'low-seat',x:6.35,z:4.55,width:1.75,depth:1.9,rotation:1.15+Math.PI},
    ],
    anchors:[
      {id:'lounge-tv',kind:'media',position:[4.6,.78,-6.05],rotation:0,accepts:['tv']},
      {id:'lounge-media',kind:'media',position:[4.6,.78,-6.05],rotation:0,accepts:['tv','wall-display','radio','arcade']},
      {id:'lounge-table',kind:'desk',position:[.15,.59,-.25],rotation:0,accepts:['tablet','book','laptop','radio']},
      {id:'lounge-wall-left',kind:'wall',position:[-7.03,1.5,5.63],rotation:-Math.PI/4,accepts:wallTypes},
      {id:'lounge-shelf',kind:'shelf',position:[6.85,1.29,-2.65],rotation:-Math.PI/2,accepts:shelfTypes},
    ],
    windows:[{id:'lounge-window',position:[-8.34,3.25,-.65],rotation:Math.PI/2,width:5.65,height:3.15,depth:3}],
    furniture:[
      {id:'lounge-sofa',kind:'sofa',position:[-4.05,0,1.35],rotation:Math.PI/2,variant:'wide'},
      {id:'lounge-coffee',kind:'coffee-table',position:[.15,0,-.25],rotation:-.05,variant:'low'},
      {id:'lounge-media',kind:'media-console',position:[4.6,0,-6.15],variant:'wide'},
      {id:'lounge-chair',kind:'lounge-chair',position:[6.35,0,4.55],rotation:1.15+Math.PI,variant:'low'},
      {id:'lounge-lamp',kind:'lamp',position:[7.25,0,3.55]},
      {id:'lounge-plant',kind:'plant',position:[-6.55,0,4.45]},
      {id:'lounge-shelf',kind:'shelf',position:[6.85,0,-2.65],rotation:-Math.PI/2,variant:'low'},
      {id:'lounge-activity',kind:'activity-rack',position:[-3.55,2.85,-7.04]},
    ],
    integrations:[
      {id:'lounge-weather',kind:'weather-window',position:[-8.05,0,-.65],rotation:Math.PI/2},
      {id:'lounge-calendar',kind:'calendar',position:[-5.1,0,-6.82],rotation:0},
      {id:'lounge-github',kind:'github-repo',position:[5.8,0,-2.6],rotation:-Math.PI/2},
      {id:'lounge-feed',kind:'feed',position:[4.5,0,.05],rotation:-.45},
    ],
    sessionZones:[{id:'lounge-open',label:'Open lounge',x:1.3,z:1,width:5.4,depth:7.5}],
    miniFurniture:[
      {x:-4.05,z:1.35,width:2.15,depth:5.2,kind:'sofa',rotation:Math.PI/2},{x:4.6,z:-6.15,width:4.1,depth:1,kind:'media'},
      {x:.15,z:-.25,width:3,depth:1.45,kind:'table',rotation:-.05},{x:6.35,z:4.55,width:1.7,depth:1.85,kind:'seat',rotation:1.15+Math.PI},
    ],
  },
};

export function layoutFor(room:Pick<Room,'template'>|RoomTemplate){return ROOM_LAYOUTS[typeof room==='string'?room:room.template];}
export function defaultMount(template:RoomTemplate,archetype:Archetype){return ROOM_LAYOUTS[template].anchors.find(anchor=>anchor.accepts.includes(archetype));}
export function pointInside(bounds:LayoutBounds,x:number,z:number,padding=0){return x>=bounds.minX+padding&&x<=bounds.maxX-padding&&z>=bounds.minZ+padding&&z<=bounds.maxZ-padding;}

export function pointInsideOutline(outline:[number,number][],x:number,z:number){
  let inside=false;
  for(let i=0,j=outline.length-1;i<outline.length;j=i++){
    const [xi,zi]=outline[i],[xj,zj]=outline[j];
    if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))inside=!inside;
  }
  return inside;
}

export type WallSegment={start:[number,number];end:[number,number]};
export function wallSegments(layout:RoomLayoutDefinition,opening=2.55):WallSegment[]{
  const segments:WallSegment[]=[];
  for(let index=0;index<layout.outline.length;index++){
    const start=layout.outline[index],end=layout.outline[(index+1)%layout.outline.length];
    const dx=end[0]-start[0],dz=end[1]-start[1],length=Math.hypot(dx,dz);
    const px=layout.portal[0]-start[0],pz=layout.portal[2]-start[1];
    const along=(px*dx+pz*dz)/(length*length),distance=Math.abs(px*dz-pz*dx)/length;
    if(distance<.35&&along>0&&along<1&&length>opening+1){
      const center=along*length,half=opening/2,a=Math.max(0,(center-half)/length),b=Math.min(1,(center+half)/length);
      if(a>.05)segments.push({start,end:[start[0]+dx*a,start[1]+dz*a]});
      if(b<.95)segments.push({start:[start[0]+dx*b,start[1]+dz*b],end});
    }else segments.push({start,end});
  }
  return segments;
}
