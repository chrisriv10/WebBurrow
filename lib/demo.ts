import type { BookmarkObject, Preferences, Room } from './types';

const now = Date.now();
export const DEMO_ROOMS: Room[] = [
  { id:'room-home', name:'Home Den', template:'den', accent:'#a78bfa', spawn:[0,1.1,7], isDemo:true, createdAt:now },
  { id:'room-dev', name:'Developer Studio', template:'studio', accent:'#74c7ec', spawn:[0,1.1,7], isDemo:true, createdAt:now+1 },
  { id:'room-media', name:'Media Lounge', template:'lounge', accent:'#ff9f68', spawn:[0,1.1,7], isDemo:true, createdAt:now+2 },
];

const make = (id:string, roomId:string, name:string, url:string, archetype:BookmarkObject['archetype'], color:string, position:[number,number,number], favorite=false):BookmarkObject => ({
  id, roomId, name, url, archetype, color, position, rotation:0, favorite, icon:'globe', usageCount:0, source:'demo', isDemo:true, createdAt:now, updatedAt:now,
});

export const DEMO_OBJECTS: BookmarkObject[] = [
  make('site-search','room-home','Search the web','https://www.google.com/','pedestal','#8be6ff',[-4,0,-3],true),
  make('site-notion','room-home','Notes & ideas','https://www.notion.so/','book','#c5a9ff',[0,0,-4],true),
  make('site-wiki','room-home','Wikipedia','https://www.wikipedia.org/','poster','#f2d59a',[4,0,-3]),
  make('site-github','room-dev','GitHub','https://github.com/','terminal','#748cff',[-3,0,-3],true),
  make('site-docs','room-dev','MDN Web Docs','https://developer.mozilla.org/','book','#76d2c5',[1,0,-4],true),
  make('site-vercel','room-dev','Vercel','https://vercel.com/','terminal','#e9e9f2',[4,0,-2]),
  make('site-youtube','room-media','YouTube','https://www.youtube.com/','tv','#d95868',[-3,0,-4],true),
  make('site-spotify','room-media','Spotify','https://open.spotify.com/','arcade','#7ccf9a',[2,0,-3],true),
  make('site-twitch','room-media','Twitch','https://www.twitch.tv/','poster','#a980ff',[5,0,-1]),
];

export const DEFAULT_PREFERENCES: Preferences = { lastRoomId:'room-home', trayOpen:false, trayPinned:false, reducedEffects:false, hasEntered:false };
