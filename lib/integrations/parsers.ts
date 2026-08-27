import ICAL from 'ical.js';
import { z } from 'zod';
import { normalizeUrl } from '../url';
import type { CalendarEvent, FeedItem } from '../types';

const weatherResponseSchema=z.object({current:z.object({temperature_2m:z.number(),weather_code:z.number(),is_day:z.number(),apparent_temperature:z.number().optional()}),current_units:z.object({temperature_2m:z.string()}).optional()});
export type WeatherData={temperature:number;unit:string;condition:'clear'|'cloudy'|'rain'|'snow'|'storm';isDay:boolean;apparent?:number};
export function normalizeWeather(value:unknown):WeatherData {
  const parsed=weatherResponseSchema.parse(value);const code=parsed.current.weather_code;
  const condition:WeatherData['condition']=code>=95?'storm':code>=71&&code<=86?'snow':code>=51&&code<=67||code>=80&&code<=82?'rain':code>=1&&code<=3?'cloudy':'clear';
  return{temperature:parsed.current.temperature_2m,unit:parsed.current_units?.temperature_2m||'°',condition,isDay:parsed.current.is_day===1,apparent:parsed.current.apparent_temperature};
}

function safeArticleUrl(value:string,base:string) { try{return normalizeUrl(new URL(value,base).toString());}catch{return null;} }
function textOf(parent:Element,names:string[]) { for(const name of names){const node=parent.getElementsByTagName(name)[0];const text=node?.textContent?.trim();if(text)return text;}return''; }
export function parseFeedXml(xml:string,sourceUrl:string,now=Date.now()):FeedItem[] {
  if(xml.length>1_000_000)throw new Error('Feed response is too large.');if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error('Feed declarations are not supported.');
  const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw new Error('The feed XML is malformed.');
  const root=doc.documentElement;const source=textOf(root,['title'])||new URL(sourceUrl).hostname;const nodes=[...Array.from(doc.getElementsByTagName('item')),...Array.from(doc.getElementsByTagName('entry'))].slice(0,50);
  return nodes.flatMap((node,index)=>{const title=textOf(node,['title']).slice(0,240);let link=textOf(node,['link']);if(!link){link=Array.from(node.getElementsByTagName('link')).map(item=>item.getAttribute('href')).find(Boolean)||'';}const url=safeArticleUrl(link,sourceUrl);if(!title||!url)return[];const rawDate=textOf(node,['pubDate','published','updated']);const published=Date.parse(rawDate);return[{id:`feed-${sourceUrl}-${textOf(node,['guid','id'])||url||index}`,sourceId:'',title,url,source:source.slice(0,100),publishedAt:Number.isFinite(published)?published:now,read:false,firstSeenAt:now}];});
}

export type CalendarParseResult={events:CalendarEvent[];warnings:string[]};
export function parseCalendarIcs(input:string,sourceId:string,now=Date.now()):CalendarParseResult {
  if(input.length>2_000_000)throw new Error('Calendar response is too large.');const warnings:string[]=[];const events:CalendarEvent[]=[];const rangeEnd=now+90*24*60*60*1000;
  let calendar:ICAL.Component;try{calendar=new ICAL.Component(ICAL.parse(input));}catch{throw new Error('The calendar file is malformed.');}
  for(const component of calendar.getAllSubcomponents('vevent')){
    try{
      const event=new ICAL.Event(component);const occurrences:ICAL.Event[]=[];
      if(event.isRecurring()){
        const iterator=event.iterator();let next;let count=0;while((next=iterator.next())&&count<500){const occurrence=event.getOccurrenceDetails(next).item;if(occurrence.startDate.toJSDate().getTime()>rangeEnd)break;if(occurrence.endDate.toJSDate().getTime()>=now)occurrences.push(occurrence);count++;}
      }else occurrences.push(event);
      for(const occurrence of occurrences){const start=occurrence.startDate.toJSDate().getTime();const end=occurrence.endDate.toJSDate().getTime();if(end<now||start>rangeEnd)continue;let url: string|undefined;const rawUrl=component.getFirstPropertyValue('url');if(typeof rawUrl==='string'){try{url=normalizeUrl(rawUrl);}catch{warnings.push(`${event.summary||'Event'} has an unsafe link.`);}}
        events.push({id:`${sourceId}-${event.uid||crypto.randomUUID()}-${start}`,sourceId,title:(event.summary||'Untitled event').slice(0,160),startAt:start,endAt:end,allDay:occurrence.startDate.isDate,location:(event.location||'').slice(0,240)||undefined,url,description:(event.description||'').slice(0,500)||undefined,updatedAt:now});
      }
    }catch{warnings.push('An unsupported calendar event was skipped.');}
  }
  return{events:events.sort((a,b)=>a.startAt-b.startAt).slice(0,500),warnings};
}
