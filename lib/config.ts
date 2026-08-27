import { configEnvelopeSchema, type ConfigEnvelope, type ConfigEnvelopeV2 } from './types';
import type { Snapshot, SnapshotInput } from './db';
import { completeSnapshot, normalizeCollections } from './db';

function permanentSnapshot(snapshot:Snapshot) {
  const rooms=snapshot.rooms.filter(room=>room.lifecycle==='permanent');const roomIds=new Set(rooms.map(room=>room.id));
  return {
    rooms,objects:snapshot.objects.filter(object=>object.lifecycle==='permanent'&&roomIds.has(object.roomId)),collections:snapshot.collections.filter(item=>item.lifecycle==='permanent'),
    activity:snapshot.activity,note:snapshot.note,preferences:snapshot.preferences,integrations:snapshot.integrations,
    integrationObjects:snapshot.integrationObjects.filter(item=>item.lifecycle==='permanent'&&roomIds.has(item.roomId)),calendarSources:snapshot.calendarSources,
    calendarEvents:snapshot.calendarEvents,feedSources:snapshot.feedSources,feedItems:snapshot.feedItems,notifications:snapshot.notifications,
  };
}

export function makeConfig(input:SnapshotInput):ConfigEnvelopeV2 { return {schemaVersion:2,exportedAt:Date.now(),...permanentSnapshot(completeSnapshot(input))}; }

export function migrateConfig(input:ConfigEnvelope):ConfigEnvelopeV2 {
  if(input.schemaVersion===2)return input;
  const normalized=normalizeCollections(input.objects,input.objects.length?[]:[]);
  return {schemaVersion:2,exportedAt:input.exportedAt,rooms:input.rooms,objects:normalized.objects,activity:input.activity,note:input.note,preferences:input.preferences,
    collections:normalized.collections,integrations:[],integrationObjects:[],calendarSources:[],calendarEvents:[],feedSources:[],feedItems:[],notifications:[]};
}

export function parseConfig(input:string):ConfigEnvelopeV2 {
  let raw:unknown;try{raw=JSON.parse(input);}catch{throw new Error('This file is not valid JSON.');}
  const parsed=configEnvelopeSchema.safeParse(raw);if(!parsed.success)throw new Error(`This is not a supported WebBurrow configuration: ${parsed.error.issues[0]?.message||'invalid data'}`);
  return migrateConfig(parsed.data);
}

function uniqueById<T extends {id:string}>(current:T[],incoming:T[]) { const map=new Map(current.map(item=>[item.id,item]));for(const item of incoming)map.set(item.id,item);return [...map.values()]; }

export function mergeConfig(input:SnapshotInput,incoming:ConfigEnvelopeV2):Snapshot {
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
