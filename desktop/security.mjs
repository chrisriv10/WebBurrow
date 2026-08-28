import dns from 'node:dns/promises';
import net from 'node:net';

const MAX_BODY = { github: 2_000_000, weather: 1_000_000, calendar: 5_000_000, rss: 3_000_000 };
const MIME = {
  github: ['application/json'], weather: ['application/json'],
  calendar: ['text/calendar', 'text/plain', 'application/octet-stream'],
  rss: ['application/rss+xml', 'application/atom+xml', 'application/xml', 'text/xml', 'text/plain'],
};

export function isPrivateAddress(address) {
  if (!net.isIP(address)) return true;
  if (address.includes(':')) {
    const value = address.toLowerCase();
    return value === '::1' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe80:') || value.startsWith('::ffff:127.');
  }
  const [a, b] = address.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

export function parseDeepLink(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'webburrow:') return null;
    const route = [url.hostname, ...url.pathname.split('/').filter(Boolean)];
    if (route[0] === 'show' && route.length === 1) return { type: 'show' };
    if (route[0] === 'quick-access' && route.length === 1) return { type: 'quick-access' };
    if (route[0] === 'add' && route.length === 1) {
      const title = (url.searchParams.get('title') || '').slice(0, 80);
      const candidate = url.searchParams.get('url');
      if (candidate && !isSafeExternalUrl(candidate)) return null;
      return { type: 'add', payload: { title, url: candidate || '' } };
    }
    if (route[0] === 'room' && route.length === 2 && /^[\w-]{1,100}$/.test(route[1])) return { type: 'room', payload: route[1] };
    if (route[0] === 'open' && route.length === 2 && /^[\w-]{1,100}$/.test(route[1])) return { type: 'open-object', payload: route[1] };
  } catch {}
  return null;
}

export function isSafeExternalUrl(value) {
  try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; }
}

export function buildIntegrationUrl(request) {
  if (!request || typeof request !== 'object') throw new Error('Malformed integration request.');
  if (request.kind === 'github') {
    if (typeof request.path !== 'string' || !/^\/(repos|users)\/[A-Za-z0-9_.\/-]+(?:\?.*)?$/.test(request.path)) throw new Error('Invalid GitHub path.');
    return new URL(`https://api.github.com${request.path}`);
  }
  if (request.kind === 'weather') {
    if (!['geocode', 'forecast'].includes(request.endpoint) || !request.query || typeof request.query !== 'object') throw new Error('Invalid weather request.');
    const host = request.endpoint === 'geocode' ? 'geocoding-api.open-meteo.com' : 'api.open-meteo.com';
    const pathname = request.endpoint === 'geocode' ? '/v1/search' : '/v1/forecast';
    const url = new URL(`https://${host}${pathname}`);
    for (const [key, value] of Object.entries(request.query)) if (/^[a-z0-9_]+$/i.test(key)) url.searchParams.set(key, String(value).slice(0, 300));
    return url;
  }
  if (request.kind === 'calendar' || request.kind === 'rss') {
    const url = new URL(request.url);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Subscriptions require HTTPS and no embedded credentials.');
    return url;
  }
  throw new Error('Unsupported integration operation.');
}

async function assertPublicHost(url, kind) {
  if (kind === 'github' && url.hostname !== 'api.github.com') throw new Error('Unexpected GitHub host.');
  if (kind === 'weather' && !['api.open-meteo.com', 'geocoding-api.open-meteo.com'].includes(url.hostname)) throw new Error('Unexpected weather host.');
  const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!records.length || records.some(record => isPrivateAddress(record.address))) throw new Error('Private or local network targets are blocked.');
}

export async function hardenedIntegrationRequest(request, fetchImpl = fetch) {
  let url = buildIntegrationUrl(request);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    for (let redirects = 0; redirects <= 3; redirects += 1) {
      await assertPublicHost(url, request.kind);
      const headers = { Accept: MIME[request.kind].join(', '), 'User-Agent': 'WebBurrow/0.1' };
      if (request.etag) headers['If-None-Match'] = request.etag;
      const response = await fetchImpl(url, { headers, redirect: 'manual', signal: controller.signal });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location || redirects === 3) throw new Error('Too many or invalid redirects.');
        url = new URL(location, url);
        if (url.protocol !== 'https:') throw new Error('Insecure redirects are blocked.');
        continue;
      }
      if (response.status === 304) return { status: 304, body: '', contentType: response.headers.get('content-type') || '', etag: request.etag, notModified: true };
      const type = (response.headers.get('content-type') || '').toLowerCase();
      if (!MIME[request.kind].some(value => type.startsWith(value))) throw new Error('The response has an unsupported content type.');
      const declared = Number(response.headers.get('content-length') || 0);
      if (declared > MAX_BODY[request.kind]) throw new Error('The response is too large.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > MAX_BODY[request.kind]) throw new Error('The response is too large.');
      const remaining=Number(response.headers.get('x-ratelimit-remaining'));const reset=Number(response.headers.get('x-ratelimit-reset'));return { status: response.status, body: new TextDecoder().decode(bytes), contentType: type, etag: response.headers.get('etag') || undefined, rateLimit:Number.isFinite(remaining)&&Number.isFinite(reset)?{remaining,resetAt:reset*1000}:undefined };
    }
  } finally { clearTimeout(timeout); }
  throw new Error('Request could not be completed.');
}
