import { beforeEach,describe,expect,it } from 'vitest';
import { useBurrow } from '@/store/use-burrow';
import { DEFAULT_PREFERENCES, DEMO_OBJECTS, DEMO_ROOMS } from '@/lib/demo';

beforeEach(()=>{
  useBurrow.setState({
    ready:true,rooms:structuredClone(DEMO_ROOMS),objects:structuredClone(DEMO_OBJECTS),activity:[],note:'',siteIcons:[],browserWorkspaces:[],arrivalIds:[],notifications:[],
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
    const preferences=useBurrow.getState().preferences;expect(preferences.recentSearches).toHaveLength(6);expect(preferences.recentSearches[0]).toBe('query 8');expect(preferences).toMatchObject({trayOpen:true,trayPinned:true,reducedEffects:true});expect(preferences.onboardingMilestones).toContain('tray');
  });

  it('keeps sound muted by default and persists gesture-gated sound and guidance choices',()=>{
    expect(useBurrow.getState().preferences.soundEnabled).toBe(false);
    useBurrow.getState().setSoundPreferences({soundEnabled:true,soundVolume:.35,ambienceEnabled:true});
    useBurrow.getState().completeOnboarding('quick-access');useBurrow.getState().completeOnboarding('quick-access');useBurrow.getState().setEditMode(true);
    expect(useBurrow.getState().preferences).toMatchObject({soundEnabled:true,soundVolume:.35,ambienceEnabled:true});
    expect(useBurrow.getState().preferences.onboardingMilestones.filter(item=>item==='quick-access')).toHaveLength(1);
    expect(useBurrow.getState().preferences.onboardingMilestones).toContain('edit');
    useBurrow.getState().resetOnboarding();expect(useBurrow.getState().preferences).toMatchObject({hasEntered:false,onboardingMilestones:[]});
  });

  it('applies curated room customization without replacing untouched appearance fields',()=>{
    const room=DEMO_ROOMS[0];const original=room.appearance;
    useBurrow.getState().customizeRoom(room.id,{name:'Quiet Den',accent:'#6dd7d7',appearance:{wall:'soft-slate',decor:'minimal'}});
    expect(useBurrow.getState().rooms[0]).toMatchObject({name:'Quiet Den',accent:'#6dd7d7',appearance:{wall:'soft-slate',decor:'minimal',floor:original.floor,lighting:original.lighting}});
    expect(useBurrow.getState().toast).toBe('Room style updated.');
  });

  it('creates temporary tab workspaces and can convert them permanently',()=>{
    useBurrow.getState().receiveBrowserTabs('Focus set',[{title:'Docs',url:'https://example.com/docs'},{title:'Unsafe',url:'file:///C:/secret.txt'}]);
    const room=useBurrow.getState().rooms.at(-1)!;expect(room.lifecycle).toBe('session');expect(useBurrow.getState().objects.filter(item=>item.roomId===room.id)).toHaveLength(1);
    useBurrow.getState().keepSessionRoom(room.id);expect(useBurrow.getState().rooms.find(item=>item.id===room.id)?.lifecycle).toBe('permanent');expect(useBurrow.getState().objects.find(item=>item.roomId===room.id)?.lifecycle).toBe('permanent');
  });

  it('accepts only bounded companion icons and keeps them in the separate local cache',()=>{
    useBurrow.getState().receiveBrowserPage({title:'With icon',url:'https://example.com/icon',favicon:{mime:'image/png',dataBase64:Buffer.from('icon fixture').toString('base64')}});
    const object=useBurrow.getState().objects.at(-1)!;expect(object.siteIconId).toBeTruthy();expect(useBurrow.getState().siteIcons).toHaveLength(1);expect(useBurrow.getState().siteIcons[0]).toMatchObject({siteUrl:'https://example.com/icon',mimeType:'image/png'});
  });

  it('appends, promotes and clears temporary browser workspaces without persisting tab identity',()=>{
    const state=useBurrow.getState();state.receiveBrowserTabs('Research',[{title:'One',url:'https://example.com/one',tabId:4,windowId:2}],{scope:'window'});
    const workspace=useBurrow.getState().browserWorkspaces.at(-1)!;
    useBurrow.getState().receiveBrowserTabs('Research',[{title:'Two',url:'https://example.com/two',tabId:5,groupId:3,groupName:'Sources'}],{workspaceId:workspace.id,mode:'append',scope:'group'});
    const items=useBurrow.getState().objects.filter(item=>item.roomId===workspace.roomId);expect(items).toHaveLength(2);expect(items[1].browserReference?.groupName).toBe('Sources');
    useBurrow.getState().promoteSessionItems([items[0].id],DEMO_ROOMS[0].id,'Saved research');
    const promoted=useBurrow.getState().objects.find(item=>item.id===items[0].id)!;expect(promoted.lifecycle).toBe('permanent');expect(promoted.browserReference).toBeUndefined();expect(promoted.collection).toBe('Saved research');
    useBurrow.getState().clearWorkspace(workspace.id);expect(useBurrow.getState().rooms.some(room=>room.id===workspace.roomId)).toBe(false);expect(useBurrow.getState().objects.some(item=>item.id===promoted.id)).toBe(true);
  });

  it('bounds and deduplicates local notifications',()=>{
    for(let index=0;index<110;index++)useBurrow.getState().notify({kind:'info',title:`Notice ${index}`,body:'Local update',dedupeKey:`notice:${index}`});
    useBurrow.getState().notify({kind:'warning',title:'Replacement',body:'Updated',dedupeKey:'notice:109'});
    const notes=useBurrow.getState().notifications;expect(notes).toHaveLength(100);expect(notes.filter(item=>item.dedupeKey==='notice:109')).toHaveLength(1);expect(notes[0].title).toBe('Replacement');
  });
});
