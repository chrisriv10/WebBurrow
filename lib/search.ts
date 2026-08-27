import type { BookmarkObject, Room } from './types';

export type SearchEntry = { id:string; kind:'site'|'room'|'action'; title:string; subtitle:string; keywords:string; priority:number; action?:string };
export function buildSearchIndex(objects:BookmarkObject[],rooms:Room[],actions:{id:string;title:string;keywords:string}[]):SearchEntry[] {
  return [...objects.map(o=>({id:o.id,kind:'site' as const,title:o.name,subtitle:`${o.collection?`${o.collection} · `:''}${new URL(o.url).hostname}`,keywords:`${o.name} ${o.url} ${o.archetype} ${o.collection??''}`,priority:(o.favorite?12:0)+Math.min(o.usageCount,8)})),...rooms.map(r=>({id:r.id,kind:'room' as const,title:r.name,subtitle:`${r.template} room`,keywords:`${r.name} ${r.template} room switch travel`,priority:4})),...actions.map(a=>({id:a.id,kind:'action' as const,title:a.title,subtitle:'Command',keywords:`${a.title} ${a.keywords}`,action:a.id,priority:2}))];
}
export function searchEntries(entries:SearchEntry[],query:string):SearchEntry[] {
  const q=query.trim().toLowerCase().replace(/^>/,'').trim();
  if(!q) return [...entries].sort((a,b)=>b.priority-a.priority||a.title.localeCompare(b.title)).slice(0,12);
  const tokens=q.split(/\s+/);
  return entries.map(entry=>{const hay=`${entry.title} ${entry.keywords}`.toLowerCase(); let score=entry.priority*.25; for(const token of tokens){if(entry.title.toLowerCase().startsWith(token))score+=8;if(hay.includes(token))score+=4;let index=0;for(const char of token){index=hay.indexOf(char,index);if(index<0){score=-999;break;}index++;score+=.25;}}return{entry,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.entry.title.localeCompare(b.entry.title)).map(x=>x.entry).slice(0,18);
}
