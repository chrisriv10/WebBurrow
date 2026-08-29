import { describe,expect,it } from 'vitest';
import { makeConfig, mergeConfig, parseConfig } from '@/lib/config';
import { DEFAULT_PREFERENCES, DEMO_OBJECTS, DEMO_ROOMS } from '@/lib/demo';

const snapshot={rooms:DEMO_ROOMS,objects:DEMO_OBJECTS,activity:[],note:'hello',preferences:DEFAULT_PREFERENCES};
describe('configuration import/export',()=>{
  it('round trips a versioned configuration',()=>{const config=makeConfig(snapshot);expect(parseConfig(JSON.stringify(config))).toEqual(config);});
  it('rejects malformed and unsupported versions',()=>{expect(()=>parseConfig('{bad')).toThrow(/JSON/);expect(()=>parseConfig(JSON.stringify({...makeConfig(snapshot),schemaVersion:99}))).toThrow(/supported/);});
  it('migrates V1 and V2 exports and excludes session rooms from V3',()=>{const v3=makeConfig({...snapshot,rooms:[...DEMO_ROOMS,{...DEMO_ROOMS[0],id:'temporary',lifecycle:'session'}]});expect(v3.schemaVersion).toBe(3);expect(v3.rooms.some(room=>room.id==='temporary')).toBe(false);const legacy={schemaVersion:1,exportedAt:1,...snapshot};const migrated=parseConfig(JSON.stringify(legacy));expect(migrated.schemaVersion).toBe(3);expect(migrated.collections.length).toBeGreaterThan(0);const v2={...v3,schemaVersion:2 as const};expect(parseConfig(JSON.stringify(v2)).schemaVersion).toBe(3);});
  it('merges without duplicating normalized URLs',()=>{const incoming=makeConfig(snapshot);const merged=mergeConfig(snapshot,incoming);expect(merged.objects).toHaveLength(snapshot.objects.length);});
  it('excludes cached feed content and notifications from exports',()=>{const config=makeConfig({...snapshot,feedItems:[{id:'feed-item',sourceId:'feed',title:'Cached',url:'https://example.com/a',source:'Example',publishedAt:1,read:false,firstSeenAt:1}],notifications:[{id:'note',kind:'error',title:'Refresh failed',body:'Offline',createdAt:1}]});expect(config.feedItems).toEqual([]);expect(config.notifications).toEqual([]);});
  it('excludes browser identity and icon cache data from portable exports',()=>{const config=makeConfig({...snapshot,objects:[{...DEMO_OBJECTS[0],browserReference:{workspaceId:'w',tabId:2,receivedAt:1},siteIconId:'icon'}],siteIcons:[{id:'icon',siteUrl:'https://www.google.com/',mimeType:'image/png',data:'data',createdAt:1,lastUsedAt:1}]});expect(config.objects[0].browserReference).toBeUndefined();expect(config.objects[0].siteIconId).toBeUndefined();expect('siteIcons' in config).toBe(false);});
  it('keeps Config V3 while migrating 1.0 layout-v2 positions',()=>{
    const legacy=makeConfig(snapshot);legacy.rooms=legacy.rooms.map(room=>({...room,layoutVersion:2,spawn:[0,1.1,5.25]}));legacy.objects=legacy.objects.map(object=>({...object,position:[object.position[0],0,object.position[2]]}));
    const migrated=parseConfig(JSON.stringify(legacy));expect(migrated.schemaVersion).toBe(3);expect(migrated.rooms.every(room=>room.layoutVersion===4)).toBe(true);expect(migrated.objects.map(object=>object.id)).toEqual(legacy.objects.map(object=>object.id));
  });
});
