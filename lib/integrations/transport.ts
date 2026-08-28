import { integrationRequestSchema, type IntegrationRequest, type IntegrationResponse } from './contracts';

const LIMITS:Record<IntegrationRequest['kind'],number>={github:1_000_000,weather:300_000,calendar:2_000_000,rss:1_000_000};
function requestUrl(request:IntegrationRequest) {
  if(request.kind==='github')return `https://api.github.com${request.path}`;
  if(request.kind==='weather'){
    const host=request.endpoint==='geocode'?'https://geocoding-api.open-meteo.com/v1/search':'https://api.open-meteo.com/v1/forecast';
    const query=new URLSearchParams(Object.entries(request.query).map(([key,value])=>[key,String(value)]));return `${host}?${query}`;
  }
  return request.url;
}

export async function requestIntegration(input:IntegrationRequest):Promise<IntegrationResponse> {
  const request=integrationRequestSchema.parse(input);
  if(window.webburrowDesktop)return window.webburrowDesktop.requestIntegration(request);
  const controller=new AbortController();const timer=window.setTimeout(()=>controller.abort(),8000);
  try{
    const etag='etag' in request?request.etag:undefined;
    const response=await fetch(requestUrl(request),{signal:controller.signal,credentials:'omit',redirect:'follow',headers:{Accept:request.kind==='github'?'application/vnd.github+json':request.kind==='calendar'?'text/calendar, text/plain;q=.8':'application/json, application/xml, text/xml;q=.8',...(etag?{'If-None-Match':etag}:{})}});
    if(response.status===304)return{status:304,body:'',contentType:response.headers.get('content-type')||'',etag,notModified:true};
    const buffer=await response.arrayBuffer();if(buffer.byteLength>LIMITS[request.kind])throw new Error('The remote response was too large.');
    const remaining=Number(response.headers.get('x-ratelimit-remaining'));const reset=Number(response.headers.get('x-ratelimit-reset'));return{status:response.status,body:new TextDecoder().decode(buffer),contentType:response.headers.get('content-type')||'',etag:response.headers.get('etag')||undefined,rateLimit:Number.isFinite(remaining)&&Number.isFinite(reset)?{remaining,resetAt:reset*1000}:undefined};
  }finally{clearTimeout(timer);}
}
