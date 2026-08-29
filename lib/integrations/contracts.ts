import { z } from 'zod';
import type { IntegrationCache, IntegrationConfig, IntegrationId } from '../types';

const httpsUrl=z.string().url().refine(value=>value.startsWith('https://'),'HTTPS is required.');
const webUrl=z.string().url().refine(value=>value.startsWith('https://')||value.startsWith('http://'),'Only web URLs are supported.');
const requestId=z.string().min(1).max(100);
export const integrationRequestSchema = z.discriminatedUnion('kind',[
  z.object({kind:z.literal('github'),path:z.string().regex(/^\/(repos|users)\/[A-Za-z0-9_.\/-]+(?:\?.*)?$/),etag:z.string().max(200).optional()}),
  z.object({kind:z.literal('weather'),endpoint:z.enum(['geocode','forecast']),query:z.record(z.string(),z.union([z.string(),z.number(),z.boolean()]))}),
  z.object({kind:z.literal('calendar'),url:httpsUrl,etag:z.string().max(200).optional()}),
  z.object({kind:z.literal('rss'),url:httpsUrl,etag:z.string().max(200).optional()}),
]);
export type IntegrationRequest=z.infer<typeof integrationRequestSchema>;
export type IntegrationResponse={status:number;body:string;contentType:string;etag?:string;notModified?:boolean;rateLimit?:{remaining:number;resetAt:number}};

export const faviconPayloadSchema=z.object({mime:z.enum(['image/png','image/jpeg','image/webp']),dataBase64:z.string().max(90_000)}).strict();
export const browserTabSchema=z.object({title:z.string().min(1).max(200),url:webUrl,tabId:z.number().int().nonnegative().optional(),windowId:z.number().int().nonnegative().optional(),groupId:z.number().int().optional(),groupName:z.string().max(80).optional(),favicon:faviconPayloadSchema.optional()}).strict();
export const workspaceSummarySchema=z.object({id:z.string().min(1).max(100),name:z.string().min(1).max(60),tabCount:z.number().int().nonnegative().max(100),sourceScope:z.enum(['selection','window','group'])}).strict();
export const destinationSummarySchema=z.object({id:z.string().min(1).max(100),name:z.string().min(1).max(80)}).strict();
export const browserMessageSchema=z.discriminatedUnion('type',[
  z.object({type:z.literal('capabilities'),requestId}).strict(),
  z.object({type:z.literal('send-page'),requestId,page:browserTabSchema,roomId:z.string().max(100).optional(),collection:z.string().max(40).optional(),archetype:z.string().max(40).optional(),color:z.string().regex(/^#[0-9a-f]{6}$/i).optional(),favorite:z.boolean().default(false)}).strict(),
  z.object({type:z.literal('send-tabs'),requestId,tabs:z.array(browserTabSchema).min(1).max(100),name:z.string().min(1).max(60).default('Browser session'),scope:z.enum(['selection','window','group']),mode:z.enum(['create','append','replace']).default('create'),workspaceId:z.string().max(100).optional()}).strict(),
  z.object({type:z.literal('bookmark-preview'),requestId,html:z.string().max(2_000_000)}).strict(),
  z.object({type:z.literal('focus-or-open-result'),requestId,handled:z.boolean(),tabId:z.number().int().nonnegative().optional()}).strict(),
]);
export type BrowserMessage=z.infer<typeof browserMessageSchema>;
export type FaviconPayload=z.infer<typeof faviconPayloadSchema>;
export const browserHostResponseSchema=z.object({requestId:requestId.optional(),ok:z.boolean(),result:z.object({version:z.literal(1),workspaces:z.array(workspaceSummarySchema),rooms:z.array(destinationSummarySchema),collections:z.array(destinationSummarySchema),capabilities:z.array(z.enum(['send-page','send-tabs','bookmark-preview','focus-or-open','favicon']))}).strict().optional(),error:z.object({code:z.string().max(60),message:z.string().max(240)}).strict().optional()}).strict();

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
      requestSiteIcon:(request:{pageUrl:string;iconUrl:string})=>Promise<{ok:boolean;dataUrl?:string;error?:string}>;
      setTrayPreferences:(preferences:{enabled:boolean;minimizeToTray:boolean})=>void;
      closeTrayWindow:()=>void;
      showMainWindow:(command?:'show'|'quick-access'|'add'|'import'|'edit'|'customize')=>void;
      syncTrayMenu:(snapshot:{favorites:{id:string;name:string;url:string}[];recent:{id:string;name:string;url:string}[]})=>void;
      syncBrowserContext:(context:{workspaces:{id:string;name:string;tabCount:number;sourceScope:'selection'|'window'|'group'}[];rooms:{id:string;name:string}[];collections:{id:string;name:string}[]})=>void;
      onCommand:(callback:(command:{type:string;payload?:unknown})=>void)=>()=>void;
      openExternal:(url:string)=>Promise<boolean>;
    };
  }
}
