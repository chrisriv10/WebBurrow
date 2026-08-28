import type { BookmarkObject, Preferences, Room } from './types';

export type SearchKind='site'|'room'|'collection'|'action'|'integration'|'event'|'feed'|'notification'|'web';
export type SearchEntry={id:string;kind:SearchKind;title:string;subtitle:string;keywords:string;priority:number;action?:string;url?:string};
export function buildSearchIndex(objects:BookmarkObject[],rooms:Room[],actions:{id:string;title:string;keywords:string}[],extras:SearchEntry[]=[]):SearchEntry[]{
  return [...objects.map(object=>({id:object.id,kind:'site' as const,title:object.name,subtitle:`${object.collection?`${object.collection} · `:''}${new URL(object.url).hostname}`,keywords:`${object.name} ${object.url} ${object.archetype} ${object.collection??''} ${object.favorite?'favorite':''}`,priority:(object.favorite?12:0)+Math.min(object.usageCount,8),url:object.url})),
    ...rooms.map(room=>({id:room.id,kind:'room' as const,title:room.name,subtitle:room.lifecycle==='session'?'Temporary browser workspace':`${room.template} room`,keywords:`${room.name} ${room.template} room switch travel ${room.lifecycle}`,priority:room.lifecycle==='session'?7:4})),
    ...actions.map(action=>({id:action.id,kind:'action' as const,title:action.title,subtitle:'Command',keywords:`${action.title} ${action.keywords}`,action:action.id,priority:2})),...extras];
}

export function searchEntries(entries:SearchEntry[],query:string):SearchEntry[]{
  const command=query.trim().startsWith('>');const q=query.trim().toLowerCase().replace(/^>/,'').trim();const candidates=command?entries.filter(entry=>entry.kind==='action'):entries;
  if(!q)return[...candidates].sort((a,b)=>b.priority-a.priority||a.title.localeCompare(b.title)).slice(0,12);
  const tokens=q.split(/\s+/);return candidates.map(entry=>{const hay=`${entry.title} ${entry.keywords}`.toLowerCase();let score=entry.priority*.25;for(const token of tokens){if(entry.title.toLowerCase().startsWith(token))score+=8;if(hay.includes(token))score+=4;let index=0;for(const character of token){index=hay.indexOf(character,index);if(index<0){score=-999;break;}index++;score+=.25;}}return{entry,score};}).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.entry.title.localeCompare(b.entry.title)).map(item=>item.entry).slice(0,18);
}

const PROVIDERS:Record<Preferences['searchProvider'],{name:string;url:string}>={duckduckgo:{name:'DuckDuckGo',url:'https://duckduckgo.com/?q='},google:{name:'Google',url:'https://www.google.com/search?q='},bing:{name:'Bing',url:'https://www.bing.com/search?q='}};
export function webSearchEntry(query:string,provider:Preferences['searchProvider']):SearchEntry|null {
  const trimmed=query.trim();if(!trimmed||trimmed.startsWith('>'))return null;const prefix=trimmed.match(/^(g|yt|gh)\s+(.+)$/i);const term=prefix?.[2]?.trim()||trimmed;let target=PROVIDERS[provider];
  if(prefix?.[1].toLowerCase()==='g')target=PROVIDERS.google;
  if(prefix?.[1].toLowerCase()==='yt')target={name:'YouTube',url:'https://www.youtube.com/results?search_query='};
  if(prefix?.[1].toLowerCase()==='gh')target={name:'GitHub',url:'https://github.com/search?q='};
  if(!term)return null;const url=`${target.url}${encodeURIComponent(term)}`;return{id:`web:${url}`,kind:'web',title:`Search ${target.name} for “${term}”`,subtitle:'External web search',keywords:`web search ${target.name} ${term}`,priority:-4,url};
}
