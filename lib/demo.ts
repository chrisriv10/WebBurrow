import { DEFAULT_ROOM_APPEARANCE, type BookmarkObject, type Preferences, type Room } from './types';

const now = Date.now();
export const DEMO_ROOMS: Room[] = [
  { id:'room-home', name:'Home Den', template:'den', accent:'#a78bfa', spawn:[0,1.1,5.05], lifecycle:'permanent', purpose:'standard',layoutVersion:4,appearance:{...DEFAULT_ROOM_APPEARANCE,icon:'home',wall:'soft-slate',floor:'dark-wood',lighting:'cozy-night',exterior:'quiet-rain',furniture:'compact',decor:'books',windowEffect:'weather',ambience:'soft-hum'}, isDemo:true, createdAt:now },
  { id:'room-dev', name:'Developer Studio', template:'studio', accent:'#74c7ec', spawn:[0,1.1,6.25], lifecycle:'permanent', purpose:'standard',layoutVersion:4,appearance:{...DEFAULT_ROOM_APPEARANCE,icon:'code',wall:'navy-panel',floor:'technical',lighting:'focus',exterior:'city-night',furniture:'modular',decor:'technical',windowEffect:'cinematic',ambience:'soft-hum'}, isDemo:true, createdAt:now+1 },
  { id:'room-media', name:'Media Lounge', template:'lounge', accent:'#c68cff', spawn:[0,1.1,5.75], lifecycle:'permanent', purpose:'standard',layoutVersion:4,appearance:{...DEFAULT_ROOM_APPEARANCE,icon:'media',wall:'graphite',floor:'woven',lighting:'media',exterior:'blue-hour',furniture:'classic',decor:'plants',windowEffect:'cinematic',ambience:'quiet'}, isDemo:true, createdAt:now+2 },
];

const make = (id:string, roomId:string, name:string, url:string, archetype:BookmarkObject['archetype'], color:string, position:[number,number,number], favorite=false,rotation=0,mount?:BookmarkObject['mount']):BookmarkObject => ({
  id, roomId, name, url, archetype, color, position, rotation, mount, favorite, icon:'globe', usageCount:0, collection:roomId==='room-dev'?'Build':roomId==='room-media'?'Unwind':'Everyday', lifecycle:'permanent', source:'demo', isDemo:true, createdAt:now, updatedAt:now,
});

export const DEMO_OBJECTS: BookmarkObject[] = [
  make('site-search','room-home','Search the web','https://www.google.com/','pedestal','#70cad8',[-2.5,0,-3.8],true),
  make('site-notion','room-home','Notes & ideas','https://www.notion.so/','book','#a995d0',[4.55,1.19,-3.15],true,-Math.PI/2,{kind:'shelf',surfaceId:'den-shelf'}),
  make('site-wiki','room-home','Wikipedia','https://www.wikipedia.org/','file-box','#b8ae9d',[2.6,0,-3.6]),
  make('site-github','room-dev','GitHub','https://github.com/','laptop','#748cff',[-5.55,1.15,-2.4],true,Math.PI/2,{kind:'desk',surfaceId:'studio-left-desk'}),
  make('site-docs','room-dev','MDN Web Docs','https://developer.mozilla.org/','book','#6eb8ad',[-6.75,1.19,3.35],true,Math.PI/2,{kind:'shelf',surfaceId:'studio-shelf'}),
  make('site-vercel','room-dev','Vercel','https://vercel.com/','terminal','#c8cad2',[5.55,1.15,-2.4],false,-Math.PI/2,{kind:'desk',surfaceId:'studio-right-desk'}),
  make('site-youtube','room-media','YouTube','https://www.youtube.com/','tv','#c85c69',[3.7,.78,-6.05],true,0,{kind:'media',surfaceId:'lounge-media'}),
  make('site-spotify','room-media','Spotify','https://open.spotify.com/','radio','#69ad81',[.15,.59,-.25],true,0,{kind:'desk',surfaceId:'lounge-table'}),
  make('site-twitch','room-media','Twitch','https://www.twitch.tv/','poster','#9574ca',[-5.75,1.5,-6.98],false,0,{kind:'wall',surfaceId:'lounge-wall-left'}),
];

export const DEFAULT_PREFERENCES: Preferences = { lastRoomId:'room-home', trayOpen:false, trayPinned:false, reducedEffects:false, hasEntered:false, recentSearches:[], searchProvider:'duckduckgo', trayModules:['favorites','recent','note'], systemTrayEnabled:false, minimizeToTray:false, temperatureUnit:'fahrenheit', windowEffects:true,soundEnabled:false,soundVolume:.35,ambienceEnabled:true,onboardingMilestones:[] };
