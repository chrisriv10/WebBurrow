import dns from 'node:dns/promises';
import https from 'node:https';
import net from 'node:net';

const MAX_BODY = { github:2_000_000,weather:1_000_000,calendar:5_000_000,rss:3_000_000,favicon:64*1024 };
const MIME = {
  github:['application/json'],weather:['application/json'],
  calendar:['text/calendar','text/plain','application/octet-stream'],
  rss:['application/rss+xml','application/atom+xml','application/xml','text/xml','text/plain'],
  favicon:['image/png','image/jpeg','image/webp','image/x-icon','image/vnd.microsoft.icon'],
};

export function isPrivateAddress(address) {
  if (!net.isIP(address)) return true;
  if (address.includes(':')) {const value=address.toLowerCase();return value==='::1'||value==='::'||value.startsWith('fc')||value.startsWith('fd')||value.startsWith('fe80:')||value.startsWith('::ffff:127.')||value.startsWith('::ffff:10.')||value.startsWith('::ffff:192.168.');}
  const [a,b]=address.split('.').map(Number);return a===10||a===127||a===0||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19));
}

export function parseDeepLink(value) {
  try {const url=new URL(value);if(url.protocol!=='webburrow:')return null;const route=[url.hostname,...url.pathname.split('/').filter(Boolean)];
    if(route[0]==='show'&&route.length===1)return{type:'show'};if(route[0]==='quick-access'&&route.length===1)return{type:'quick-access'};
    if(route[0]==='add'&&route.length===1){const title=(url.searchParams.get('title')||'').slice(0,80);const candidate=url.searchParams.get('url');if(candidate&&!isSafeExternalUrl(candidate))return null;return{type:'add',payload:{title,url:candidate||''}};}
    if(route[0]==='room'&&route.length===2&&/^[\w-]{1,100}$/.test(route[1]))return{type:'room',payload:route[1]};if(route[0]==='open'&&route.length===2&&/^[\w-]{1,100}$/.test(route[1]))return{type:'open-object',payload:route[1]};
  }catch{}return null;
}

export function isSafeExternalUrl(value) {try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password;}catch{return false;}}

export function buildIntegrationUrl(request) {
  if(!request||typeof request!=='object')throw new Error('Malformed integration request.');
  if(request.kind==='github'){if(typeof request.path!=='string'||!/^\/(repos|users)\/[A-Za-z0-9_.\/-]+(?:\?.*)?$/.test(request.path))throw new Error('Invalid GitHub path.');return new URL(`https://api.github.com${request.path}`);}
  if(request.kind==='weather'){if(!['geocode','forecast'].includes(request.endpoint)||!request.query||typeof request.query!=='object')throw new Error('Invalid weather request.');const host=request.endpoint==='geocode'?'geocoding-api.open-meteo.com':'api.open-meteo.com',pathname=request.endpoint==='geocode'?'/v1/search':'/v1/forecast',url=new URL(`https://${host}${pathname}`);for(const[key,value]of Object.entries(request.query))if(/^[a-z0-9_]+$/i.test(key))url.searchParams.set(key,String(value).slice(0,300));return url;}
  if(request.kind==='calendar'||request.kind==='rss'){const url=new URL(request.url);if(url.protocol!=='https:'||url.username||url.password)throw new Error('Subscriptions require HTTPS and no embedded credentials.');return url;}
  if(request.kind==='favicon'){const page=new URL(request.pageUrl),icon=new URL(request.iconUrl);if(page.protocol!=='https:'||icon.protocol!=='https:'||page.username||page.password||icon.username||icon.password||page.origin!==icon.origin)throw new Error('Icons must use the saved page’s HTTPS origin.');return icon;}
  throw new Error('Unsupported integration operation.');
}

async function resolvePublicHost(url,kind){if(kind==='github'&&url.hostname!=='api.github.com')throw new Error('Unexpected GitHub host.');if(kind==='weather'&&!['api.open-meteo.com','geocoding-api.open-meteo.com'].includes(url.hostname))throw new Error('Unexpected weather host.');const records=await dns.lookup(url.hostname,{all:true,verbatim:true});if(!records.length||records.some(record=>isPrivateAddress(record.address)))throw new Error('Private or local network targets are blocked.');return records[0];}

export function streamHttpsRequest(url,{headers,signal,pinned,maxBytes}){return new Promise((resolve,reject)=>{const request=https.request(url,{method:'GET',headers,signal,servername:url.hostname,lookup:(_hostname,options,callback)=>{if(options?.all)callback(null,[pinned]);else callback(null,pinned.address,pinned.family);}},response=>{const chunks=[];let size=0;response.on('data',chunk=>{size+=chunk.length;if(size>maxBytes){request.destroy(new Error('The response is too large.'));return;}chunks.push(chunk);});response.on('end',()=>resolve({status:response.statusCode||0,headers:response.headers,bytes:Buffer.concat(chunks)}));response.on('error',reject);});request.on('error',reject);request.end();});}

export async function hardenedIntegrationRequest(request,transport=streamHttpsRequest,resolveHost=resolvePublicHost) {
  let url=buildIntegrationUrl(request);const originalOrigin=request.kind==='favicon'?url.origin:null;const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10_000);
  try{for(let redirects=0;redirects<=3;redirects+=1){const pinned=await resolveHost(url,request.kind);const headers={Accept:MIME[request.kind].join(', '),'User-Agent':'WebBurrow/1.0.0'};if(request.etag)headers['If-None-Match']=request.etag;const response=await transport(url,{headers,signal:controller.signal,pinned,maxBytes:MAX_BODY[request.kind]});
      if([301,302,303,307,308].includes(response.status)){const location=response.headers.location;if(!location||redirects===3)throw new Error('Too many or invalid redirects.');url=new URL(Array.isArray(location)?location[0]:location,url);if(url.protocol!=='https:'||(originalOrigin&&url.origin!==originalOrigin))throw new Error('Insecure or cross-origin redirects are blocked.');continue;}
      const etag=Array.isArray(response.headers.etag)?response.headers.etag[0]:response.headers.etag;if(response.status===304)return{status:304,body:'',contentType:'',etag:request.etag,notModified:true};const rawType=Array.isArray(response.headers['content-type'])?response.headers['content-type'][0]:response.headers['content-type'];const type=String(rawType||'').toLowerCase().split(';')[0].trim();if(!MIME[request.kind].includes(type))throw new Error('The response has an unsupported content type.');const declared=Number(response.headers['content-length']||0);if(declared>MAX_BODY[request.kind]||response.bytes.byteLength>MAX_BODY[request.kind])throw new Error('The response is too large.');const remaining=Number(response.headers['x-ratelimit-remaining']),reset=Number(response.headers['x-ratelimit-reset']);return{status:response.status,body:request.kind==='favicon'?response.bytes.toString('base64'):new TextDecoder().decode(response.bytes),contentType:type,etag:etag||undefined,bodyEncoding:request.kind==='favicon'?'base64':undefined,rateLimit:Number.isFinite(remaining)&&Number.isFinite(reset)?{remaining,resetAt:reset*1000}:undefined};
    }}finally{clearTimeout(timeout);}throw new Error('Request could not be completed.');
}
