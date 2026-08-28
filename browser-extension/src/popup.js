const $ = selector => document.querySelector(selector);
let currentPage; let tabs = []; let bookmarkTree = [];
const call = message => chrome.runtime.sendMessage(message);
const message = value => { $('#message').textContent = value; };

function bookmarkRows(nodes, depth=0, output=[]) {
  for (const node of nodes || []) { if (node.url && /^https?:/.test(node.url)) output.push({ id:node.id, title:node.title || node.url, url:node.url, depth }); if (node.children) bookmarkRows(node.children, depth+1, output); }
  return output;
}
function netscape(nodes) {
  const escape = value => String(value).replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  const render = (items, depth=0) => (items||[]).map(node => node.url ? `<DT><A HREF="${escape(node.url)}">${escape(node.title||node.url)}</A>` : `<DT><H3>${escape(node.title||'Bookmarks')}</H3><DL><p>${render(node.children,depth+1)}</DL><p>`).join('\n');
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1><TITLE>Bookmarks</TITLE><H1>Bookmarks</H1><DL><p>${render(nodes)}</DL><p>`;
}

(async()=>{ const [tab]=await chrome.tabs.query({active:true,currentWindow:true});currentPage={title:tab?.title||'',url:tab?.url||''};$('#title').value=currentPage.title;const status=await call({type:'status'});$('#status').textContent=status?.ok?'Connected':'Open desktop app';$('#status').classList.toggle('ok',Boolean(status?.ok));})();
$('#send-page').onclick=async()=>{if(!/^https?:/.test(currentPage?.url||''))return message('Only web pages can be sent.');const result=await call({type:'send-page',page:{title:$('#title').value,url:currentPage.url},collection:$('#collection').value,archetype:$('#archetype').value||undefined,favorite:$('#favorite').checked});message(result?.ok?'Page sent to WebBurrow.':result?.error?.message||'Could not send page.');};
$('#load-tabs').onclick=async()=>{const result=await call({type:'request-tabs'});if(!result?.ok)return message(result?.error?.message||'Permission denied.');tabs=result.tabs;$('#tabs').innerHTML=tabs.map((tab,index)=>`<label><input type="checkbox" data-tab="${index}" checked><span>${tab.title.replace(/[<>]/g,'')}</span></label>`).join('');$('#send-tabs').classList.remove('hidden');};
$('#send-tabs').onclick=async()=>{const chosen=[...document.querySelectorAll('[data-tab]:checked')].map(input=>tabs[Number(input.dataset.tab)]);const result=await call({type:'send-tabs',tabs:chosen,name:'Browser session'});message(result?.ok?`${chosen.length} tabs sent as a temporary room.`:result?.error?.message||'Could not send tabs.');};
$('#load-bookmarks').onclick=async()=>{const result=await call({type:'request-bookmarks'});if(!result?.ok)return message(result?.error?.message||'Permission denied.');bookmarkTree=result.tree;const rows=bookmarkRows(bookmarkTree);$('#bookmarks').textContent=`${rows.length} safe web bookmarks ready for WebBurrow’s selection screen.`;$('#send-bookmarks').classList.remove('hidden');};
$('#send-bookmarks').onclick=async()=>{const result=await call({type:'send-bookmarks',html:netscape(bookmarkTree)});message(result?.ok?'Bookmark preview opened in WebBurrow.':result?.error?.message||'Could not send bookmarks.');};
