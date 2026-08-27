import { describe,expect,it } from 'vitest';
import { makeConfig, mergeConfig, parseConfig } from '@/lib/config';
import { DEFAULT_PREFERENCES, DEMO_OBJECTS, DEMO_ROOMS } from '@/lib/demo';

const snapshot={rooms:DEMO_ROOMS,objects:DEMO_OBJECTS,activity:[],note:'hello',preferences:DEFAULT_PREFERENCES};
describe('configuration import/export',()=>{
  it('round trips a versioned configuration',()=>{const config=makeConfig(snapshot);expect(parseConfig(JSON.stringify(config))).toEqual(config);});
  it('rejects malformed and unsupported versions',()=>{expect(()=>parseConfig('{bad')).toThrow(/JSON/);expect(()=>parseConfig(JSON.stringify({...makeConfig(snapshot),schemaVersion:2}))).toThrow(/supported/);});
  it('merges without duplicating normalized URLs',()=>{const incoming=makeConfig(snapshot);const merged=mergeConfig(snapshot,incoming);expect(merged.objects).toHaveLength(snapshot.objects.length);});
});
