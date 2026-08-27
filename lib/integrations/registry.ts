import { z } from 'zod';
import type { IntegrationAdapter, RefreshContext, RefreshResult } from './contracts';
import { normalizeWeather, parseCalendarIcs, parseFeedXml, type WeatherData } from './parsers';
import type { CalendarEvent, FeedItem, IntegrationCache, IntegrationConfig } from '../types';

const repositorySchema=z.object({full_name:z.string(),html_url:z.string().url(),description:z.string().nullable(),stargazers_count:z.number(),open_issues_count:z.number(),updated_at:z.string()});
const commitsSchema=z.array(z.object({sha:z.string(),html_url:z.string().url(),commit:z.object({message:z.string(),author:z.object({date:z.string().nullable()}).nullable()})}));
const releaseSchema=z.object({name:z.string().nullable(),tag_name:z.string(),html_url:z.string().url(),published_at:z.string().nullable()});
export type GitHubRepositoryData={fullName:string;url:string;description:string;stars:number;openWork:number;updatedAt:number;latestCommit?:{message:string;url:string;date:number};latestRelease?:{name:string;url:string;date:number}};
export type WeatherCacheData=WeatherData&{location:string};
export type CalendarCacheData={events:CalendarEvent[];warnings:string[]};
export type FeedCacheData={items:FeedItem[];name:string};

function parsedSettings(config:IntegrationConfig){return config.settings as Record<string,unknown>;}
function cached<T>(cache:IntegrationCache[],key:string){return cache.find(item=>item.cacheKey===key)?.data as T|undefined;}
async function json(context:RefreshContext,request:Parameters<RefreshContext['request']>[0]){const response=await context.request(request);if(response.status<200||response.status>=300)throw new Error(`Remote service returned ${response.status}.`);try{return{value:JSON.parse(response.body) as unknown,etag:response.etag};}catch{throw new Error('Remote service returned malformed JSON.');}}

const github:IntegrationAdapter={
  id:'github',name:'GitHub',description:'Public repository activity, releases, and project status.',refreshMinutes:60,
  privacy:{reads:'Public repository names you add',stores:'Cached public repository summaries',sends:'Repository names to api.github.com',permissions:[]},
  available:config=>Array.isArray(parsedSettings(config).repositories)&&Boolean((parsedSettings(config).repositories as unknown[]).length),
  refresh:async(config,cache,context)=>{
    const repositories=(parsedSettings(config).repositories as unknown[]||[]).filter((item):item is string=>typeof item==='string'&&/^[\w.-]+\/[\w.-]+$/.test(item)).slice(0,5);const results:RefreshResult[]=[];
    for(const fullName of repositories){
      const key=`repo:${fullName.toLowerCase()}`;const existing=cache.find(item=>item.cacheKey===key);
      const [repoResult,commitResult,releaseResult]=await Promise.allSettled([
        json(context,{kind:'github',path:`/repos/${fullName}`,etag:existing?.etag}),json(context,{kind:'github',path:`/repos/${fullName}/commits?per_page=1`}),json(context,{kind:'github',path:`/repos/${fullName}/releases/latest`}),
      ]);
      if(repoResult.status==='rejected')throw repoResult.reason;
      const repo=repositorySchema.parse(repoResult.value.value);const commit=commitResult.status==='fulfilled'?commitsSchema.safeParse(commitResult.value.value):null;const release=releaseResult.status==='fulfilled'?releaseSchema.safeParse(releaseResult.value.value):null;
      const data:GitHubRepositoryData={fullName:repo.full_name,url:repo.html_url,description:repo.description||'Public repository',stars:repo.stargazers_count,openWork:repo.open_issues_count,updatedAt:Date.parse(repo.updated_at),
        latestCommit:commit?.success&&commit.data[0]?{message:commit.data[0].commit.message.split('\n')[0].slice(0,160),url:commit.data[0].html_url,date:Date.parse(commit.data[0].commit.author?.date||'')}:undefined,
        latestRelease:release?.success?{name:release.data.name||release.data.tag_name,url:release.data.html_url,date:Date.parse(release.data.published_at||'')}:undefined};
      results.push({cacheKey:key,data,ttlMs:60*60_000,etag:repoResult.value.etag});
    }return results;
  },
  toSearchEntries:cache=>cache.filter(item=>item.cacheKey.startsWith('repo:')).flatMap(item=>{const data=item.data as GitHubRepositoryData;return data?.fullName?[{id:`github:${data.fullName}`,title:data.fullName,subtitle:`${data.stars} stars · ${data.openWork} open`,url:data.url,keywords:`github repository ${data.description||''}`}]:[];}),
  toTrayCard:cache=>{const data=cache.filter(item=>item.cacheKey.startsWith('repo:')).map(item=>item.data as GitHubRepositoryData).find(Boolean);return data?{id:'github',kind:'github',title:'GitHub pulse',value:data.fullName,detail:data.latestCommit?.message||`${data.stars} stars · ${data.openWork} open`,tone:'violet'}:null;},
  toWorldWidgets:cache=>cache.filter(item=>item.cacheKey.startsWith('repo:')).map(item=>item.data as GitHubRepositoryData).filter(Boolean).map(data=>({id:`github:${data.fullName}`,kind:'github-repo',title:data.fullName,primary:data.latestCommit?.message||`${data.stars} stars`,secondary:`${data.openWork} open`,active:true,tone:'#8da2ff',reference:data.url})),
};

