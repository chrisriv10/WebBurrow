import Dexie, { type EntityTable } from 'dexie';
import {
  activitySchema, bookmarkObjectSchema, calendarEventSchema, calendarSourceSchema, collectionSchema, feedItemSchema,
  feedSourceSchema, integrationCacheSchema, integrationConfigSchema, integrationObjectSchema, notificationSchema,
  preferencesSchema, roomSchema, siteIconSchema,
  type Activity, type BookmarkObject, type BurrowNotification, type CalendarEvent, type CalendarSource, type Collection,
  type FeedItem, type FeedSource, type IntegrationCache, type IntegrationConfig, type IntegrationObject, type Preferences, type Room, type SiteIcon,
} from './types';
import { DEFAULT_PREFERENCES, DEMO_OBJECTS, DEMO_ROOMS } from './demo';
import { migrateLayoutObjects } from './placement';
import { CURRENT_LAYOUT_VERSION, ROOM_LAYOUTS } from './room-layouts';
import { recordIndexedDbWrite } from './performance';

type Setting = { key:string; value:unknown };
const INTEGRATION_IDS = ['browser','github','weather','calendar','rss'] as const;

export class BurrowDatabase extends Dexie {
  rooms!: EntityTable<Room,'id'>;
  objects!: EntityTable<BookmarkObject,'id'>;
  activity!: EntityTable<Activity,'id'>;
  settings!: EntityTable<Setting,'key'>;
  collections!: EntityTable<Collection,'id'>;
  integrations!: EntityTable<IntegrationConfig,'id'>;
  integrationCache!: EntityTable<IntegrationCache,'id'>;
  integrationObjects!: EntityTable<IntegrationObject,'id'>;
  calendarSources!: EntityTable<CalendarSource,'id'>;
  calendarEvents!: EntityTable<CalendarEvent,'id'>;
  feedSources!: EntityTable<FeedSource,'id'>;
  feedItems!: EntityTable<FeedItem,'id'>;
  notifications!: EntityTable<BurrowNotification,'id'>;
  siteIcons!: EntityTable<SiteIcon,'id'>;

