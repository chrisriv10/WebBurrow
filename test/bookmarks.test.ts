// @vitest-environment jsdom
import { describe,expect,it } from 'vitest';
import { parseBookmarksHtml } from '@/lib/bookmarks';

describe('Netscape bookmark import',()=>{
  it('parses nested folders and valid links once',()=>{const result=parseBookmarksHtml(`<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><DT><H3>Work</H3><DL><DT><A HREF="https://github.com/#top">GitHub</A><DT><H3>Docs</H3><DL><DT><A HREF="https://developer.mozilla.org/">MDN</A></DL></DL></DL>`);expect(result.bookmarks.map(x=>x.title)).toEqual(expect.arrayContaining(['GitHub','MDN']));expect(result.bookmarks).toHaveLength(2);expect(result.folders).toContain('Work');expect(result.bookmarks.find(x=>x.title==='MDN')?.folderPath).toEqual(['Work','Docs']);});
  it('reports empty and malformed files without throwing',()=>{expect(parseBookmarksHtml('').warnings[0]).toMatch(/empty/);expect(parseBookmarksHtml('<p>hello</p>').warnings[0]).toMatch(/No Netscape/);});
  it('skips invalid or unsafe bookmark URLs',()=>{const result=parseBookmarksHtml('<DL><DT><A HREF="javascript:alert(1)">Bad</A></DL>');expect(result.bookmarks).toHaveLength(0);expect(result.warnings[0]).toMatch(/http/);});
});
