import { afterEach,describe,expect,it } from 'vitest';
import Dexie from 'dexie';
import { BurrowDatabase, loadSnapshot, saveSnapshot } from '@/lib/db';
import { DEFAULT_PREFERENCES, DEMO_OBJECTS, DEMO_ROOMS } from '@/lib/demo';

const databases:BurrowDatabase[]=[];
afterEach(async()=>{for(const db of databases){db.close();await db.delete();}databases.length=0;});
describe('local persistence',()=>{
  it('seeds an empty database and restores preferences',async()=>{const db=new BurrowDatabase(`test-${Math.random()}`);databases.push(db);const first=await loadSnapshot(db);expect(first.rooms).toHaveLength(3);first.preferences={...first.preferences,trayOpen:true,trayPinned:true};await saveSnapshot(first,db);const next=await loadSnapshot(db);expect(next.preferences.trayOpen).toBe(true);expect(next.preferences.trayPinned).toBe(true);});
  it('persists notes, favorites and bounded recent activity atomically',async()=>{const db=new BurrowDatabase(`test-${Math.random()}`);databases.push(db);const activity=Array.from({length:25},(_,i)=>({id:`a${i}`,objectId:DEMO_OBJECTS[0].id,name:'Search',url:DEMO_OBJECTS[0].url,openedAt:i}));await saveSnapshot({rooms:DEMO_ROOMS,objects:[{...DEMO_OBJECTS[0],favorite:true}],activity,note:'remember this',preferences:DEFAULT_PREFERENCES},db);const loaded=await loadSnapshot(db);expect(loaded.note).toBe('remember this');expect(loaded.objects[0].favorite).toBe(true);expect(loaded.activity).toHaveLength(20);});
  it('restores room ordering by creation time rather than IndexedDB key order',async()=>{const db=new BurrowDatabase(`test-${Math.random()}`);databases.push(db);await saveSnapshot({rooms:[...DEMO_ROOMS].reverse(),objects:[],activity:[],note:'',preferences:DEFAULT_PREFERENCES},db);const loaded=await loadSnapshot(db);expect(loaded.rooms.map(room=>room.id)).toEqual(DEMO_ROOMS.map(room=>room.id));});
  it('migrates incomplete legacy preferences to current defaults',async()=>{const name=`legacy-${Math.random()}`;const legacy=new Dexie(name);legacy.version(1).stores({rooms:'id,createdAt',objects:'id,roomId,url,favorite,createdAt',activity:'id,objectId,openedAt',settings:'key'});await legacy.open();await legacy.table('rooms').put(DEMO_ROOMS[0]);await legacy.table('settings').put({key:'preferences',value:{lastRoomId:'room-home'}});legacy.close();const migrated=new BurrowDatabase(name);databases.push(migrated);const loaded=await loadSnapshot(migrated);expect(loaded.preferences).toEqual({...DEFAULT_PREFERENCES,lastRoomId:'room-home'});});
  it('normalizes legacy collection labels and never persists session rooms',async()=>{const db=new BurrowDatabase(`session-${Math.random()}`);databases.push(db);const temporary={...DEMO_ROOMS[0],id:'session-room',lifecycle:'session' as const};await saveSnapshot({rooms:[...DEMO_ROOMS,temporary],objects:[...DEMO_OBJECTS,{...DEMO_OBJECTS[0],id:'session-object',roomId:temporary.id,lifecycle:'session'}],activity:[],note:'',preferences:DEFAULT_PREFERENCES},db);const loaded=await loadSnapshot(db);expect(loaded.rooms.some(room=>room.id===temporary.id)).toBe(false);expect(loaded.objects.some(object=>object.id==='session-object')).toBe(false);expect(loaded.collections.map(item=>item.name)).toEqual(expect.arrayContaining(['Everyday','Build','Unwind']));});
  it('upgrades a 1.0 Dexie-v4 layout without losing room or object identity',async()=>{
    const name=`layout-v4-${Math.random()}`,legacy=new Dexie(name);
    legacy.version(4).stores({rooms:'id,createdAt,lifecycle,purpose,layoutVersion',objects:'id,roomId,url,favorite,collectionId,lifecycle,createdAt,updatedAt',activity:'id,objectId,openedAt',settings:'key',collections:'id,name,lifecycle,updatedAt',integrations:'id,enabled,updatedAt',integrationCache:'id,integrationId,expiresAt',integrationObjects:'id,integrationId,roomId,kind,lifecycle',calendarSources:'id,kind,enabled,updatedAt',calendarEvents:'id,sourceId,startAt,endAt',feedSources:'id,enabled,updatedAt',feedItems:'id,sourceId,publishedAt,read',notifications:'id,kind,createdAt,dismissedAt',siteIcons:'id,siteUrl,lastUsedAt'});
    await legacy.open();await legacy.table('rooms').put({...DEMO_ROOMS[0],layoutVersion:2,spawn:[0,1.1,5.25]});await legacy.table('objects').put({...DEMO_OBJECTS[0],position:[-4,0,-3]});await legacy.table('settings').put({key:'preferences',value:DEFAULT_PREFERENCES});legacy.close();
    const migrated=new BurrowDatabase(name);databases.push(migrated);const loaded=await loadSnapshot(migrated);
    expect(loaded.rooms[0]).toMatchObject({id:'room-home',layoutVersion:6,spawn:[0,1.1,5.05]});expect(loaded.objects[0].id).toBe('site-search');
  });
  it('migrates layout-v3 mount heights in an existing Dexie-v5 database',async()=>{
    const name=`layout-v5-${Math.random()}`,existing=new BurrowDatabase(name);
    await existing.open();
    await existing.rooms.put({...DEMO_ROOMS[1],layoutVersion:3});
    await existing.objects.put({...DEMO_OBJECTS.find(object=>object.id==='site-github')!,position:[-5.55,1.08,-2.4]});
    await existing.settings.put({key:'preferences',value:DEFAULT_PREFERENCES});
    existing.close();
    const migrated=new BurrowDatabase(name);databases.push(migrated);const loaded=await loadSnapshot(migrated);
    expect(loaded.rooms[0].layoutVersion).toBe(6);
    expect(loaded.objects[0]).toMatchObject({id:'site-github',position:[-6.05,1.15,-2.4]});
    const restored=await migrated.objects.get('site-github');expect(restored?.position).toEqual([-6.05,1.15,-2.4]);
  });
});
