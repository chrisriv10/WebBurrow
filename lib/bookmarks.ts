import { normalizeUrl } from './url';

export type ParsedBookmark = { id:string; title:string; url:string; folderPath:string[]; selected:boolean; warning?:string };
export type BookmarkParseResult = { bookmarks:ParsedBookmark[]; folders:string[]; warnings:string[] };

export function parseBookmarksHtml(html:string):BookmarkParseResult {
  if (!html.trim()) return {bookmarks:[],folders:[],warnings:['The selected file is empty.']};
  const doc = new DOMParser().parseFromString(html,'text/html');
  const bookmarks:ParsedBookmark[]=[]; const folders=new Set<string>(); const warnings:string[]=[];
  function walk(root:Element,path:string[]) {
    const children=Array.from(root.children);
    const consumed=new Set<Element>();
    for(const child of children) {
      if(consumed.has(child)) continue;
      const tag=child.tagName.toLowerCase();
      if(tag==='dt') {
        const folder=Array.from(child.children).find((c)=>c.tagName.toLowerCase()==='h3');
        const link=Array.from(child.children).find((c)=>c.tagName.toLowerCase()==='a') as HTMLAnchorElement|undefined;
        const nested=Array.from(child.children).find((c)=>c.tagName.toLowerCase()==='dl');
        if(folder) {
          const name=folder.textContent?.trim()||'Untitled folder'; const next=[...path,name]; folders.add(next.join(' / '));
          if(nested) { consumed.add(nested); walk(nested,next); }
          else { const sibling=child.nextElementSibling; if(sibling?.tagName.toLowerCase()==='dl') { consumed.add(sibling); walk(sibling,next); } }
        } else if(link) {
          const raw=link.getAttribute('href')||'';
          try { const url=normalizeUrl(raw); bookmarks.push({id:crypto.randomUUID(),title:link.textContent?.trim()||new URL(url).hostname,url,folderPath:path,selected:true}); }
          catch(error) { const message=error instanceof Error?error.message:'Invalid URL'; warnings.push(`${link.textContent?.trim()||'Untitled'}: ${message}`); }
        }
      } else if(tag==='dl') walk(child,path);
    }
  }
  const roots=Array.from(doc.querySelectorAll<HTMLElement>('dl')).filter((dl)=>!dl.parentElement?.closest('dl'));
  if(roots.length) roots.forEach((root)=>walk(root,[])); else warnings.push('No Netscape bookmark list was detected.');
  return {bookmarks,folders:Array.from(folders),warnings};
}
