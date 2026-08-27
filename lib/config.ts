import { configEnvelopeSchema, type ConfigEnvelopeV1 } from './types';
import type { Snapshot } from './db';

export function makeConfig(snapshot:Snapshot):ConfigEnvelopeV1 { return {schemaVersion:1,exportedAt:Date.now(),...snapshot}; }
export function parseConfig(input:string):ConfigEnvelopeV1 {
  let raw:unknown; try { raw=JSON.parse(input); } catch { throw new Error('This file is not valid JSON.'); }
  const parsed=configEnvelopeSchema.safeParse(raw); if(!parsed.success) throw new Error(`This is not a supported WebBurrow configuration: ${parsed.error.issues[0]?.message||'invalid data'}`); return parsed.data;
}
export function mergeConfig(current:Snapshot,incoming:ConfigEnvelopeV1):Snapshot {
  const roomMap=new Map(current.rooms.map(x=>[x.id,x])); incoming.rooms.forEach(x=>roomMap.set(x.id,{...x,isDemo:false}));
  const urls=new Set(current.objects.map(x=>x.url)); const additions=incoming.objects.filter(x=>!urls.has(x.url)).map(x=>({...x,id:current.objects.some(c=>c.id===x.id)?crypto.randomUUID():x.id,source:'config-import' as const,isDemo:false}));
  return {rooms:Array.from(roomMap.values()),objects:[...current.objects,...additions],activity:[...incoming.activity,...current.activity].sort((a,b)=>b.openedAt-a.openedAt).slice(0,20),note:current.note||incoming.note,preferences:{...current.preferences,...incoming.preferences,lastRoomId:current.preferences.lastRoomId}};
}
