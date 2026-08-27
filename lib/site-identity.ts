import type { BookmarkObject } from './types';

type SiteIdentity={monogram:string;domain:string;host:string;category:string;symbol:string};

const KNOWN:Record<string,Pick<SiteIdentity,'monogram'|'category'|'symbol'>>={
  'github.com':{monogram:'GH',category:'Code forge',symbol:'⌘'},
  'youtube.com':{monogram:'YT',category:'Watch',symbol:'▶'},
  'spotify.com':{monogram:'SP',category:'Listen',symbol:'≋'},
  'developer.mozilla.org':{monogram:'MDN',category:'Reference',symbol:'{ }'},
  'wikipedia.org':{monogram:'W',category:'Knowledge',symbol:'W'},
  'notion.so':{monogram:'N',category:'Notes',symbol:'✦'},
  'vercel.com':{monogram:'VC',category:'Deploy',symbol:'V'},
  'twitch.tv':{monogram:'TV',category:'Live',symbol:'◉'},
  'google.com':{monogram:'G',category:'Search',symbol:'⌕'},
};

export function siteIdentity(object:Pick<BookmarkObject,'name'|'url'|'collection'>):SiteIdentity {
  const hostname=new URL(object.url).hostname.replace(/^www\./,'');
  const known=Object.entries(KNOWN).find(([domain])=>hostname===domain||hostname.endsWith(`.${domain}`))?.[1];
  const words=object.name.trim().split(/\s+/).filter(Boolean);
  const fallback=(words.length>1?words.slice(0,2).map(word=>word[0]).join(''):object.name.slice(0,2)).normalize('NFKD').replace(/[^a-z0-9]/gi,'').toUpperCase()||'WB';
  return {
    monogram:known?.monogram??fallback,
    domain:hostname,
    host:hostname,
    category:object.collection?.trim().normalize('NFKD').replace(/[^\x20-\x7E]/g,'?')||known?.category||'Website',
    symbol:known?.symbol??fallback.slice(0,1),
  };
}
