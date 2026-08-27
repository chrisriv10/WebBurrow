import { describe,expect,it } from 'vitest';
import { buildSearchIndex, searchEntries } from '@/lib/search';
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
});
