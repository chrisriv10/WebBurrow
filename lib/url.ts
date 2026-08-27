import type { Archetype } from './types';

export function normalizeUrl(input: string): string {
  const raw = input.trim();
  if (!raw) throw new Error('Enter a website address.');
  const explicitProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw);
  const hostWithPort = /^[\w.-]+:\d+(?:\/|$)/.test(raw);
  if (explicitProtocol && !raw.includes('://') && !hostWithPort) throw new Error('Only http and https websites can be saved.');
  const candidate = raw.includes('://') ? raw : `https://${raw}`;
  let url: URL;
  try { url = new URL(candidate); } catch { throw new Error('That website address is not valid.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http and https websites can be saved.');
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  url.hash = '';
  if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) url.port = '';
  return url.toString();
}

export function autoArchetype(urlValue: string): Archetype {
  const host = new URL(normalizeUrl(urlValue)).hostname.replace(/^www\./, '');
  if (/youtube|twitch|netflix|vimeo/.test(host)) return 'tv';
  if (/github|gitlab|vercel|cloudflare|stack/.test(host)) return 'terminal';
  if (/spotify|soundcloud|bandcamp|music|radio/.test(host)) return 'radio';
  if (/docs|developer|wikipedia|notion/.test(host)) return 'book';
  if (/instagram|pinterest|behance|dribbble/.test(host)) return 'poster';
  if (/mail|calendar|classroom|canvas|school/.test(host)) return 'laptop';
  return 'pedestal';
}

export function safeOpen(urlValue: string) {
  const url = normalizeUrl(urlValue);
  window.open(url, '_blank', 'noopener,noreferrer');
}
