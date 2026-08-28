import { beforeEach,describe,expect,it } from 'vitest';
import { useBurrow } from '@/store/use-burrow';
import { DEFAULT_PREFERENCES, DEMO_OBJECTS, DEMO_ROOMS } from '@/lib/demo';

beforeEach(()=>{
  useBurrow.setState({
    ready:true,rooms:structuredClone(DEMO_ROOMS),objects:structuredClone(DEMO_OBJECTS),activity:[],note:'',
    preferences:structuredClone(DEFAULT_PREFERENCES),currentRoomId:DEMO_ROOMS[0].id,modal:null,launcherOpen:false,
    editMode:false,selectedId:null,nearObjectId:null,toast:null,undoObject:null,
  });
});

describe('Burrow domain actions',()=>{
  it('creates, renames, travels to and safely deletes rooms',()=>{
    const state=useBurrow.getState();state.createRoom('Research Lab','studio','#67d8ee');
    const created=useBurrow.getState().rooms.at(-1)!;expect(created.name).toBe('Research Lab');expect(useBurrow.getState().currentRoomId).toBe(created.id);
    useBurrow.getState().renameRoom(created.id,'Reading Room');expect(useBurrow.getState().rooms.at(-1)?.name).toBe('Reading Room');
    useBurrow.getState().deleteRoom(created.id);expect(useBurrow.getState().rooms.some(room=>room.id===created.id)).toBe(false);
  });

  it('adds metadata-rich sites, duplicates them, and assigns valid placements',()=>{
    const before=useBurrow.getState().objects.length;
    useBurrow.getState().addSite({name:'Example',url:'example.com',roomId:DEMO_ROOMS[0].id,archetype:'laptop',color:'#8be6ff',favorite:true,collection:'Research',note:'Useful reference'});
    const added=useBurrow.getState().objects.at(-1)!;expect(added.url).toBe('https://example.com/');expect(added.collection).toBe('Research');expect(added.note).toBe('Useful reference');
    useBurrow.getState().duplicateSite(added.id);expect(useBurrow.getState().objects).toHaveLength(before+2);expect(useBurrow.getState().objects.at(-1)?.favorite).toBe(false);
  });

  it('persists bounded recent searches and tray preferences in session state',()=>{
    for(let index=0;index<9;index++)useBurrow.getState().rememberSearch(`query ${index}`);
    useBurrow.getState().setTrayOpen(true);useBurrow.getState().setTrayPinned(true);useBurrow.getState().setReducedEffects(true);
    const preferences=useBurrow.getState().preferences;expect(preferences.recentSearches).toHaveLength(6);expect(preferences.recentSearches[0]).toBe('query 8');expect(preferences).toMatchObject({trayOpen:true,trayPinned:true,reducedEffects:true});
  });

  it('creates temporary tab workspaces and can convert them permanently',()=>{
    useBurrow.getState().receiveBrowserTabs('Focus set',[{title:'Docs',url:'https://example.com/docs'},{title:'Unsafe',url:'file:///C:/secret.txt'}]);
    const room=useBurrow.getState().rooms.at(-1)!;expect(room.lifecycle).toBe('session');expect(useBurrow.getState().objects.filter(item=>item.roomId===room.id)).toHaveLength(1);
    useBurrow.getState().keepSessionRoom(room.id);expect(useBurrow.getState().rooms.find(item=>item.id===room.id)?.lifecycle).toBe('permanent');expect(useBurrow.getState().objects.find(item=>item.roomId===room.id)?.lifecycle).toBe('permanent');
  });

  it('bounds and deduplicates local notifications',()=>{
    for(let index=0;index<110;index++)useBurrow.getState().notify({kind:'info',title:`Notice ${index}`,body:'Local update',dedupeKey:`notice:${index}`});
    useBurrow.getState().notify({kind:'warning',title:'Replacement',body:'Updated',dedupeKey:'notice:109'});
    const notes=useBurrow.getState().notifications;expect(notes).toHaveLength(100);expect(notes.filter(item=>item.dedupeKey==='notice:109')).toHaveLength(1);expect(notes[0].title).toBe('Replacement');
  });
});
