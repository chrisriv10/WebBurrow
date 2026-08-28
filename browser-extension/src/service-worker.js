const HOST = 'com.webburrow.desktop';let nativePort;const pending=new Map();

function normalized(value){try{const url=new URL(value);url.hash='';if((url.protocol==='https:'&&url.port==='443')||(url.protocol==='http:'&&url.port==='80'))url.port='';url.protocol=url.protocol.toLowerCase();url.hostname=url.hostname.toLowerCase();return url.toString();}catch{return '';}}
function connect(){if(nativePort)return nativePort;nativePort=chrome.runtime.connectNative(HOST);nativePort.onMessage.addListener(async response=>{if(response.type==='focus-or-open'){let handled=false,tabId;if((await chrome.permissions.contains({permissions:['tabs']}))&&/^https?:/.test(response.url)){const target=normalized(response.url);const browserTabs=await chrome.tabs.query({});const match=browserTabs.find(tab=>normalized(tab.url)===target);if(match?.id!==undefined){await chrome.tabs.update(match.id,{active:true});if(match.windowId!==undefined)await chrome.windows.update(match.windowId,{focused:true});handled=true;tabId=match.id;}nativePort?.postMessage({type:'focus-or-open-result',requestId:response.requestId,handled,tabId});}return;}const entry=pending.get(response.requestId);if(entry){clearTimeout(entry.timer);pending.delete(response.requestId);entry.resolve(response);}});nativePort.onDisconnect.addListener(()=>{nativePort=undefined;for(const entry of pending.values()){clearTimeout(entry.timer);entry.resolve({ok:false,error:{code:'connection',message:chrome.runtime.lastError?.message||'WebBurrow disconnected.'}});}pending.clear();});return nativePort;}

function sendNative(message) {
  return new Promise(resolve => {
    const requestId=crypto.randomUUID();const timer=setTimeout(()=>{pending.delete(requestId);resolve({ok:false,error:{code:'timeout',message:'WebBurrow did not reply.'}});},5000);pending.set(requestId,{resolve,timer});try{connect().postMessage({requestId,...message});}catch(error){clearTimeout(timer);pending.delete(requestId);resolve({ok:false,error:{code:'connection',message:error.message}});}
  });
}
function safeTab(tab){if(!/^https?:/.test(tab.url||''))return null;return{title:(tab.title||'Untitled tab').slice(0,200),url:tab.url,tabId:tab.id,windowId:tab.windowId,groupId:tab.groupId};}

chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  (async () => {
    if (message.type === 'status') return sendNative({ type:'capabilities' });
    if (message.type === 'send-page') return sendNative({ type:'send-page', page:message.page, roomId:message.roomId, collection:message.collection, archetype:message.archetype, color:message.color, favorite:message.favorite });
    if (message.type === 'request-tabs') {
      const permissions=['tabs'];if(message.includeGroups)permissions.push('tabGroups');const granted=await chrome.permissions.request({permissions});
      if (!granted) return { ok:false, error:{ code:'permission-denied', message:'Tabs permission was not granted.' } };
      const browserTabs=(await chrome.tabs.query({currentWindow:true})).map(safeTab).filter(Boolean).slice(0,100);let tabGroups=[];
      if(message.includeGroups){const records=await chrome.tabGroups.query({windowId:chrome.windows.WINDOW_ID_CURRENT});tabGroups=records.filter(group=>group.id>=0).map(group=>({id:group.id,title:(group.title||'Tab group').slice(0,80)}));for(const tab of browserTabs){const group=tabGroups.find(item=>item.id===tab.groupId);if(group)tab.groupName=group.title;}}
      return {ok:true,tabs:browserTabs,groups:tabGroups};
    }
    if (message.type === 'send-tabs') return sendNative({ type:'send-tabs', name:message.name || 'Browser session', tabs:message.tabs.slice(0,100), scope:message.scope, mode:message.mode, workspaceId:message.workspaceId });
    if (message.type === 'request-bookmarks') {
      const granted = await chrome.permissions.request({ permissions:['bookmarks'] });
      if (!granted) return { ok:false, error:{ code:'permission-denied', message:'Bookmarks permission was not granted.' } };
      const tree = await chrome.bookmarks.getTree(); return { ok:true, tree };
    }
    if (message.type === 'send-bookmarks') return sendNative({ type:'bookmark-preview', html:message.html });
    return { ok:false, error:{ code:'unknown', message:'Unknown request.' } };
  })().then(respond).catch(error=>respond({ok:false,error:{code:'extension-error',message:error?.message||'The companion could not complete that action.'}}));
  return true;
});

chrome.runtime.onMessageExternal?.addListener(() => false);
