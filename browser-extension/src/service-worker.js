const HOST = 'com.webburrow.desktop';

function sendNative(message) {
  return new Promise(resolve => {
    chrome.runtime.sendNativeMessage(HOST, { requestId:crypto.randomUUID(), ...message }, response => {
      if (chrome.runtime.lastError) resolve({ ok:false, error:{ code:'connection', message:chrome.runtime.lastError.message } });
      else resolve(response || { ok:false, error:{ code:'empty', message:'No response from WebBurrow.' } });
    });
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
