const HOST = 'com.webburrow.desktop';let nativePort;const pending=new Map();

function normalized(value){try{const url=new URL(value);url.hash='';if((url.protocol==='https:'&&url.port==='443')||(url.protocol==='http:'&&url.port==='80'))url.port='';url.protocol=url.protocol.toLowerCase();url.hostname=url.hostname.toLowerCase();return url.toString();}catch{return '';}}
function connect(){if(nativePort)return nativePort;nativePort=chrome.runtime.connectNative(HOST);nativePort.onMessage.addListener(async response=>{if(response.type==='focus-or-open'){let handled=false;if((await chrome.permissions.contains({permissions:['tabs']}))&&/^https?:/.test(response.url)){const target=normalized(response.url);const tabs=await chrome.tabs.query({});const match=tabs.find(tab=>normalized(tab.url)===target);if(match?.id){await chrome.tabs.update(match.id,{active:true});if(match.windowId)await chrome.windows.update(match.windowId,{focused:true});handled=true;}nativePort?.postMessage({type:'focus-or-open-result',requestId:response.requestId,handled});}return;}const resolve=pending.get(response.requestId);if(resolve){pending.delete(response.requestId);resolve(response);}});nativePort.onDisconnect.addListener(()=>{nativePort=undefined;for(const resolve of pending.values())resolve({ok:false,error:{code:'connection',message:chrome.runtime.lastError?.message||'WebBurrow disconnected.'}});pending.clear();});return nativePort;}

function sendNative(message) {
  return new Promise(resolve => {
    const requestId=crypto.randomUUID();pending.set(requestId,resolve);try{connect().postMessage({requestId,...message});}catch(error){pending.delete(requestId);resolve({ok:false,error:{code:'connection',message:error.message}});}
  });
}

chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  (async () => {
    if (message.type === 'status') return sendNative({ type:'capabilities' });
    if (message.type === 'send-page') return sendNative({ type:'send-page', page:message.page, collection:message.collection, archetype:message.archetype, favorite:message.favorite });
    if (message.type === 'request-tabs') {
      const granted = await chrome.permissions.request({ permissions:['tabs'] });
      if (!granted) return { ok:false, error:{ code:'permission-denied', message:'Tabs permission was not granted.' } };
      const tabs = (await chrome.tabs.query({ currentWindow:true })).filter(tab => /^https?:/.test(tab.url || '')).slice(0,100).map(tab => ({ id:tab.id, title:tab.title || 'Untitled tab', url:tab.url }));
      return { ok:true, tabs };
    }
    if (message.type === 'send-tabs') return sendNative({ type:'send-tabs', name:message.name || 'Browser session', tabs:message.tabs.slice(0,100) });
    if (message.type === 'request-bookmarks') {
      const granted = await chrome.permissions.request({ permissions:['bookmarks'] });
      if (!granted) return { ok:false, error:{ code:'permission-denied', message:'Bookmarks permission was not granted.' } };
      const tree = await chrome.bookmarks.getTree(); return { ok:true, tree };
    }
    if (message.type === 'send-bookmarks') return sendNative({ type:'bookmark-preview', html:message.html });
    return { ok:false, error:{ code:'unknown', message:'Unknown request.' } };
  })().then(respond);
  return true;
});

chrome.runtime.onMessageExternal?.addListener(() => false);
