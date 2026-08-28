// @vitest-environment jsdom
import { describe,expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { browserMessageSchema } from '@/lib/integrations/contracts';
import { normalizeWeather, parseCalendarIcs, parseFeedXml } from '@/lib/integrations/parsers';
import { integrationRegistry } from '@/lib/integrations/registry';

const fixture=(name:string)=>readFileSync(path.join(process.cwd(),'test','fixtures',name),'utf8');
describe('integration boundaries',()=>{
  it('normalizes Open-Meteo codes without leaking provider shape into views',()=>{const data=normalizeWeather(JSON.parse(fixture('weather.json')));expect(data).toMatchObject({condition:'rain',isDay:false,unit:'°F'});});
  it('parses RSS as text-only data and rejects entity declarations',()=>{const items=parseFeedXml(fixture('feed.xml'),'https://example.com/feed.xml',1);expect(items[0]).toMatchObject({title:'A calmer digital workspace',url:'https://example.com/posts/calm'});expect(JSON.stringify(items)).not.toContain('script');expect(()=>parseFeedXml('<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>','https://example.com/feed')).toThrow(/declarations/);});
  it('expands bounded calendar recurrences and drops unsafe links with a warning',()=>{const result=parseCalendarIcs(fixture('calendar.ics'),'calendar',Date.UTC(2026,7,27));expect(result.events.filter(event=>event.title==='Burrow planning')).toHaveLength(3);expect(result.events.find(event=>event.title==='Local lunch')?.url).toBeUndefined();expect(result.warnings[0]).toMatch(/unsafe link/);});
  it('validates explicit browser messages and caps tab batches',()=>{expect(browserMessageSchema.safeParse({type:'send-tabs',requestId:'1',name:'Research',scope:'selection',mode:'create',tabs:[{title:'Docs',url:'https://example.com'}]}).success).toBe(true);expect(browserMessageSchema.safeParse({type:'send-tabs',requestId:'1',name:'Too many',scope:'window',mode:'create',tabs:Array.from({length:101},()=>({title:'x',url:'https://example.com'}))}).success).toBe(false);expect(browserMessageSchema.safeParse({type:'send-page',requestId:'1',page:{title:'bad',url:'file:///tmp/a'},roomId:'room'}).success).toBe(false);});
  it('keeps every integration optional',()=>{for(const adapter of Object.values(integrationRegistry))expect(adapter.available({id:adapter.id,enabled:false,settings:{},updatedAt:0})).toBe(false);});
});
