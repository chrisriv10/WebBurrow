import type { BookmarkObject, Room } from './types';

export type SearchEntry = { id:string; kind:'site'|'room'|'action'; title:string; subtitle:string; keywords:string; action?:string };
export function buildSearchIndex(objects:BookmarkObject[],rooms:Room[],actions:{id:string;title:string;keywords:string}[]):SearchEntry[] {
  return [...objects.map(o=>({id:o.id,kind:'site' as const,title:o.name,subtitle:new URL(o.url).hostname,keywords:`${o.name} ${o.url} ${o.archetype}`})),...rooms.map(r=>({id:r.id,kind:'room' as const,title:r.name,subtitle:'Room',keywords:`${r.name} ${r.template} room`})),...actions.map(a=>({id:a.id,kind:'action' as const,title:a.title,subtitle:'Action',keywords:`${a.title} ${a.keywords}`,action:a.id}))];
}
export function searchEntries(entries:SearchEntry[],query:string):SearchEntry[] {
  const q=query.trim().toLowerCase().replace(/^>/,'').trim();
  if(!q) return entries.slice(0,12);
  const tokens=q.split(/\s+/);
  return entries.map(entry=>{const hay=`${entry.title} ${entry.keywords}`.toLowerCase(); let score=0; for(const token of tokens){if(entry.title.toLowerCase().startsWith(token))score+=8;if(hay.includes(token))score+=4;let index=0;for(const char of token){index=hay.indexOf(char,index);if(index<0){score=-999;break;}index++;score+=.25;}}return{entry,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.entry.title.localeCompare(b.entry.title)).map(x=>x.entry).slice(0,18);
}
