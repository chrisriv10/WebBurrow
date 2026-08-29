'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, Check, ChevronRight, CircleDot, Compass, ExternalLink,
  Folder, FolderPlus, Globe2, Home, ListFilter, MapPin, Monitor,
  MoveRight, Palette, Plus, Search, Settings2, Sparkles, Star, Tag, Trash2, X, Zap,
} from 'lucide-react';
import { useBurrow } from '@/store/use-burrow';
import { buildSearchIndex, searchEntries, webSearchEntry, type SearchEntry } from '@/lib/search';
import { integrationAdapters } from '@/lib/integrations/registry';
import { siteIdentity } from '@/lib/site-identity';
import { localAsset } from '@/lib/assets';
import type { Archetype, BookmarkObject, BrowserWorkspace, Room } from '@/lib/types';

type NavigatorSection='home'|'favorites'|'recent'|'collections'|'rooms'|'sessions'|'integrations';
type GroupBy='relevance'|'domain'|'room'|'collection'|'session';
type NavEntry=SearchEntry & {group?:string};

const sectionItems:[NavigatorSection,string,typeof Home][]=[
  ['home','Home',Home],['favorites','Favorites',Star],['recent','Recent',Archive],['collections','Collections',Folder],
  ['rooms','Rooms',MapPin],['sessions','Sessions',Monitor],['integrations','Integrations',Zap],
];
const archetypes:Archetype[]=['terminal','tv','book','poster','arcade','pedestal','laptop','radio','file-box','desk-monitor','wall-display','tablet','compact-portal'];
const actionEntries=[
  {id:'nav:add',title:'Add a website',keywords:'new bookmark site'},
  {id:'nav:customize',title:'Customize current room',keywords:'room style wall floor lighting'},
  {id:'nav:quick-access',title:'Open Quick Access',keywords:'instant command palette ctrl k'},
  {id:'nav:research',title:'Create research workspace',keywords:'temporary browser tabs workspace links'},
];

function domainOf(url:string){try{return new URL(url).hostname.replace(/^www\./,'');}catch{return 'Web link';}}
function groupFor(entry:NavEntry,objects:BookmarkObject[],rooms:Room[],workspaces:BrowserWorkspace[],groupBy:GroupBy){
  if(groupBy==='relevance')return '';
  if(entry.kind==='site'){
    const object=objects.find(item=>item.id===entry.id);
    if(!object)return 'Other';
    if(groupBy==='domain')return domainOf(object.url);
    if(groupBy==='room')return rooms.find(room=>room.id===object.roomId)?.name||'Unknown room';
    if(groupBy==='collection')return object.collection||'Unsorted';
    if(groupBy==='session')return object.lifecycle==='session'?(workspaces.find(item=>item.id===object.browserReference?.workspaceId)?.name||'Temporary session'):'Permanent sites';
  }
  if(entry.kind==='room')return groupBy==='session'?'Rooms':entry.subtitle;
  if(entry.kind==='session')return 'Temporary browser sessions';
  if(entry.kind==='collection')return 'Collections';
  if(entry.kind==='integration')return 'Connected integrations';
  return 'Commands';
}

function entryKindLabel(kind:NavEntry['kind']){
  if(kind==='site')return 'Site';
  if(kind==='room')return 'Room';
  if(kind==='collection')return 'Collection';
  if(kind==='session')return 'Session';
  if(kind==='integration')return 'Integration';
  if(kind==='web')return 'Web search';
  return 'Command';
}

