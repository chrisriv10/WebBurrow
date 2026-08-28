import { DEFAULT_ROOM_APPEARANCE, type BookmarkObject, type Preferences, type Room } from './types';

const now = Date.now();
export const DEMO_ROOMS: Room[] = [
  { id:'room-home', name:'Home Den', template:'den', accent:'#a78bfa', spawn:[0,1.1,5.25], lifecycle:'permanent', purpose:'standard',layoutVersion:2,appearance:{...DEFAULT_ROOM_APPEARANCE,icon:'home',wall:'soft-slate',floor:'dark-wood',lighting:'cozy-night',exterior:'quiet-rain',furniture:'compact',decor:'books'}, isDemo:true, createdAt:now },
  { id:'room-dev', name:'Developer Studio', template:'studio', accent:'#74c7ec', spawn:[0,1.1,6.15], lifecycle:'permanent', purpose:'standard',layoutVersion:2,appearance:{...DEFAULT_ROOM_APPEARANCE,icon:'code',wall:'navy-panel',floor:'technical',lighting:'focus',exterior:'city-night',furniture:'modular',decor:'technical'}, isDemo:true, createdAt:now+1 },
  { id:'room-media', name:'Media Lounge', template:'lounge', accent:'#c68cff', spawn:[0,1.1,5.8], lifecycle:'permanent', purpose:'standard',layoutVersion:2,appearance:{...DEFAULT_ROOM_APPEARANCE,icon:'media',wall:'graphite',floor:'woven',lighting:'media',exterior:'blue-hour',furniture:'classic',decor:'plants'}, isDemo:true, createdAt:now+2 },
];

const make = (id:string, roomId:string, name:string, url:string, archetype:BookmarkObject['archetype'], color:string, position:[number,number,number], favorite=false):BookmarkObject => ({
  id, roomId, name, url, archetype, color, position, rotation:0, favorite, icon:'globe', usageCount:0, collection:roomId==='room-dev'?'Build':roomId==='room-media'?'Unwind':'Everyday', lifecycle:'permanent', source:'demo', isDemo:true, createdAt:now, updatedAt:now,
});

export const DEMO_OBJECTS: BookmarkObject[] = [
  make('site-search','room-home','Search the web','https://www.google.com/','pedestal','#8be6ff',[-4,0,-3],true),
  make('site-notion','room-home','Notes & ideas','https://www.notion.so/','book','#c5a9ff',[0,0,-4],true),
  make('site-wiki','room-home','Wikipedia','https://www.wikipedia.org/','file-box','#d8cfbd',[4,0,-3]),
  make('site-github','room-dev','GitHub','https://github.com/','laptop','#748cff',[-3,0,-3],true),
  make('site-docs','room-dev','MDN Web Docs','https://developer.mozilla.org/','book','#76d2c5',[1,0,-4],true),
  make('site-vercel','room-dev','Vercel','https://vercel.com/','terminal','#e9e9f2',[4,0,-2]),
  make('site-youtube','room-media','YouTube','https://www.youtube.com/','tv','#d95868',[-3,0,-4],true),
  make('site-spotify','room-media','Spotify','https://open.spotify.com/','radio','#7ccf9a',[2,0,-3],true),
  make('site-twitch','room-media','Twitch','https://www.twitch.tv/','poster','#a980ff',[5,0,-1]),
];

export const DEFAULT_PREFERENCES: Preferences = { lastRoomId:'room-home', trayOpen:false, trayPinned:false, reducedEffects:false, hasEntered:false, recentSearches:[], searchProvider:'duckduckgo', trayModules:['favorites','recent','note'], systemTrayEnabled:false, minimizeToTray:false, temperatureUnit:'fahrenheit', windowEffects:true,soundEnabled:false,soundVolume:.35,ambienceEnabled:true,onboardingMilestones:[] };
