import { z } from 'zod';
import type { IntegrationCache, IntegrationConfig, IntegrationId } from '../types';

export const integrationRequestSchema = z.discriminatedUnion('kind',[
  z.object({kind:z.literal('github'),path:z.string().regex(/^\/(repos|users)\/[A-Za-z0-9_.\/-]+(?:\?.*)?$/),etag:z.string().max(200).optional()}),
  z.object({kind:z.literal('weather'),endpoint:z.enum(['geocode','forecast']),query:z.record(z.string(),z.union([z.string(),z.number(),z.boolean()]))}),
  z.object({kind:z.literal('calendar'),url:z.string().url(),etag:z.string().max(200).optional()}),
  z.object({kind:z.literal('rss'),url:z.string().url(),etag:z.string().max(200).optional()}),
]);
export type IntegrationRequest=z.infer<typeof integrationRequestSchema>;
export type IntegrationResponse={status:number;body:string;contentType:string;etag?:string;notModified?:boolean};

export const browserTabSchema=z.object({id:z.number().int().optional(),title:z.string().max(200),url:z.string().url()});
export const browserMessageSchema=z.discriminatedUnion('type',[
  z.object({type:z.literal('capabilities'),requestId:z.string()}),
  z.object({type:z.literal('send-page'),requestId:z.string(),page:browserTabSchema,roomId:z.string(),collection:z.string().max(40).optional(),archetype:z.string().optional(),favorite:z.boolean().default(false)}),
  z.object({type:z.literal('send-tabs'),requestId:z.string(),tabs:z.array(browserTabSchema).min(1).max(100),name:z.string().min(1).max(60).default('Browser session')}),
  z.object({type:z.literal('bookmark-preview'),requestId:z.string(),html:z.string().max(2_000_000)}),
  z.object({type:z.literal('focus-or-open-result'),requestId:z.string(),handled:z.boolean()}),
]);
export type BrowserMessage=z.infer<typeof browserMessageSchema>;

export type IntegrationStatus='disabled'|'idle'|'refreshing'|'ready'|'stale'|'error'|'offline';
export type IntegrationSearchItem={id:string;title:string;subtitle:string;url?:string;keywords:string;score?:number};
export type TrayCardViewModel={id:string;kind:'weather'|'calendar'|'github'|'feed'|'browser-tabs'|'notifications';title:string;value:string;detail:string;tone:'cyan'|'violet'|'amber'|'green'|'muted';actionId?:string};
export type WorldWidgetViewModel={id:string;kind:'weather-window'|'calendar'|'github-repo'|'feed';title:string;primary:string;secondary:string;active:boolean;tone:string;reference?:string};
export type PrivacyDescriptor={reads:string;stores:string;sends:string;permissions:string[]};
export type RefreshContext={request:(request:IntegrationRequest)=>Promise<IntegrationResponse>;now:number;signal:AbortSignal};
export type RefreshResult={cacheKey:string;data:unknown;ttlMs:number;etag?:string;notification?:{title:string;body:string}};

export type IntegrationAdapter={
  id:IntegrationId;name:string;description:string;refreshMinutes:number;privacy:PrivacyDescriptor;
  available:(config:IntegrationConfig)=>boolean;
  refresh:(config:IntegrationConfig,cache:IntegrationCache[],context:RefreshContext)=>Promise<RefreshResult[]>;
  toSearchEntries:(cache:IntegrationCache[])=>IntegrationSearchItem[];
  toTrayCard:(cache:IntegrationCache[])=>TrayCardViewModel|null;
  toWorldWidgets:(cache:IntegrationCache[])=>WorldWidgetViewModel[];
};

declare global {
  interface Window {
    webburrowDesktop?:{
      requestIntegration:(request:IntegrationRequest)=>Promise<IntegrationResponse>;
      setTrayPreferences:(preferences:{enabled:boolean;minimizeToTray:boolean})=>void;
      syncTrayMenu:(snapshot:{favorites:{id:string;name:string;url:string}[];recent:{id:string;name:string;url:string}[]})=>void;
      onCommand:(callback:(command:{type:string;payload?:unknown})=>void)=>()=>void;
      openExternal:(url:string)=>Promise<boolean>;
    };
  }
}
