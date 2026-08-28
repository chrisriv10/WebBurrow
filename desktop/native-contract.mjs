const TYPES=new Set(['capabilities','send-page','send-tabs','bookmark-preview','focus-or-open-result']);
const MODES=new Set(['create','append','replace']);
const SCOPES=new Set(['selection','window','group']);
const ICON_TYPES=new Set(['image/png','image/jpeg','image/webp']);
const KEYS={
  capabilities:['type','requestId'],
  'send-page':['type','requestId','page','roomId','collection','archetype','color','favorite'],
  'send-tabs':['type','requestId','tabs','name','scope','mode','workspaceId'],
  'bookmark-preview':['type','requestId','html'],
  'focus-or-open-result':['type','requestId','handled','tabId'],
};
const TAB_KEYS=new Set(['title','url','tabId','windowId','groupId','groupName','favicon']);
const ICON_KEYS=new Set(['mime','dataBase64']);

function exactKeys(value,allowed){return Object.keys(value).every(key=>allowed.includes?.(key)||allowed.has?.(key));}
function webUrl(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password;}catch{return false;}}
function boundedString(value,max,min=0){return typeof value==='string'&&value.length>=min&&value.length<=max;}
function optionalInteger(value,{negative=false}={}){return value===undefined||(Number.isInteger(value)&&(negative||value>=0));}
function validIcon(icon){if(icon===undefined)return true;if(!icon||typeof icon!=='object'||Array.isArray(icon)||!exactKeys(icon,ICON_KEYS)||!ICON_TYPES.has(icon.mime)||!boundedString(icon.dataBase64,90_000,1)||!/^[A-Za-z0-9+/]+={0,2}$/.test(icon.dataBase64))return false;try{return Buffer.from(icon.dataBase64,'base64').byteLength<=64*1024;}catch{return false;}}
function validTab(tab){return Boolean(tab&&typeof tab==='object'&&!Array.isArray(tab)&&exactKeys(tab,TAB_KEYS)&&boundedString(tab.title,200,1)&&webUrl(tab.url)&&optionalInteger(tab.tabId)&&optionalInteger(tab.windowId)&&optionalInteger(tab.groupId,{negative:true})&&(tab.groupName===undefined||boundedString(tab.groupName,80))&&validIcon(tab.favicon));}

export function parseNativeMessage(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||!TYPES.has(input.type)||!exactKeys(input,KEYS[input.type])||!boundedString(input.requestId,100,1))throw new Error('The native message is malformed.');
  if(input.type==='capabilities')return input;
  if(input.type==='send-page'){
    if(!validTab(input.page)||(input.roomId!==undefined&&!boundedString(input.roomId,100,1))||(input.collection!==undefined&&!boundedString(input.collection,40))||(input.archetype!==undefined&&!boundedString(input.archetype,40,1))||(input.color!==undefined&&!/^#[0-9a-f]{6}$/i.test(input.color))||(input.favorite!==undefined&&typeof input.favorite!=='boolean'))throw new Error('The page transfer is invalid.');return input;
  }
  if(input.type==='send-tabs'){
    if(!Array.isArray(input.tabs)||input.tabs.length<1||input.tabs.length>100||!input.tabs.every(validTab)||!boundedString(input.name,60,1)||!SCOPES.has(input.scope)||!MODES.has(input.mode)||(input.workspaceId!==undefined&&!boundedString(input.workspaceId,100,1))||(input.mode!=='create'&&!input.workspaceId))throw new Error('The workspace transfer is invalid.');return input;
  }
  if(input.type==='bookmark-preview'){if(!boundedString(input.html,2_000_000))throw new Error('The bookmark preview is invalid.');return input;}
  if(typeof input.handled!=='boolean'||!optionalInteger(input.tabId))throw new Error('The focus result is invalid.');return input;
}

export function nativeCapabilities(context={}){return{version:1,capabilities:['send-page','send-tabs','bookmark-preview','focus-or-open','favicon'],workspaces:Array.isArray(context.workspaces)?context.workspaces.slice(0,30):[],rooms:Array.isArray(context.rooms)?context.rooms.slice(0,100):[],collections:Array.isArray(context.collections)?context.collections.slice(0,100):[]};}
