import Dexie, { type EntityTable } from 'dexie';
import type { Activity, BookmarkObject, Preferences, Room } from './types';
import { DEFAULT_PREFERENCES, DEMO_OBJECTS, DEMO_ROOMS } from './demo';

type Setting = { key:string; value:unknown };
export class BurrowDatabase extends Dexie {
  rooms!: EntityTable<Room,'id'>; objects!: EntityTable<BookmarkObject,'id'>; activity!: EntityTable<Activity,'id'>; settings!: EntityTable<Setting,'key'>;
  constructor(name='webburrow') {
    super(name);
    this.version(1).stores({ rooms:'id,createdAt', objects:'id,roomId,url,favorite,createdAt', activity:'id,objectId,openedAt', settings:'key' });
    this.version(2).stores({ rooms:'id,createdAt', objects:'id,roomId,url,favorite,createdAt,updatedAt', activity:'id,objectId,openedAt', settings:'key' }).upgrade(async transaction=>{
      const settings=transaction.table('settings');const row=await settings.get('preferences') as Setting|undefined;
      if(row) await settings.put({key:'preferences',value:{...DEFAULT_PREFERENCES,...(row.value as Partial<Preferences>)}});
    });
  }
}

export const db = new BurrowDatabase('webburrow-prototype-v1');

export type Snapshot = { rooms:Room[]; objects:BookmarkObject[]; activity:Activity[]; note:string; preferences:Preferences };

export async function loadSnapshot(database=db):Promise<Snapshot> {
  const [rooms,objects,activity,noteRow,prefRow] = await Promise.all([database.rooms.toArray(),database.objects.toArray(),database.activity.orderBy('openedAt').reverse().limit(20).toArray(),database.settings.get('note'),database.settings.get('preferences')]);
  if (!rooms.length) {
    const initial={rooms:DEMO_ROOMS,objects:DEMO_OBJECTS,activity:[],note:'Pin a thought here. It stays in your Burrow.',preferences:DEFAULT_PREFERENCES};
    await saveSnapshot(initial,database); return structuredClone(initial);
  }
  return { rooms:[...rooms].sort((a,b)=>a.createdAt-b.createdAt), objects, activity, note:typeof noteRow?.value==='string'?noteRow.value:'', preferences:{...DEFAULT_PREFERENCES,...(prefRow?.value as Partial<Preferences>|undefined)} };
}

export async function saveSnapshot(snapshot:Snapshot,database=db) {
  await database.transaction('rw',database.rooms,database.objects,database.activity,database.settings,async()=>{
    await Promise.all([database.rooms.clear(),database.objects.clear(),database.activity.clear()]);
    await database.rooms.bulkPut(snapshot.rooms); await database.objects.bulkPut(snapshot.objects); await database.activity.bulkPut(snapshot.activity.slice(0,20));
    await database.settings.bulkPut([{key:'note',value:snapshot.note},{key:'preferences',value:snapshot.preferences},{key:'schemaVersion',value:1}]);
  });
}

export async function resetDatabase(database=db) { await database.delete(); await database.open(); }
