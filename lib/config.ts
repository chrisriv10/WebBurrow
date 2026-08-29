import { configEnvelopeSchema, type ConfigEnvelope, type ConfigEnvelopeV3 } from './types';
import type { Snapshot, SnapshotInput } from './db';
import { completeSnapshot, normalizeCollections } from './db';
import { migrateLayoutObjects } from './placement';
import { CURRENT_LAYOUT_VERSION, ROOM_LAYOUTS } from './room-layouts';

function permanentSnapshot(snapshot:Snapshot) {
  const rooms=snapshot.rooms.filter(room=>room.lifecycle==='permanent');const roomIds=new Set(rooms.map(room=>room.id));
  const localCalendarIds=new Set(snapshot.calendarSources.filter(source=>source.kind==='local').map(source=>source.id));
  return {
    rooms,objects:snapshot.objects.filter(object=>object.lifecycle==='permanent'&&roomIds.has(object.roomId)).map(object=>{const exported={...object};delete exported.browserReference;delete exported.siteIconId;return exported;}),collections:snapshot.collections.filter(item=>item.lifecycle==='permanent'),
    activity:snapshot.activity,note:snapshot.note,preferences:snapshot.preferences,integrations:snapshot.integrations,
    integrationObjects:snapshot.integrationObjects.filter(item=>item.lifecycle==='permanent'&&roomIds.has(item.roomId)),calendarSources:snapshot.calendarSources,
    calendarEvents:snapshot.calendarEvents.filter(event=>localCalendarIds.has(event.sourceId)),feedSources:snapshot.feedSources,feedItems:[],notifications:[],
  };
}

export function makeConfig(input:SnapshotInput):ConfigEnvelopeV3 { return {schemaVersion:3,exportedAt:Date.now(),...permanentSnapshot(completeSnapshot(input))}; }

function upgradeLayouts(config:ConfigEnvelopeV3,forceVersion?:number):ConfigEnvelopeV3 {
  const objects:ConfigEnvelopeV3['objects']=[];
  const rooms=config.rooms.map(room=>{
    const fromVersion=forceVersion??room.layoutVersion,roomObjects=config.objects.filter(object=>object.roomId===room.id);
    objects.push(...(fromVersion<CURRENT_LAYOUT_VERSION?migrateLayoutObjects(room.template,roomObjects,fromVersion):roomObjects));
    return {...room,layoutVersion:CURRENT_LAYOUT_VERSION,spawn:ROOM_LAYOUTS[room.template].spawn};
  });
  const known=new Set(objects.map(object=>object.id));objects.push(...config.objects.filter(object=>!known.has(object.id)&&!config.rooms.some(room=>room.id===object.roomId)));
  const roomById=new Map(rooms.map(room=>[room.id,room]));
  const integrationObjects=config.integrationObjects.map(object=>{
    const room=roomById.get(object.roomId),original=config.rooms.find(item=>item.id===object.roomId);
    if(!room||!original||original.layoutVersion>=CURRENT_LAYOUT_VERSION)return object;
    const anchor=ROOM_LAYOUTS[room.template].integrations.find(item=>item.kind===object.kind);
    return anchor?{...object,position:anchor.position,rotation:anchor.rotation}:object;
  });
  return {...config,rooms,objects,integrationObjects};
}

export function migrateConfig(input:ConfigEnvelope):ConfigEnvelopeV3 {
  if(input.schemaVersion===3)return upgradeLayouts(input);
  if(input.schemaVersion===2)return upgradeLayouts({...input,schemaVersion:3});
  const normalized=normalizeCollections(input.objects,[]);
  return upgradeLayouts({schemaVersion:3,exportedAt:input.exportedAt,rooms:input.rooms,objects:normalized.objects,activity:input.activity,note:input.note,preferences:input.preferences,
    collections:normalized.collections,integrations:[],integrationObjects:[],calendarSources:[],calendarEvents:[],feedSources:[],feedItems:[],notifications:[]},1);
}

export function parseConfig(input:string):ConfigEnvelopeV3 {
  let raw:unknown;try{raw=JSON.parse(input);}catch{throw new Error('This file is not valid JSON.');}
  const parsed=configEnvelopeSchema.safeParse(raw);if(!parsed.success)throw new Error(`This is not a supported WebBurrow configuration: ${parsed.error.issues[0]?.message||'invalid data'}`);
  return migrateConfig(parsed.data);
}

function uniqueById<T extends {id:string}>(current:T[],incoming:T[]) { const map=new Map(current.map(item=>[item.id,item]));for(const item of incoming)map.set(item.id,item);return [...map.values()]; }

export function mergeConfig(input:SnapshotInput,incoming:ConfigEnvelopeV3):Snapshot {
  const current=completeSnapshot(input);
  const roomMap=new Map(current.rooms.map(item=>[item.id,item]));incoming.rooms.forEach(item=>roomMap.set(item.id,{...item,lifecycle:'permanent',isDemo:false}));
  const urls=new Set(current.objects.map(item=>item.url));const additions=incoming.objects.filter(item=>!urls.has(item.url)).map(item=>({...item,id:current.objects.some(existing=>existing.id===item.id)?crypto.randomUUID():item.id,source:'config-import' as const,lifecycle:'permanent' as const,isDemo:false}));
  return {...current,rooms:[...roomMap.values()],objects:[...current.objects,...additions],collections:uniqueById(current.collections,incoming.collections),
    integrations:uniqueById(current.integrations,incoming.integrations),integrationObjects:uniqueById(current.integrationObjects,incoming.integrationObjects),
    calendarSources:uniqueById(current.calendarSources,incoming.calendarSources),calendarEvents:uniqueById(current.calendarEvents,incoming.calendarEvents).slice(0,500),
    feedSources:uniqueById(current.feedSources,incoming.feedSources),feedItems:uniqueById(current.feedItems,incoming.feedItems),
    notifications:uniqueById(incoming.notifications,current.notifications).sort((a,b)=>b.createdAt-a.createdAt).slice(0,100),
    activity:[...incoming.activity,...current.activity].sort((a,b)=>b.openedAt-a.openedAt).slice(0,20),note:current.note||incoming.note,
    preferences:{...current.preferences,...incoming.preferences,lastRoomId:current.preferences.lastRoomId}};
}