const weather:IntegrationAdapter={
  id:'weather',name:'Weather',description:'A weather-reactive window using a manually selected city.',refreshMinutes:20,
  privacy:{reads:'The city you select',stores:'City coordinates and cached conditions',sends:'Coordinates to api.open-meteo.com',permissions:[]},
  available:config=>{const location=parsedSettings(config).location as Record<string,unknown>|undefined;return typeof location?.latitude==='number'&&typeof location?.longitude==='number';},
  refresh:async(config,_cache,context)=>{const location=parsedSettings(config).location as {name:string;latitude:number;longitude:number};const unit=parsedSettings(config).temperatureUnit==='celsius'?'celsius':'fahrenheit';const response=await json(context,{kind:'weather',endpoint:'forecast',query:{latitude:location.latitude,longitude:location.longitude,current:'temperature_2m,apparent_temperature,is_day,weather_code',temperature_unit:unit,timezone:'auto'}});return[{cacheKey:'current',data:{...normalizeWeather(response.value),location:location.name} satisfies WeatherCacheData,ttlMs:20*60_000,etag:response.etag}];},
  toSearchEntries:cache=>{const data=cached<WeatherCacheData>(cache,'current');return data?[{id:'weather:current',title:`Weather in ${data.location}`,subtitle:`${Math.round(data.temperature)}${data.unit} · ${data.condition}`,keywords:`weather temperature ${data.condition}`}]:[];},
  toTrayCard:cache=>{const data=cached<WeatherCacheData>(cache,'current');return data?{id:'weather',kind:'weather',title:data.location,value:`${Math.round(data.temperature)}${data.unit}`,detail:`${data.isDay?'Day':'Night'} · ${data.condition}`,tone:data.condition==='storm'?'violet':data.condition==='rain'?'cyan':'amber'}:null;},
  toWorldWidgets:cache=>{const data=cached<WeatherCacheData>(cache,'current');return data?[{id:'weather:window',kind:'weather-window',title:data.location,primary:`${Math.round(data.temperature)}${data.unit}`,secondary:data.condition,active:true,tone:data.isDay?'#80dfff':'#6672a8'}]:[];},
};

const calendar:IntegrationAdapter={
  id:'calendar',name:'Calendar',description:'Local events and optional HTTPS iCalendar subscriptions.',refreshMinutes:30,
  privacy:{reads:'ICS files and calendar feed URLs you add',stores:'Normalized upcoming event details',sends:'Subscription URL requests only when enabled',permissions:[]},
  available:config=>Array.isArray(parsedSettings(config).subscriptions)&&Boolean((parsedSettings(config).subscriptions as unknown[]).length),
  refresh:async(config,_cache,context)=>{const sources=(parsedSettings(config).subscriptions as {id:string;name:string;url:string}[]||[]).slice(0,10);const results:RefreshResult[]=[];for(const source of sources){const response=await context.request({kind:'calendar',url:source.url});if(response.status<200||response.status>=300)throw new Error(`Calendar returned ${response.status}.`);const parsed=parseCalendarIcs(response.body,source.id,context.now);results.push({cacheKey:`calendar:${source.id}`,data:{events:parsed.events,warnings:parsed.warnings} satisfies CalendarCacheData,ttlMs:30*60_000,etag:response.etag});}return results;},
  toSearchEntries:cache=>cache.filter(item=>item.cacheKey.startsWith('calendar:')).flatMap(item=>(item.data as CalendarCacheData)?.events||[]).slice(0,20).map(event=>({id:`event:${event.id}`,title:event.title,subtitle:new Date(event.startAt).toLocaleString(),url:event.url,keywords:`calendar event ${event.location||''}`})),
  toTrayCard:cache=>{const next=cache.filter(item=>item.cacheKey.startsWith('calendar:')).flatMap(item=>(item.data as CalendarCacheData)?.events||[]).filter(event=>event.startAt>=Date.now()).sort((a,b)=>a.startAt-b.startAt)[0];return next?{id:'calendar',kind:'calendar',title:'Up next',value:next.title,detail:new Date(next.startAt).toLocaleString(),tone:'amber'}:null;},
  toWorldWidgets:cache=>{const card=calendar.toTrayCard(cache);return card?[{id:'calendar:wall',kind:'calendar',title:'UP NEXT',primary:card.value,secondary:card.detail,active:true,tone:'#ffc47c'}]:[];},
};

