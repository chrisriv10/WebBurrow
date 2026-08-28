const $ = selector => document.querySelector(selector);
let currentPage; let tabs = []; let groups = []; let nativeContext; let bookmarkTree = [];
const call = message => chrome.runtime.sendMessage(message);
const message = value => { $('#message').textContent = value; };

function addOption(select,value,label) { const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option); }
function renderTabs() {
  const list=$('#tabs');list.replaceChildren();
  for(const [index,tab] of tabs.entries()){const label=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.dataset.tab=String(index);input.checked=true;const text=document.createElement('span');text.textContent=tab.title;label.append(input,text);list.append(label);}
  const groupList=$('#groups');groupList.replaceChildren();groupList.classList.toggle('hidden',$('#scope').value!=='group');
  for(const [index,group] of groups.entries()){const label=document.createElement('label');const input=document.createElement('input');input.type='radio';input.name='tab-group';input.dataset.group=String(group.id);input.checked=index===0;const text=document.createElement('span');text.textContent=group.title||`Group ${index+1}`;label.append(input,text);groupList.append(label);}
}
function bookmarkRows(nodes, depth=0, output=[]) {
  for (const node of nodes || []) { if (node.url && /^https?:/.test(node.url)) output.push({ id:node.id, title:node.title || node.url, url:node.url, depth }); if (node.children) bookmarkRows(node.children, depth+1, output); }
  return output;
}
function netscape(nodes) {
  const escape = value => String(value).replace(/[&<>\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  const render = items => (items||[]).map(node => node.url ? `<DT><A HREF="${escape(node.url)}">${escape(node.title||node.url)}</A>` : `<DT><H3>${escape(node.title||'Bookmarks')}</H3><DL><p>${render(node.children)}</DL><p>`).join('\n');
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1><TITLE>Bookmarks</TITLE><H1>Bookmarks</H1><DL><p>${render(nodes)}</DL><p>`;
}
async function iconPayload() {
  if(!$('#include-icon').checked||!currentPage?.favIconUrl)return undefined;
  try{
    const iconUrl=new URL(currentPage.favIconUrl);const pageUrl=new URL(currentPage.url);
    if(iconUrl.protocol!=='data:'&&iconUrl.origin!==pageUrl.origin)throw new Error('The page icon is hosted elsewhere.');
    const response=await fetch(iconUrl);const blob=await response.blob();if(blob.size>64*1024||!['image/png','image/jpeg','image/webp','image/x-icon','image/vnd.microsoft.icon'].includes(blob.type))throw new Error('The page icon is not a supported local image.');
    const bitmap=await createImageBitmap(blob);const scale=Math.min(1,64/Math.max(bitmap.width,bitmap.height));const width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));const canvas=new OffscreenCanvas(width,height);canvas.getContext('2d').drawImage(bitmap,0,0,width,height);bitmap.close();const encoded=await canvas.convertToBlob({type:'image/png'});const bytes=new Uint8Array(await encoded.arrayBuffer());if(bytes.byteLength>64*1024)throw new Error('The re-encoded icon is too large.');let binary='';for(let index=0;index<bytes.length;index+=0x8000)binary+=String.fromCharCode(...bytes.subarray(index,index+0x8000));return{mime:'image/png',dataBase64:btoa(binary)};
  }catch(error){message(error.message||'The page icon could not be included.');return undefined;}
}

(async()=>{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});currentPage={title:tab?.title||'',url:tab?.url||'',favIconUrl:tab?.favIconUrl,tabId:tab?.id,windowId:tab?.windowId,groupId:tab?.groupId};$('#title').value=currentPage.title;
  const status=await call({type:'status'});nativeContext=status?.result;$('#status').textContent=status?.ok?'Connected':'Open desktop app';$('#status').classList.toggle('ok',Boolean(status?.ok));
  for(const room of nativeContext?.rooms||[])addOption($('#room'),room.id,room.name);for(const collection of nativeContext?.collections||[])addOption($('#collections'),collection.name,collection.name);for(const workspace of nativeContext?.workspaces||[])addOption($('#workspace'),workspace.id,`${workspace.name} · ${workspace.tabCount} tabs`);
  $('#workspace').disabled=true;
})();
$('#send-page').onclick=async()=>{if(!/^https?:/.test(currentPage?.url||''))return message('Only web pages can be sent.');const favicon=await iconPayload();const result=await call({type:'send-page',page:{title:$('#title').value,url:currentPage.url,tabId:currentPage.tabId,windowId:currentPage.windowId,favicon},roomId:$('#room').value||undefined,collection:$('#collection').value||undefined,archetype:$('#archetype').value||undefined,color:$('#color').value,favorite:$('#favorite').checked});message(result?.ok?'Page sent to WebBurrow.':result?.error?.message||'Could not send page.');};
$('#scope').onchange=renderTabs;
$('#mode').onchange=()=>{$('#workspace').disabled=$('#mode').value==='create';};
$('#load-tabs').onclick=async()=>{const result=await call({type:'request-tabs',includeGroups:true});if(!result?.ok)return message(result?.error?.message||'Permission denied.');tabs=result.tabs;groups=result.groups||[];renderTabs();$('#send-tabs').classList.remove('hidden');};
$('#send-tabs').onclick=async()=>{const scope=$('#scope').value;let chosen;if(scope==='selection')chosen=[...document.querySelectorAll('[data-tab]:checked')].map(input=>tabs[Number(input.dataset.tab)]);else if(scope==='group'){const groupId=Number(document.querySelector('[data-group]:checked')?.dataset.group);chosen=tabs.filter(tab=>tab.groupId===groupId);}else chosen=tabs;const mode=$('#mode').value,workspaceId=$('#workspace').value||undefined;if(mode!=='create'&&!workspaceId)return message('Choose an existing temporary workspace.');if(!chosen.length)return message('Choose at least one safe web tab.');const result=await call({type:'send-tabs',tabs:chosen,name:$('#workspace-name').value||'Browser session',scope,mode,workspaceId});message(result?.ok?`${chosen.length} tabs sent to WebBurrow.`:result?.error?.message||'Could not send tabs.');};
$('#load-bookmarks').onclick=async()=>{const result=await call({type:'request-bookmarks'});if(!result?.ok)return message(result?.error?.message||'Permission denied.');bookmarkTree=result.tree;const rows=bookmarkRows(bookmarkTree);$('#bookmarks').textContent=`${rows.length} safe web bookmarks ready for WebBurrow’s selection screen.`;$('#send-bookmarks').classList.remove('hidden');};
$('#send-bookmarks').onclick=async()=>{const result=await call({type:'send-bookmarks',html:netscape(bookmarkTree)});message(result?.ok?'Bookmark preview opened in WebBurrow.':result?.error?.message||'Could not send bookmarks.');};
