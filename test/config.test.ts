import { describe,expect,it } from 'vitest';
import { makeConfig, mergeConfig, parseConfig } from '@/lib/config';
import { DEFAULT_PREFERENCES, DEMO_OBJECTS, DEMO_ROOMS } from '@/lib/demo';

const snapshot={rooms:DEMO_ROOMS,objects:DEMO_OBJECTS,activity:[],note:'hello',preferences:DEFAULT_PREFERENCES};
describe('configuration import/export',()=>{
  it('round trips a versioned configuration',()=>{const config=makeConfig(snapshot);expect(parseConfig(JSON.stringify(config))).toEqual(config);});
  it('rejects malformed and unsupported versions',()=>{expect(()=>parseConfig('{bad')).toThrow(/JSON/);expect(()=>parseConfig(JSON.stringify({...makeConfig(snapshot),schemaVersion:3}))).toThrow(/supported/);});
  it('migrates V1 exports and excludes session rooms from V2',()=>{const v2=makeConfig({...snapshot,rooms:[...DEMO_ROOMS,{...DEMO_ROOMS[0],id:'temporary',lifecycle:'session'}]});expect(v2.schemaVersion).toBe(2);expect(v2.rooms.some(room=>room.id==='temporary')).toBe(false);const legacy={schemaVersion:1,exportedAt:1,...snapshot};const migrated=parseConfig(JSON.stringify(legacy));expect(migrated.schemaVersion).toBe(2);expect(migrated.collections.length).toBeGreaterThan(0);});
  it('merges without duplicating normalized URLs',()=>{const incoming=makeConfig(snapshot);const merged=mergeConfig(snapshot,incoming);expect(merged.objects).toHaveLength(snapshot.objects.length);});
  it('excludes cached feed content and notifications from exports',()=>{const config=makeConfig({...snapshot,feedItems:[{id:'feed-item',sourceId:'feed',title:'Cached',url:'https://example.com/a',source:'Example',publishedAt:1,read:false,firstSeenAt:1}],notifications:[{id:'note',kind:'error',title:'Refresh failed',body:'Offline',createdAt:1}]});expect(config.feedItems).toEqual([]);expect(config.notifications).toEqual([]);});
});