const rss:IntegrationAdapter={
  id:'rss',name:'Feeds',description:'Text-only RSS and Atom headlines from feeds you choose.',refreshMinutes:30,
  privacy:{reads:'HTTPS feed URLs you add',stores:'Recent article titles, links, and read state',sends:'Requests only to configured feed URLs',permissions:[]},
  available:config=>Array.isArray(parsedSettings(config).feeds)&&Boolean((parsedSettings(config).feeds as unknown[]).length),
  refresh:async(config,_cache,context)=>{const sources=(parsedSettings(config).feeds as {id:string;name:string;url:string}[]||[]).slice(0,10);const results:RefreshResult[]=[];for(const source of sources){const response=await context.request({kind:'rss',url:source.url});if(response.status<200||response.status>=300)throw new Error(`Feed returned ${response.status}.`);const items=parseFeedXml(response.body,source.url,context.now).map(item=>({...item,sourceId:source.id,source:source.name}));results.push({cacheKey:`feed:${source.id}`,data:{items,name:source.name} satisfies FeedCacheData,ttlMs:30*60_000,etag:response.etag});}return results;},
  toSearchEntries:cache=>cache.filter(item=>item.cacheKey.startsWith('feed:')).flatMap(item=>(item.data as FeedCacheData)?.items||[]).slice(0,30).map(item=>({id:`feed:${item.id}`,title:item.title,subtitle:`${item.source} · ${new Date(item.publishedAt).toLocaleDateString()}`,url:item.url,keywords:`rss feed news ${item.source}`})),
  toTrayCard:cache=>{const data=cache.filter(item=>item.cacheKey.startsWith('feed:')).map(item=>item.data as FeedCacheData).find(value=>value?.items?.length);const item=data?.items[0];return item?{id:'feed',kind:'feed',title:data.name,value:item.title,detail:new Date(item.publishedAt).toLocaleDateString(),tone:'green'}:null;},
  toWorldWidgets:cache=>{const card=rss.toTrayCard(cache);return card?[{id:'feed:board',kind:'feed',title:card.title,primary:card.value,secondary:card.detail,active:true,tone:'#7fd6b1'}]:[];},
};

const browser:IntegrationAdapter={id:'browser',name:'Browser companion',description:'Pages, tabs, and bookmarks you explicitly send from the optional extension.',refreshMinutes:0,privacy:{reads:'Only pages, tabs, or bookmarks you explicitly send',stores:'Saved items and current-session tab spaces',sends:'Validated messages to the local WebBurrow desktop app',permissions:['activeTab','nativeMessaging','optional tabs','optional bookmarks']},available:()=>false,refresh:async()=>[],toSearchEntries:()=>[],toTrayCard:()=>null,toWorldWidgets:()=>[]};
export const integrationRegistry={browser,github,weather,calendar,rss} satisfies Record<string,IntegrationAdapter>;
export const integrationAdapters=Object.values(integrationRegistry);

export async function searchWeatherLocations(query:string,request:RefreshContext['request']) {
  const response=await request({kind:'weather',endpoint:'geocode',query:{name:query,count:6,language:'en',format:'json'}});if(response.status<200||response.status>=300)throw new Error(`Location search returned ${response.status}.`);
  const parsed=z.object({results:z.array(z.object({id:z.number(),name:z.string(),latitude:z.number(),longitude:z.number(),country:z.string().optional(),admin1:z.string().optional()})).optional()}).parse(JSON.parse(response.body));return(parsed.results||[]).map(item=>({...item,label:[item.name,item.admin1,item.country].filter(Boolean).join(', ')}));
}
