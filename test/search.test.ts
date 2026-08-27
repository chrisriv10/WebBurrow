import { describe,expect,it } from 'vitest';
import { buildSearchIndex, searchEntries } from '@/lib/search';
import { DEMO_OBJECTS, DEMO_ROOMS } from '@/lib/demo';

describe('Quick Access search',()=>{
  const index=buildSearchIndex(DEMO_OBJECTS,DEMO_ROOMS,[{id:'add',title:'Add website',keywords:'new bookmark'}]);
  it('finds sites, rooms and actions',()=>{expect(searchEntries(index,'git')[0].title).toBe('GitHub');expect(searchEntries(index,'developer studio').some(x=>x.kind==='room')).toBe(true);expect(searchEntries(index,'> add').some(x=>x.id==='add')).toBe(true);});
  it('supports fuzzy ordered characters',()=>expect(searchEntries(index,'gthb')[0].title).toBe('GitHub'));
  it('returns a bounded useful default list',()=>expect(searchEntries(index,'').length).toBeLessThanOrEqual(12));
});