  constructor(name='webburrow') {
    super(name);
    this.version(1).stores({ rooms:'id,createdAt', objects:'id,roomId,url,favorite,createdAt', activity:'id,objectId,openedAt', settings:'key' });
    this.version(2).stores({ rooms:'id,createdAt', objects:'id,roomId,url,favorite,createdAt,updatedAt', activity:'id,objectId,openedAt', settings:'key' }).upgrade(async transaction=>{
      const settings=transaction.table('settings');const row=await settings.get('preferences') as Setting|undefined;
      if(row) await settings.put({key:'preferences',value:{...DEFAULT_PREFERENCES,...(row.value as Partial<Preferences>)}});
    });
    this.version(3).stores({
      rooms:'id,createdAt,lifecycle', objects:'id,roomId,url,favorite,collectionId,lifecycle,createdAt,updatedAt', activity:'id,objectId,openedAt', settings:'key',
      collections:'id,name,lifecycle,updatedAt', integrations:'id,enabled,updatedAt', integrationCache:'id,integrationId,expiresAt',
      integrationObjects:'id,integrationId,roomId,kind,lifecycle', calendarSources:'id,kind,enabled,updatedAt', calendarEvents:'id,sourceId,startAt,endAt',
      feedSources:'id,enabled,updatedAt', feedItems:'id,sourceId,publishedAt,read', notifications:'id,kind,createdAt,dismissedAt',
    });
    this.version(4).stores({
      rooms:'id,createdAt,lifecycle,purpose,layoutVersion', objects:'id,roomId,url,favorite,collectionId,lifecycle,createdAt,updatedAt', activity:'id,objectId,openedAt', settings:'key',
      collections:'id,name,lifecycle,updatedAt', integrations:'id,enabled,updatedAt', integrationCache:'id,integrationId,expiresAt',
      integrationObjects:'id,integrationId,roomId,kind,lifecycle', calendarSources:'id,kind,enabled,updatedAt', calendarEvents:'id,sourceId,startAt,endAt',
      feedSources:'id,enabled,updatedAt', feedItems:'id,sourceId,publishedAt,read', notifications:'id,kind,createdAt,dismissedAt',siteIcons:'id,siteUrl,lastUsedAt',
    }).upgrade(async transaction=>{
      const roomTable=transaction.table('rooms');
      const rooms=(await roomTable.toArray()).flatMap(value=>{const parsed=roomSchema.safeParse(value);if(!parsed.success)return[];const raw=value as {layoutVersion?:unknown};return[{...parsed.data,layoutVersion:typeof raw.layoutVersion==='number'?raw.layoutVersion:1}];});
      await roomTable.bulkPut(rooms);
      const settings=transaction.table('settings');const pref=await settings.get('preferences') as Setting|undefined;
      if(pref)await settings.put({key:'preferences',value:{...DEFAULT_PREFERENCES,...(pref.value as Partial<Preferences>)}});
    });
    this.version(5).stores({
      rooms:'id,createdAt,lifecycle,purpose,layoutVersion',objects:'id,roomId,url,favorite,collectionId,lifecycle,createdAt,updatedAt',activity:'id,objectId,openedAt',settings:'key',
      collections:'id,name,lifecycle,updatedAt',integrations:'id,enabled,updatedAt',integrationCache:'id,integrationId,expiresAt',integrationObjects:'id,integrationId,roomId,kind,lifecycle',
      calendarSources:'id,kind,enabled,updatedAt',calendarEvents:'id,sourceId,startAt,endAt',feedSources:'id,enabled,updatedAt',feedItems:'id,sourceId,publishedAt,read',
      notifications:'id,kind,createdAt,dismissedAt',siteIcons:'id,siteUrl,lastUsedAt',
    }).upgrade(async transaction=>{
      const roomTable=transaction.table('rooms'),objectTable=transaction.table('objects');
      const rooms=(await roomTable.toArray()).flatMap(value=>{const parsed=roomSchema.safeParse(value);return parsed.success?[parsed.data]:[];});
      const objects=(await objectTable.toArray()).flatMap(value=>{const parsed=bookmarkObjectSchema.safeParse(value);return parsed.success?[parsed.data]:[];});
      const migrated:BookmarkObject[]=[];
      for(const room of rooms){
        const roomObjects=objects.filter(object=>object.roomId===room.id);
        migrated.push(...(room.layoutVersion<CURRENT_LAYOUT_VERSION?migrateLayoutObjects(room.template,roomObjects,room.layoutVersion):roomObjects));
      }
      const known=new Set(migrated.map(object=>object.id));migrated.push(...objects.filter(object=>!known.has(object.id)&&!rooms.some(room=>room.id===object.roomId)));
      await roomTable.clear();await roomTable.bulkPut(rooms.map(room=>({...room,layoutVersion:CURRENT_LAYOUT_VERSION,spawn:ROOM_LAYOUTS[room.template].spawn})));
      await objectTable.clear();await objectTable.bulkPut(migrated);
    });
  }
}

export const db = new BurrowDatabase('webburrow-prototype-v1');

export type Snapshot = {
  rooms:Room[]; objects:BookmarkObject[]; activity:Activity[]; note:string; preferences:Preferences; collections:Collection[];
  integrations:IntegrationConfig[]; integrationCache:IntegrationCache[]; integrationObjects:IntegrationObject[];
  calendarSources:CalendarSource[]; calendarEvents:CalendarEvent[]; feedSources:FeedSource[]; feedItems:FeedItem[]; notifications:BurrowNotification[];siteIcons:SiteIcon[];
};
export type SnapshotInput = Pick<Snapshot,'rooms'|'objects'|'activity'|'note'|'preferences'>&Partial<Omit<Snapshot,'rooms'|'objects'|'activity'|'note'|'preferences'>>;

