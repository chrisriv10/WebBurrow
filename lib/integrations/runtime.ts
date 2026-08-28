import type { BurrowNotification, IntegrationCache, IntegrationConfig, IntegrationId } from '../types';
import { integrationRegistry } from './registry';
import { requestIntegration } from './transport';
import type { IntegrationStatus } from './contracts';
import { recordIntegrationRefresh } from '../performance';

export type RuntimeResult={cache:IntegrationCache[];status:IntegrationStatus;error?:string;notifications:BurrowNotification[]};
const attempts=new Map<IntegrationId,number>();

export async function refreshIntegration(config:IntegrationConfig,current:IntegrationCache[],force=false):Promise<RuntimeResult> {
  const adapter=integrationRegistry[config.id];if(!config.enabled)return{cache:current,status:'disabled',notifications:[]};if(!adapter.available(config))return{cache:current,status:'idle',notifications:[]};
  if(typeof navigator!=='undefined'&&!navigator.onLine)return{cache:current,status:current.length?'stale':'offline',notifications:[]};
  const now=Date.now();if(!force&&current.length&&current.every(item=>item.expiresAt>now))return{cache:current,status:'ready',notifications:[]};
  recordIntegrationRefresh();
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10_000);
  try{
    const results=await adapter.refresh(config,current,{request:requestIntegration,now,signal:controller.signal});const byKey=new Map(current.map(item=>[item.cacheKey,item]));const notifications:BurrowNotification[]=[];
    for(const result of results){byKey.set(result.cacheKey,{id:`${config.id}:${result.cacheKey}`,integrationId:config.id,cacheKey:result.cacheKey,data:result.data,fetchedAt:now,expiresAt:now+result.ttlMs,etag:result.etag});if(result.notification)notifications.push({id:crypto.randomUUID(),kind:'info',title:result.notification.title,body:result.notification.body,createdAt:now,dedupeKey:`refresh:${config.id}:${result.cacheKey}`});}
    attempts.delete(config.id);return{cache:[...byKey.values()],status:'ready',notifications};
  }catch(error){const count=(attempts.get(config.id)||0)+1;attempts.set(config.id,count);const message=error instanceof Error?error.message:'Refresh failed.';return{cache:current.map(item=>({...item,error:message,expiresAt:Math.max(item.expiresAt,now+Math.min(60_000*2**count,30*60_000))})),status:current.length?'stale':'error',error:message,notifications:count===2?[{id:crypto.randomUUID(),kind:'error',title:`${adapter.name} needs attention`,body:message,createdAt:now,dedupeKey:`integration-error:${config.id}`}]:[]};
  }finally{clearTimeout(timer);}
}
