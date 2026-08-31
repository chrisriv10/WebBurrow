import type { BookmarkObject } from './types';
import { threeText } from './assets';

export type SiteBrand='github'|'youtube'|'spotify'|'mdn'|'wikipedia'|'notion'|'vercel'|'twitch'|'google'|'google-docs'|'stackoverflow'|'leetcode'|'generic';
export type SiteIdentity={monogram:string;domain:string;host:string;category:string;symbol:string;brand:SiteBrand};

const KNOWN:Record<string,Pick<SiteIdentity,'monogram'|'category'|'symbol'|'brand'>>={
  'github.com':{monogram:'GH',category:'Code forge',symbol:'⌘',brand:'github'},
  'youtube.com':{monogram:'YT',category:'Watch',symbol:'▶',brand:'youtube'},
  'spotify.com':{monogram:'SP',category:'Listen',symbol:'≋',brand:'spotify'},
  'developer.mozilla.org':{monogram:'MDN',category:'Reference',symbol:'{ }',brand:'mdn'},
  'wikipedia.org':{monogram:'W',category:'Knowledge',symbol:'W',brand:'wikipedia'},
  'notion.so':{monogram:'N',category:'Notes',symbol:'✦',brand:'notion'},
  'vercel.com':{monogram:'VC',category:'Deploy',symbol:'V',brand:'vercel'},
  'twitch.tv':{monogram:'TV',category:'Live',symbol:'◉',brand:'twitch'},
  'stackoverflow.com':{monogram:'SO',category:'Answers',symbol:'⌘',brand:'stackoverflow'},
  'leetcode.com':{monogram:'LC',category:'Practice',symbol:'<>',brand:'leetcode'},
  'docs.google.com':{monogram:'G',category:'Documents',symbol:'▤',brand:'google-docs'},
  'google.com':{monogram:'G',category:'Search',symbol:'⌕',brand:'google'},
};

export function siteIdentity(object:Pick<BookmarkObject,'name'|'url'|'collection'>):SiteIdentity {
  const hostname=new URL(object.url).hostname.replace(/^www\./,'');
  const known=Object.entries(KNOWN).find(([domain])=>hostname===domain||hostname.endsWith(`.${domain}`))?.[1];
  const words=object.name.trim().split(/\s+/).filter(Boolean);
  const fallback=(words.length>1?words.slice(0,2).map(word=>word[0]).join(''):object.name.slice(0,2)).normalize('NFKD').replace(/[^a-z0-9]/gi,'').toUpperCase()||'WB';
  const collection=object.collection?.trim();
  return {
    monogram:known?.monogram??fallback,
    domain:hostname,
    host:hostname,
    category:collection?threeText(collection)||known?.category||'Website':known?.category||'Website',
    symbol:known?.symbol??fallback.slice(0,1),
    brand:known?.brand??'generic',
  };
}