function collectionKey(name:string) {
  const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,26)||'collection';
  let hash=0;for(const character of name)hash=((hash<<5)-hash+character.charCodeAt(0))|0;
  return `collection-${slug}-${Math.abs(hash).toString(36)}`;
}

function safeRows<T>(rows:unknown[],schema:{safeParse:(value:unknown)=>{success:boolean;data?:T}}):T[] {
  const valid:T[]=[];for(const row of rows){const result=schema.safeParse(row);if(result.success&&result.data)valid.push(result.data);}return valid;
}

export function normalizeCollections(objects:BookmarkObject[],existing:Collection[]) {
  const collections=[...existing];const byName=new Map(collections.map(item=>[item.name.toLowerCase(),item]));const now=Date.now();
  const normalized=objects.map(object=>{
    if(object.collectionId||!object.collection)return object;
    const key=object.collection.trim().toLowerCase();let collection=byName.get(key);
    if(!collection){collection={id:collectionKey(object.collection),name:object.collection,lifecycle:object.lifecycle,createdAt:object.createdAt||now,updatedAt:now};collections.push(collection);byName.set(key,collection);}
    return {...object,collectionId:collection.id};
  });
  return {objects:normalized,collections};
}

function emptyIntegrations():IntegrationConfig[] { return INTEGRATION_IDS.map((id,index)=>({id,enabled:false,settings:{},updatedAt:index})); }

export function completeSnapshot(input:SnapshotInput):Snapshot {
  return {rooms:input.rooms,objects:input.objects,activity:input.activity,note:input.note,preferences:input.preferences,collections:input.collections||[],integrations:input.integrations||emptyIntegrations(),integrationCache:input.integrationCache||[],integrationObjects:input.integrationObjects||[],calendarSources:input.calendarSources||[],calendarEvents:input.calendarEvents||[],feedSources:input.feedSources||[],feedItems:input.feedItems||[],notifications:input.notifications||[],siteIcons:input.siteIcons||[]};
}

