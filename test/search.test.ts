import { describe,expect,it } from 'vitest';
import { buildSearchIndex, searchEntries, webSearchEntry } from '@/lib/search';
import { DEMO_OBJECTS, DEMO_ROOMS } from '@/lib/demo';

describe('Quick Access search',()=>{
  const index=buildSearchIndex(DEMO_OBJECTS,DEMO_ROOMS,[{id:'add',title:'Add website',keywords:'new bookmark'}]);
  it('finds sites, rooms and actions',()=>{expect(searchEntries(index,'git')[0].title).toBe('GitHub');expect(searchEntries(index,'developer studio').some(x=>x.kind==='room')).toBe(true);expect(searchEntries(index,'> add').some(x=>x.id==='add')).toBe(true);});
  it('supports fuzzy ordered characters',()=>expect(searchEntries(index,'gthb')[0].title).toBe('GitHub'));
  it('returns a bounded useful default list',()=>expect(searchEntries(index,'').length).toBeLessThanOrEqual(12));
  it('ranks favorites and usage without hiding collection matches',()=>{
    const objects=DEMO_OBJECTS.map((object,index)=>({...object,favorite:index===2,usageCount:index===2?6:0}));
    const weighted=buildSearchIndex(objects,DEMO_ROOMS,[]);
    expect(searchEntries(weighted,'')[0].id).toBe(objects[2].id);
    expect(searchEntries(weighted,objects[0].collection??'Tools').some(entry=>entry.id===objects[0].id)).toBe(true);
  });
  it('supports command-only filtering and explicit web providers',()=>{expect(searchEntries(index,'> add').every(entry=>entry.kind==='action')).toBe(true);expect(webSearchEntry('g cozy burrows','duckduckgo')?.url).toContain('google.com');expect(webSearchEntry('yt low poly','duckduckgo')?.url).toContain('youtube.com');expect(webSearchEntry('plain query','duckduckgo')?.url).toContain('duckduckgo.com');});
  it('surfaces recent and temporary-session context without displacing exact matches',()=>{
    const temporary={...DEMO_OBJECTS[2],id:'temporary-tab',name:'Active research tab',lifecycle:'session' as const,source:'browser-extension' as const};
    const activity=[{id:'recent',objectId:DEMO_OBJECTS[1].id,name:DEMO_OBJECTS[1].name,url:DEMO_OBJECTS[1].url,openedAt:Date.now()}];
    const contextual=buildSearchIndex([...DEMO_OBJECTS,temporary],DEMO_ROOMS,[],[],activity);
    expect(searchEntries(contextual,'')[0].id).toBe(DEMO_OBJECTS[1].id);expect(contextual.find(entry=>entry.id===temporary.id)?.subtitle).toContain('Temporary session');expect(searchEntries(contextual,'active research')[0].id).toBe(temporary.id);
  });
});
