import type { BookmarkObject, BrowserWorkspace } from './types';

export type SessionDensity='individual'|'banks'|'dense';
export type SessionLayoutMode=BrowserWorkspace['layoutMode'];
export type SessionSlot={objectId:string;position:[number,number,number];rotation:number;bankId:string;groupLabel:string};
export type SessionBank={id:string;label:string;position:[number,number,number];rotation:number;width:number;depth:number;rows:number;color:string;count:number};
export type SessionLayoutPlan={density:SessionDensity;mode:SessionLayoutMode;slots:SessionSlot[];banks:SessionBank[]};

const COLORS=['#78dbea','#a78bfa','#76d2c5','#c6a0f6','#e0b47d','#8db5dd'];

function safeDomain(url:string){try{return new URL(url).hostname.replace(/^www\./,'');}catch{return'other';}}
function groupKey(object:BookmarkObject,mode:SessionLayoutMode){
  if(mode==='grid')return'Workspace';
  if(mode==='browser-group')return object.browserReference?.groupName?.trim()||'Ungrouped';
  if(mode==='domain')return safeDomain(object.url);
  return object.browserReference?.groupName?.trim()||safeDomain(object.url);
}
function colorFor(label:string){let hash=0;for(const character of label)hash=(hash*31+character.charCodeAt(0))|0;return COLORS[Math.abs(hash)%COLORS.length];}

function stableObjects(objects:BookmarkObject[],mode:SessionLayoutMode,focusIds:readonly string[]){
  const focus=new Set(focusIds);return [...objects].sort((a,b)=>{
    const focusDelta=Number(focus.has(b.id))-Number(focus.has(a.id));if(focusDelta)return focusDelta;
    const groupDelta=groupKey(a,mode).localeCompare(groupKey(b,mode));if(groupDelta)return groupDelta;
    return (a.browserReference?.receivedAt??a.createdAt)-(b.browserReference?.receivedAt??b.createdAt)||a.id.localeCompare(b.id);
  });
}

function individualPlan(objects:BookmarkObject[],mode:SessionLayoutMode):SessionLayoutPlan{
  const columns=objects.length<=8?4:objects.length<=15?5:6;const spacingX=1.35,spacingZ=1.55;
  const rows=Math.ceil(objects.length/columns);const slots=objects.map((object,index)=>{
    const column=index%columns,row=Math.floor(index/columns);const label=groupKey(object,mode);
    return{objectId:object.id,position:[(column-(Math.min(columns,objects.length)-1)/2)*spacingX,0,-3.45+row*spacingZ] as [number,number,number],rotation:0,bankId:'open-floor',groupLabel:label};
  });
  return{density:'individual',mode,slots,banks:[{id:'open-floor',label:'Open workspace',position:[0,0,-.6],rotation:0,width:8.5,depth:Math.max(2.2,rows*spacingZ),rows,color:'#6c8097',count:objects.length}]};
}

const BANK_POSITIONS:[number,number][]=[[-2.25,-3.2],[2.25,-3.2],[-2.25,.15],[2.25,.15],[-2.25,3.35],[2.25,3.35]];

function bankPlan(objects:BookmarkObject[],mode:SessionLayoutMode,density:'banks'|'dense'):SessionLayoutPlan{
  const capacity=density==='banks'?10:18;const bankCount=Math.min(BANK_POSITIONS.length,Math.max(1,Math.ceil(objects.length/capacity)));
  const chunks:Array<typeof objects>=Array.from({length:bankCount},()=>[]);
  objects.forEach((object,index)=>chunks[Math.min(bankCount-1,Math.floor(index/capacity))].push(object));
  const banks:SessionBank[]=[];const slots:SessionSlot[]=[];
  chunks.forEach((chunk,bankIndex)=>{
    if(!chunk.length)return;const [bankX,bankZ]=BANK_POSITIONS[bankIndex];const dense=density==='dense';const columns=dense?6:5;const rows=Math.ceil(chunk.length/columns);
    const labels=new Map<string,number>();for(const object of chunk){const label=groupKey(object,mode);labels.set(label,(labels.get(label)??0)+1);}
    const label=[...labels].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]??'Workspace';const id=`bank-${bankIndex}`;
    banks.push({id,label,position:[bankX,0,bankZ],rotation:0,width:dense?3.75:3.55,depth:dense?.72:2.35,rows,color:colorFor(label),count:chunk.length});
    chunk.forEach((object,index)=>{const column=index%columns,row=Math.floor(index/columns);const objectLabel=groupKey(object,mode);
      slots.push({objectId:object.id,position:[bankX+(column-(columns-1)/2)*(dense?.56:.64),dense?row*.54:0,bankZ+(dense?0:(row-(rows-1)/2)*.58)] as [number,number,number],rotation:0,bankId:id,groupLabel:objectLabel});
    });
  });
  return{density,mode,slots,banks};
}

export function planSessionLayout(objects:BookmarkObject[],mode:SessionLayoutMode='auto',focusIds:readonly string[]=[]):SessionLayoutPlan{
  const effectiveMode=mode==='auto'?'browser-group':mode;const ordered=stableObjects(objects,effectiveMode,focusIds);
  if(ordered.length<=24)return individualPlan(ordered,effectiveMode);
  return bankPlan(ordered,effectiveMode,ordered.length<=60?'banks':'dense');
}

export function applySessionLayout(objects:BookmarkObject[],mode:SessionLayoutMode='auto',focusIds:readonly string[]=[]){
  const plan=planSessionLayout(objects,mode,focusIds);const slots=new Map(plan.slots.map(slot=>[slot.objectId,slot]));
  return objects.map(object=>{const slot=slots.get(object.id);return slot?{...object,position:slot.position,rotation:slot.rotation,mount:undefined,updatedAt:Date.now()}:object;});
}