export async function loadSnapshot(database=db):Promise<Snapshot> {
  const [roomRows,objectRows,activityRows,noteRow,prefRow,collectionRows,integrationRows,cacheRows,integrationObjectRows,calendarSourceRows,calendarEventRows,feedSourceRows,feedItemRows,notificationRows,siteIconRows] = await Promise.all([
    database.rooms.toArray(),database.objects.toArray(),database.activity.orderBy('openedAt').reverse().limit(20).toArray(),database.settings.get('note'),database.settings.get('preferences'),
    database.collections.toArray(),database.integrations.toArray(),database.integrationCache.toArray(),database.integrationObjects.toArray(),database.calendarSources.toArray(),database.calendarEvents.toArray(),database.feedSources.toArray(),database.feedItems.toArray(),database.notifications.orderBy('createdAt').reverse().limit(100).toArray(),database.siteIcons.orderBy('lastUsedAt').reverse().limit(100).toArray(),
  ]);
  let rooms=safeRows(roomRows,roomSchema).filter(room=>room.lifecycle==='permanent');
  let objects=safeRows(objectRows,bookmarkObjectSchema).filter(object=>object.lifecycle==='permanent');
  const seeded=!rooms.length;
  if(seeded){rooms=structuredClone(DEMO_ROOMS);objects=structuredClone(DEMO_OBJECTS);}
  const layoutMigrated=!seeded&&rooms.some(room=>room.layoutVersion<CURRENT_LAYOUT_VERSION);
  if(layoutMigrated){
    const migrated:BookmarkObject[]=[];
    for(const room of rooms){
      const roomObjects=objects.filter(object=>object.roomId===room.id);
      migrated.push(...(room.layoutVersion<CURRENT_LAYOUT_VERSION?migrateLayoutObjects(room.template,roomObjects,room.layoutVersion):roomObjects));
    }
    const migratedIds=new Set(migrated.map(object=>object.id));
    objects=[...migrated,...objects.filter(object=>!migratedIds.has(object.id)&&!rooms.some(room=>room.id===object.roomId))];
    rooms=rooms.map(room=>room.layoutVersion<CURRENT_LAYOUT_VERSION?{...room,layoutVersion:CURRENT_LAYOUT_VERSION,spawn:ROOM_LAYOUTS[room.template].spawn}:room);
  }
  const normalized=normalizeCollections(objects,safeRows(collectionRows,collectionSchema).filter(item=>item.lifecycle==='permanent'));
  const integrations=safeRows(integrationRows,integrationConfigSchema);const existingIds=new Set(integrations.map(item=>item.id));
  const parsedPreferences=preferencesSchema.safeParse({...DEFAULT_PREFERENCES,...(prefRow?.value as Partial<Preferences>|undefined)});
  const snapshot:Snapshot={
    rooms:[...rooms].sort((a,b)=>a.createdAt-b.createdAt),objects:normalized.objects,activity:safeRows(activityRows,activitySchema),
    note:typeof noteRow?.value==='string'?noteRow.value:'Pin a thought here. It stays in your Burrow.',
    preferences:parsedPreferences.success?parsedPreferences.data:DEFAULT_PREFERENCES,collections:normalized.collections,
    integrations:[...integrations,...emptyIntegrations().filter(item=>!existingIds.has(item.id))],integrationCache:safeRows(cacheRows,integrationCacheSchema),
    integrationObjects:safeRows(integrationObjectRows,integrationObjectSchema).filter(item=>item.lifecycle==='permanent'),calendarSources:safeRows(calendarSourceRows,calendarSourceSchema),
    calendarEvents:safeRows(calendarEventRows,calendarEventSchema),feedSources:safeRows(feedSourceRows,feedSourceSchema),feedItems:safeRows(feedItemRows,feedItemSchema),notifications:safeRows(notificationRows,notificationSchema),siteIcons:safeRows(siteIconRows,siteIconSchema),
  };
  if(seeded||layoutMigrated)await saveSnapshot(snapshot,database);
  return snapshot;
}

export async function saveSnapshot(input:SnapshotInput,database=db) {
  const snapshot=completeSnapshot(input);
  const rooms=snapshot.rooms.filter(room=>room.lifecycle==='permanent');const roomIds=new Set(rooms.map(room=>room.id));
  const objects=snapshot.objects.filter(object=>object.lifecycle==='permanent'&&roomIds.has(object.roomId));
  const collections=snapshot.collections.filter(item=>item.lifecycle==='permanent');
  await database.transaction('rw',database.tables,async()=>{
    await Promise.all(database.tables.map(table=>table.name==='settings'?Promise.resolve():table.clear()));
    await database.rooms.bulkPut(rooms);await database.objects.bulkPut(objects);await database.activity.bulkPut(snapshot.activity.slice(0,20));
    await database.collections.bulkPut(collections);await database.integrations.bulkPut(snapshot.integrations);await database.integrationCache.bulkPut(snapshot.integrationCache);
    await database.integrationObjects.bulkPut(snapshot.integrationObjects.filter(item=>item.lifecycle==='permanent'&&roomIds.has(item.roomId)));
    await database.calendarSources.bulkPut(snapshot.calendarSources);await database.calendarEvents.bulkPut(snapshot.calendarEvents.slice(0,500));
    await database.feedSources.bulkPut(snapshot.feedSources);await database.feedItems.bulkPut(snapshot.feedItems);await database.notifications.bulkPut(snapshot.notifications.slice(0,100));
    await database.siteIcons.bulkPut([...snapshot.siteIcons].sort((a,b)=>b.lastUsedAt-a.lastUsedAt).slice(0,100));
    await database.settings.bulkPut([{key:'note',value:snapshot.note},{key:'preferences',value:snapshot.preferences},{key:'schemaVersion',value:3}]);
  });
  recordIndexedDbWrite();
}

export async function resetDatabase(database=db) { await database.delete(); await database.open(); }