function VisualMark({entry,object}:{entry:NavEntry;object?:BookmarkObject}){
  const identity=object?siteIdentity(object):null;
  const icon=object?.icon&&object.icon!=='globe'?object.icon:null;
  const logo=identity&&identity.brand!=='generic'?localAsset(`site-logos/${identity.brand}.svg`):null;
  return <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[.06] text-cyan-100" style={{boxShadow:`inset 0 0 22px ${object?.color||'#78dbea'}18`}}>
    {logo?<span className="block h-6 w-6 bg-contain bg-center bg-no-repeat" style={{backgroundImage:`url(${logo})`}}/>:icon?<span className="text-lg">{icon}</span>:identity?<span className="mono text-[10px] font-semibold">{identity.monogram}</span>:entry.kind==='room'?<Home size={17}/>:entry.kind==='session'?<Monitor size={17}/>:entry.kind==='collection'?<Folder size={17}/>:entry.kind==='integration'?<Zap size={17}/>:entry.kind==='web'?<Globe2 size={17}/>:<Sparkles size={17}/>} 
  </span>;
}

function DropTarget({label,icon:Icon,onDrop}:{label:string;icon:typeof Folder;onDrop:(id:string)=>void}){
  const [over,setOver]=useState(false);
  return <button onDragOver={event=>{event.preventDefault();setOver(true);}} onDragLeave={()=>setOver(false)} onDrop={event=>{event.preventDefault();setOver(false);const id=event.dataTransfer.getData('text/webburrow-object');if(id)onDrop(id);}} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${over?'bg-cyan-200/15 text-cyan-100':'text-white/45 hover:bg-white/5 hover:text-white/75'}`}><Icon size={13}/><span className="min-w-0 flex-1 truncate">{label}</span><MoveRight size={11} className="text-white/20"/></button>;
}

export function Navigator(){
  const state=useBurrow();
  const input=useRef<HTMLInputElement>(null);
  const [section,setSection]=useState<NavigatorSection>('home');
  const [query,setQuery]=useState('');
  const [selectedKey,setSelectedKey]=useState('');
  const [cursor,setCursor]=useState(0);
  const [groupBy,setGroupBy]=useState<GroupBy>('relevance');
  const [researchLinks,setResearchLinks]=useState('');
  const objects=state.objects,rooms=state.rooms,collections=state.collections,workspaces=state.browserWorkspaces;
  const recentIds=useMemo(()=>new Set(state.activity.map(item=>item.objectId)),[state.activity]);
  const entries=useMemo<NavEntry[]>(()=>{
    const collectionEntries=collections.map(collection=>({id:`collection:${collection.id}`,kind:'collection' as const,title:collection.name,subtitle:`${objects.filter(object=>object.collectionId===collection.id||object.collection===collection.name).length} sites · ${collection.lifecycle==='session'?'Temporary collection':'Collection'}`,keywords:`${collection.name} collection ${collection.lifecycle}`,priority:6}));
    const sessionEntries=workspaces.map(workspace=>({id:`session:${workspace.id}`,kind:'session' as const,title:workspace.name,subtitle:`${objects.filter(object=>object.roomId===workspace.roomId).length} temporary tabs · ${workspace.sourceScope}`,keywords:`${workspace.name} browser tabs temporary workspace session`,priority:8}));
    const integrationEntries=integrationAdapters.map(adapter=>({id:`integration:${adapter.id}`,kind:'integration' as const,title:adapter.name,subtitle:adapter.description,keywords:`${adapter.name} ${adapter.description} integration connected`,priority:4}));
    const commandEntries=actionEntries.map(action=>({...action,kind:'action' as const,subtitle:'Navigator command',priority:3}));
    return buildSearchIndex(objects,rooms,commandEntries,[...collectionEntries,...sessionEntries,...integrationEntries],state.activity) as NavEntry[];
  },[collections,objects,rooms,state.activity,workspaces]);
  const visibleEntries=useMemo(()=>{
    const filtered=entries.filter(entry=>{
      if(section==='favorites')return entry.kind==='site'&&objects.find(object=>object.id===entry.id)?.favorite;
      if(section==='recent')return entry.kind==='site'&&recentIds.has(entry.id);
      if(section==='collections')return entry.kind==='collection'||(entry.kind==='site'&&Boolean(objects.find(object=>object.id===entry.id)?.collection));
      if(section==='rooms')return entry.kind==='room';
      if(section==='sessions')return entry.kind==='session'||(entry.kind==='site'&&objects.find(object=>object.id===entry.id)?.lifecycle==='session');
      if(section==='integrations')return entry.kind==='integration';
      return true;
    });
    const found=searchEntries(filtered,query) as NavEntry[];
    const web=query.trim()&&!query.trim().startsWith('>')?webSearchEntry(query,state.preferences.searchProvider):null;
    return web?[...found,web as NavEntry]:found;
  },[entries,objects,query,recentIds,section,state.preferences.searchProvider]);
  const grouped=useMemo(()=>{
    const groups=new Map<string,NavEntry[]>();
    for(const entry of visibleEntries){const group=groupFor(entry,objects,rooms,workspaces,groupBy);const list=groups.get(group)||[];list.push({...entry,group});groups.set(group,list);}
    return [...groups.entries()];
  },[groupBy,objects,rooms,visibleEntries,workspaces]);
  const flatVisible=useMemo(()=>grouped.flatMap(([,items])=>items),[grouped]);
  const boundedCursor=Math.min(cursor,Math.max(flatVisible.length-1,0));
  const selected=flatVisible.find(entry=>`${entry.kind}:${entry.id}`===selectedKey)||flatVisible[boundedCursor];
  const selectedObject=selected?.kind==='site'?objects.find(object=>object.id===selected.id):undefined;
  const selectedWorkspace=selected?.kind==='session'?workspaces.find(workspace=>`session:${workspace.id}`===selected.id):undefined;
  const selectEntry=(entry:NavEntry)=>{setSelectedKey(`${entry.kind}:${entry.id}`);setCursor(Math.max(0,flatVisible.findIndex(item=>item.id===entry.id&&item.kind===entry.kind)));};
  useEffect(()=>{const frame=requestAnimationFrame(()=>input.current?.focus());return()=>cancelAnimationFrame(frame);},[]);
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){state.openModal(null);return;}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='l'){event.preventDefault();input.current?.focus();input.current?.select();return;}if(event.target instanceof HTMLElement&&event.target.matches('textarea,select'))return;if(event.key==='ArrowDown'){event.preventDefault();setCursor(value=>Math.min(value+1,Math.max(flatVisible.length-1,0)));}if(event.key==='ArrowUp'){event.preventDefault();setCursor(value=>Math.max(value-1,0));}if(event.key==='Enter'&&selected){event.preventDefault();activate(selected);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
  const dropToRoom=(id:string,roomId:string)=>{state.updateSite(id,{roomId});setSection('rooms');};
  const dropToCollection=(id:string,name:string)=>{state.updateSite(id,{collection:name});setSection('collections');};
  function activate(entry:NavEntry){
    if(entry.kind==='site'){state.openSite(entry.id);return;}
    if(entry.kind==='room'){state.setCurrentRoom(entry.id);state.openModal(null);return;}
    if(entry.kind==='web'&&entry.url){state.openUrl(entry.url);return;}
    if(entry.kind==='action'){
      if(entry.id==='nav:add')state.openModal('add-site');
      if(entry.id==='nav:customize')state.openModal('customize-room');
      if(entry.id==='nav:quick-access'){state.openModal(null);state.setLauncher(true);}
      if(entry.id==='nav:research')setSection('sessions');
      return;
    }
    if(entry.kind==='session'){setSection('sessions');return;}
    if(entry.kind==='collection'){setSection('collections');return;}
    if(entry.kind==='integration'){state.openModal('integrations');return;}
  }
  const createResearch=()=>{
    const tabs=researchLinks.split(/[\n,]+/).map(value=>value.trim()).filter(Boolean).flatMap(url=>{try{const parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol))return[];return[{title:parsed.hostname,url:parsed.toString()}];}catch{return[];}});
    if(!tabs.length){state.setToast('Add one or more http(s) links for the research workspace.');return;}
    state.receiveBrowserTabs('Research workspace',tabs,{scope:'selection',mode:'create'});tabs.forEach(tab=>state.openUrl(tab.url));setResearchLinks('');setSection('sessions');
  };
  const currentCollection=selectedObject?.collection||'';
  return <div className="absolute inset-0 z-40 bg-[#050611]/76 p-3 backdrop-blur-md md:p-6" role="dialog" aria-modal="true" aria-label="Navigator">
    <section className="mx-auto flex h-full max-w-[1480px] flex-col overflow-hidden rounded-[28px] border border-white/12 bg-[#0b0e1b]/[.98] shadow-[0_30px_100px_rgba(0,0,0,.58)]">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/8 px-4 py-3 md:px-6 md:py-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-200/10 text-cyan-100"><Compass size={19}/></span><div className="min-w-0"><p className="mono text-[9px] uppercase tracking-[.22em] text-cyan-200/65">WebBurrow command center</p><h1 className="truncate text-lg font-semibold tracking-[-.03em]">Navigator</h1></div><div className="relative ml-auto hidden min-w-0 flex-1 max-w-xl md:block"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16}/><input ref={input} value={query} onChange={event=>{setQuery(event.target.value);setCursor(0);}} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'||event.key==='Enter')event.preventDefault();}} placeholder="Search sites, rooms, sessions, integrations, commands, or the web…" className="h-11 w-full rounded-xl border border-white/12 bg-white/[.055] pl-10 pr-20 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-200/45" aria-label="Navigator search"/><kbd className="mono pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-white/8 px-2 py-1 text-[9px] text-white/35">Ctrl L</kbd></div><button onClick={()=>state.openModal(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/6 text-white/55 hover:bg-white/10 hover:text-white" aria-label="Close Navigator"><X size={17}/></button></header>
      <div className="relative block shrink-0 border-b border-white/8 p-3 md:hidden"><Search className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={16}/><input value={query} onChange={event=>{setQuery(event.target.value);setCursor(0);}} placeholder="Search your Burrow…" className="h-11 w-full rounded-xl border border-white/12 bg-white/[.055] pl-10 text-sm text-white outline-none placeholder:text-white/30" aria-label="Navigator search"/></div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[190px_minmax(0,1fr)_330px]">
        <aside className="hidden min-h-0 overflow-y-auto border-r border-white/8 p-3 lg:block"><p className="mono mb-2 px-2 text-[9px] uppercase tracking-[.18em] text-white/28">Explore</p><nav className="space-y-1">{sectionItems.map(([id,label,Icon])=><button key={id} onClick={()=>{setSection(id);setCursor(0);}} className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition ${section===id?'bg-cyan-200/12 text-cyan-100':'text-white/45 hover:bg-white/5 hover:text-white/75'}`}><Icon size={15}/><span className="flex-1">{label}</span>{id==='favorites'&&<span className="mono text-[9px] text-white/25">{objects.filter(object=>object.favorite).length}</span>}{id==='sessions'&&<span className="mono text-[9px] text-white/25">{workspaces.length}</span>}</button>)}</nav><div className="my-4 border-t border-white/8"/><p className="mono mb-2 px-2 text-[9px] uppercase tracking-[.18em] text-white/28">Drop to organize</p><div className="space-y-1">{rooms.filter(room=>room.lifecycle==='permanent').map(room=><DropTarget key={room.id} label={room.name} icon={Home} onDrop={id=>dropToRoom(id,room.id)}/>)}{collections.filter(collection=>collection.lifecycle==='permanent').map(collection=><DropTarget key={collection.id} label={collection.name} icon={Folder} onDrop={id=>dropToCollection(id,collection.name)}/>)}</div><button onClick={()=>state.openModal('customize-room')} className="mt-4 flex w-full items-center gap-2 rounded-xl border border-white/9 bg-white/[.035] px-3 py-2.5 text-left text-xs text-white/50 hover:border-cyan-200/30 hover:text-cyan-100"><Palette size={14}/>Customize room</button></aside>
        <main className="min-h-0 overflow-y-auto p-3 md:p-5"><div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">{sectionItems.map(([id,label,Icon])=><button key={id} onClick={()=>setSection(id)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] ${section===id?'bg-cyan-200/12 text-cyan-100':'bg-white/[.035] text-white/45'}`}><Icon size={12}/>{label}</button>)}</div><div className="mb-4 flex flex-wrap items-center gap-2"><div className="flex items-center gap-2 text-xs text-white/42"><ListFilter size={14}/><span>{visibleEntries.length} results</span></div><div className="ml-auto flex items-center gap-2"><label className="sr-only" htmlFor="navigator-group">Group results by</label><select id="navigator-group" value={groupBy} onChange={event=>setGroupBy(event.target.value as GroupBy)} className="rounded-lg border border-white/10 bg-[#171b2b] px-2.5 py-1.5 text-[10px] text-white/65 outline-none"><option value="relevance">Best match</option><option value="domain">Group by domain</option><option value="room">Group by room</option><option value="collection">Group by collection</option><option value="session">Group by session</option></select><button onClick={()=>setSection('sessions')} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200/15 bg-violet-200/8 px-2.5 py-1.5 text-[10px] text-violet-100"><Plus size={12}/>Research workspace</button></div></div>{query&&!visibleEntries.length&&<div className="mb-4 rounded-xl border border-cyan-200/15 bg-cyan-200/[.04] p-4 text-sm text-white/60">No local matches yet. Keep typing to refine, or use the web-search result to open this query in your real browser.</div>}{grouped.map(([group,items])=><section key={group||'results'} className="mb-5"><div className="mb-2 flex items-center gap-2">{group&&<><span className="mono text-[9px] uppercase tracking-[.18em] text-white/28">{group}</span><span className="h-px flex-1 bg-white/7"/></>}</div><div className="grid gap-2 xl:grid-cols-2">{items.map(entry=>{const object=entry.kind==='site'?objects.find(item=>item.id===entry.id):undefined;const active=selected?.kind===entry.kind&&selected?.id===entry.id;return <button key={`${entry.kind}:${entry.id}`} draggable={entry.kind==='site'} onDragStart={event=>{if(entry.kind==='site')event.dataTransfer.setData('text/webburrow-object',entry.id);}} onClick={()=>{selectEntry(entry);activate(entry);}} className={`group flex min-w-0 items-start gap-3 rounded-2xl border p-3 text-left transition ${active?'border-cyan-200/45 bg-cyan-200/[.08] shadow-[0_0_28px_rgba(114,223,243,.08)]':'border-white/8 bg-white/[.025] hover:border-white/15 hover:bg-white/[.055]'}`}><VisualMark entry={entry} object={object}/><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-medium text-white/90">{entry.title}</span>{object?.favorite&&<Star size={12} className="shrink-0 fill-amber-200 text-amber-200"/>}{object?.lifecycle==='session'&&<span className="shrink-0 rounded bg-violet-300/10 px-1.5 py-0.5 text-[8px] text-violet-100/75">TEMP</span>}</span><span className="mt-1 block truncate text-[10px] text-white/38">{entry.subtitle}</span><span className="mt-2 flex items-center gap-2 text-[9px] text-white/25"><span>{entryKindLabel(entry.kind)}</span>{object&&<><span>·</span><span>{domainOf(object.url)}</span></>}</span></span><ChevronRight size={15} className="mt-3 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-cyan-100"/></button>;})}</div></section>)}{section==='sessions'&&<section className="mt-6 rounded-2xl border border-violet-200/15 bg-violet-200/[.035] p-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-300/10 text-violet-100"><Sparkles size={16}/></span><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">Create a temporary research workspace</h2><p className="mt-1 text-[11px] leading-5 text-white/42">Paste links separated by commas or new lines. WebBurrow keeps the workspace spatial and opens each link in your real browser.</p><textarea value={researchLinks} onChange={event=>setResearchLinks(event.target.value)} placeholder="https://developer.mozilla.org · https://github.com" className="mt-3 min-h-20 w-full resize-y rounded-xl border border-white/10 bg-black/15 p-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-violet-200/35"/><button onClick={createResearch} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#ded8ff] px-4 py-2.5 text-xs font-semibold text-[#171529]"><FolderPlus size={14}/>Create and open links</button></div></div></section>}</main>
        <aside className="min-h-0 overflow-y-auto border-t border-white/8 p-4 lg:border-l lg:border-t-0 md:p-5">{selectedObject?<><div className="mb-4 flex items-start gap-3"><VisualMark entry={selected!} object={selectedObject}/><div className="min-w-0 flex-1"><p className="mono text-[9px] uppercase tracking-[.18em] text-cyan-200/55">Site details</p><h2 className="mt-1 truncate text-lg font-semibold">{selectedObject.name}</h2><p className="mt-1 truncate text-[10px] text-white/38">{domainOf(selectedObject.url)} · {rooms.find(room=>room.id===selectedObject.roomId)?.name}</p></div></div><div className="grid grid-cols-2 gap-2"><button onClick={()=>state.openSite(selectedObject.id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ded8ff] px-3 py-2.5 text-xs font-semibold text-[#171529]"><ExternalLink size={14}/>Open</button><button onClick={()=>{state.openSite(selectedObject.id);state.setToast(selectedObject.browserReference?'Focusing or opening this browser tab…':'Opened in your browser.');}} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-200/8 px-3 py-2.5 text-xs text-cyan-100"><Monitor size={14}/>Focus existing tab</button></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={()=>state.setFavorite(selectedObject.id,!selectedObject.favorite)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.045] px-3 py-2.5 text-xs text-white/65"><Star size={14} className={selectedObject.favorite?'fill-amber-200 text-amber-200':''}/>{selectedObject.favorite?'Unfavorite':'Favorite'}</button><button onClick={()=>state.openModal('edit-site',selectedObject.id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.045] px-3 py-2.5 text-xs text-white/65"><Settings2 size={14}/>Edit</button></div><label className="mt-5 block text-[10px] uppercase tracking-wider text-white/35">Add to collection<select value={currentCollection} onChange={event=>{const value=event.target.value;if(value==='__new'){const name=window.prompt('Collection name');if(name?.trim())state.updateSite(selectedObject.id,{collection:name.trim()});}else state.updateSite(selectedObject.id,{collection:value||undefined});}} className="mt-2 w-full rounded-xl border border-white/10 bg-[#171b2b] px-3 py-2.5 text-xs text-white outline-none"><option value="">Unsorted</option>{collections.map(collection=><option key={collection.id} value={collection.name}>{collection.name}</option>)}<option value="__new">Create new collection…</option></select></label><label className="mt-4 block text-[10px] uppercase tracking-wider text-white/35">Send to room<select value={selectedObject.roomId} onChange={event=>state.updateSite(selectedObject.id,{roomId:event.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-[#171b2b] px-3 py-2.5 text-xs text-white outline-none">{rooms.map(room=><option key={room.id} value={room.id}>{room.name}</option>)}</select></label><label className="mt-4 block text-[10px] uppercase tracking-wider text-white/35">Change object type<select value={selectedObject.archetype} onChange={event=>{state.updateSite(selectedObject.id,{archetype:event.target.value as Archetype});state.resetObjectPlacement(selectedObject.id);}} className="mt-2 w-full rounded-xl border border-white/10 bg-[#171b2b] px-3 py-2.5 text-xs capitalize text-white outline-none">{archetypes.map(archetype=><option key={archetype} value={archetype}>{archetype.replaceAll('-',' ')}</option>)}</select></label><div className="mt-5 rounded-xl border border-white/8 bg-white/[.025] p-3"><div className="flex items-center gap-2 text-[10px] text-white/35"><Tag size={13}/><span>{selectedObject.collection||'Unsorted'}</span><span className="ml-auto">{selectedObject.mount?.kind||'floor'} object</span></div><p className="mt-2 break-all text-[10px] leading-4 text-white/35">{selectedObject.url}</p></div></>:selectedWorkspace?<><div className="mb-4 flex items-start gap-3"><VisualMark entry={selected!}/><div className="min-w-0 flex-1"><p className="mono text-[9px] uppercase tracking-[.18em] text-violet-200/60">Temporary workspace</p><h2 className="mt-1 truncate text-lg font-semibold">{selectedWorkspace.name}</h2><p className="mt-1 text-[10px] text-white/38">{objects.filter(object=>object.roomId===selectedWorkspace.roomId).length} tabs · {selectedWorkspace.sourceScope}</p></div></div><div className="grid gap-2"><button onClick={()=>objects.filter(object=>object.roomId===selectedWorkspace.roomId).forEach(object=>state.openSite(object.id))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ded8ff] px-3 py-2.5 text-xs font-semibold text-[#171529]"><ExternalLink size={14}/>Open links in browser</button><div className="grid grid-cols-3 gap-1">{(['auto','grid','domain'] as const).map(mode=><button key={mode} onClick={()=>state.arrangeWorkspace(selectedWorkspace.id,{mode})} className="rounded-lg border border-white/10 bg-white/[.045] px-2 py-2 text-[10px] capitalize text-white/55 hover:text-white">{mode}</button>)}</div><button onClick={()=>state.promoteSessionItems(objects.filter(object=>object.roomId===selectedWorkspace.roomId).map(object=>object.id),state.currentRoomId)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200/15 bg-cyan-200/7 px-3 py-2.5 text-xs text-cyan-100"><Check size={14}/>Save tabs to current room</button><button onClick={()=>state.keepSessionRoom(selectedWorkspace.roomId)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.045] px-3 py-2.5 text-xs text-white/60"><Archive size={14}/>Keep workspace room</button><button onClick={()=>{if(confirm(`Clear ${selectedWorkspace.name}?`))state.clearWorkspace(selectedWorkspace.id);}} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200/15 bg-red-300/7 px-3 py-2.5 text-xs text-red-100/70"><Trash2 size={14}/>Clear temporary workspace</button></div></>:selected?.kind==='collection'?<div><VisualMark entry={selected}/><p className="mono mt-4 text-[9px] uppercase tracking-[.18em] text-cyan-200/55">Collection</p><h2 className="mt-1 text-lg font-semibold">{selected.title}</h2><p className="mt-2 text-xs leading-5 text-white/42">Drag site cards onto this collection in the sidebar, or use a site’s details panel to organize it.</p></div>:selected?.kind==='room'?<div><VisualMark entry={selected}/><p className="mono mt-4 text-[9px] uppercase tracking-[.18em] text-cyan-200/55">Room</p><h2 className="mt-1 text-lg font-semibold">{selected.title}</h2><button onClick={()=>state.setCurrentRoom(selected.id)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#ded8ff] px-3 py-2.5 text-xs font-semibold text-[#171529]"><MapPin size={14}/>Go to room</button></div>:<div className="grid h-full place-items-center text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-300/10 text-violet-100"><Compass size={22}/></span><h2 className="mt-4 text-lg font-semibold">Select something to explore</h2><p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-white/38">Search your sites, rooms, collections, browser sessions, and integrations. Drag a site into a room or collection to organize it.</p></div></div>}</aside>
      </div>
      <footer className="flex shrink-0 items-center justify-between border-t border-white/8 px-4 py-2.5 text-[10px] text-white/28 md:px-6"><span><kbd className="mono rounded bg-white/8 px-1.5 py-1 text-[9px]">↑↓</kbd> navigate <kbd className="mono ml-1 rounded bg-white/8 px-1.5 py-1 text-[9px]">Enter</kbd> open <kbd className="mono ml-1 rounded bg-white/8 px-1.5 py-1 text-[9px]">Esc</kbd> close</span><span className="hidden items-center gap-1.5 sm:flex"><CircleDot size={11} className="text-cyan-200"/>Local-first · no websites rendered here</span></footer>
    </section>
  </div>;
}
