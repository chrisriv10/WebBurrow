import { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hardenedIntegrationRequest, isSafeExternalUrl, parseDeepLink } from './security.mjs';
import { runNativeHostClient, startNativeMessageServer } from './native-messaging.mjs';
import { nativeCapabilities } from './native-contract.mjs';

const appDirectory = path.dirname(fileURLToPath(import.meta.url));
const isSmokeTest = process.argv.includes('--smoke-test');
const smokeResultArgument = process.argv.find(argument => argument.startsWith('--smoke-result='));
const requestedSmokeResult = smokeResultArgument?.slice('--smoke-result='.length);
const smokeResultCandidate = requestedSmokeResult ? path.resolve(requestedSmokeResult) : null;
const smokeResultPath = smokeResultCandidate?.toLowerCase().startsWith(`${path.resolve(app.getPath('temp')).toLowerCase()}${path.sep}`) ? smokeResultCandidate : null;
function writeSmokeResult(stage,detail){if(!smokeResultPath)return;try{fs.writeFileSync(smokeResultPath,JSON.stringify({stage,detail,at:Date.now()}));}catch{}}
const screenshotArgument = process.argv.find((argument) =>
  argument.startsWith('--screenshot='),
);
const screenshotPath = screenshotArgument?.slice('--screenshot='.length);
const qaViewArgument = process.argv.find((argument) =>
  argument.startsWith('--qa-view='),
);
const qaView = qaViewArgument?.slice('--qa-view='.length);
const rendererPath = path.join(appDirectory, 'dist', 'index.html');
const nativeHostLaunch = process.argv.some(value => value.startsWith('chrome-extension://'));
const smokeUserDataPath = isSmokeTest ? path.join(app.getPath('temp'),`webburrow-smoke-${process.pid}`) : null;
if(smokeUserDataPath)app.setPath('userData',smokeUserDataPath);
let mainWindow;
let nativeTray;
let trayPreferences = { enabled:false, minimizeToTray:false };
let traySnapshot = { favorites:[], recent:[] };
let browserContext = { workspaces:[], rooms:[], collections:[] };
let quitting = false;
let pendingCommand = null;
let nativeBridge;

if (process.platform === 'win32') {
  app.setAppUserModelId('com.webburrow.desktop');
}
if(smokeUserDataPath)app.on('quit',()=>{try{fs.rmSync(smokeUserDataPath,{recursive:true,force:true});}catch{}});

function sendCommand(command) {
  if (!command) return;
  if (!mainWindow || mainWindow.webContents.isLoading()) { pendingCommand = command; return; }
  mainWindow.webContents.send('webburrow:command', command);
}

function showWindow(command) {
  if (!mainWindow) mainWindow = createWindow();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show(); mainWindow.focus();
  if (command) sendCommand(command);
}

function sanitizedMenuItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 8).flatMap(item => item && typeof item.name === 'string' && typeof item.url === 'string' && isSafeExternalUrl(item.url)
    ? [{ id:String(item.id).slice(0,100), name:item.name.slice(0,80), url:item.url }] : []);
}

function rebuildTray() {
  if (!trayPreferences.enabled) { nativeTray?.destroy(); nativeTray = undefined; return; }
  if (!nativeTray) { nativeTray = new Tray(nativeImage.createFromPath(path.join(appDirectory, 'icon.png'))); nativeTray.setToolTip('WebBurrow'); nativeTray.on('double-click', () => showWindow({ type:'show' })); }
  const linkMenu = (items) => items.length ? items.map(item => ({ label:item.name, click:() => void shell.openExternal(item.url) })) : [{ label:'Nothing here yet', enabled:false }];
  nativeTray.setContextMenu(Menu.buildFromTemplate([
    { label:'Open WebBurrow', click:() => showWindow({ type:'show' }) },
    { label:'Quick Access', click:() => showWindow({ type:'quick-access' }) },
    { label:'Add URL', click:() => showWindow({ type:'add', payload:{} }) },
    { label:'Toggle Mini Burrow', click:() => showWindow({ type:'toggle-tray' }) },
    { type:'separator' },
    { label:'Favorites', submenu:linkMenu(traySnapshot.favorites) },
    { label:'Recent', submenu:linkMenu(traySnapshot.recent) },
    { type:'separator' },
    { label:'Quit', click:() => { quitting = true; app.quit(); } },
  ]));
}

function deepLinkFromArguments(argumentsList) { return argumentsList.map(value => parseDeepLink(value)).find(Boolean) || null; }

function createWindow() {
  writeSmokeResult('window-created');
  const rendererErrors = [];
  const compactQa = isSmokeTest && qaView === 'compact';
  const window = new BrowserWindow({
    width: compactQa ? 640 : 1440,
    height: compactQa ? 720 : 900,
    minWidth: compactQa ? 560 : 900,
    minHeight: compactQa ? 520 : 600,
    show: false,
    title: 'WebBurrow',
    backgroundColor: '#080b14',
    icon: path.join(appDirectory, 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(appDirectory, 'preload.cjs'),
    },
  });

  window.on('close', event => { if (!quitting && trayPreferences.enabled) { event.preventDefault(); window.hide(); sendCommand({ type:'visibility', payload:false }); } });
  window.on('minimize', event => { if (trayPreferences.enabled && trayPreferences.minimizeToTray) { event.preventDefault(); window.hide(); sendCommand({ type:'visibility', payload:false }); } });
  window.on('show', () => sendCommand({ type:'visibility', payload:true }));

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (url !== window.webContents.getURL()) {
      event.preventDefault();
      if (isSafeExternalUrl(url)) void shell.openExternal(url);
    }
  });

  window.webContents.on('console-message', (event) => {
    if (isSmokeTest) console.log(`WEBBURROW_RENDERER_CONSOLE ${JSON.stringify({ level:event.level,message:event.message,lineNumber:event.lineNumber,sourceId:event.sourceId })}`);
    if (event.level === 'error') rendererErrors.push(event.message);
  });

  window.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription) => {
      console.error(`WEBBURROW_DESKTOP_LOAD_FAILED ${errorCode} ${errorDescription}`);
      if (isSmokeTest) app.exit(1);
    },
  );

  window.once('ready-to-show', () => {
    if (!isSmokeTest) window.show();
  });

  window.webContents.once('did-finish-load', async () => {
    writeSmokeResult('renderer-loaded');
    if (pendingCommand) { sendCommand(pendingCommand); pendingCommand = null; }
    if (!isSmokeTest) return;

    try {
      window.show();window.focus();
      await new Promise((resolve) => setTimeout(resolve, 5000));
      writeSmokeResult('reading-renderer');
      const rendererState = await window.webContents.executeJavaScript(
        `JSON.stringify({ text: document.body.innerText.slice(0, 500), desktopBridge:Boolean(window.webburrowDesktop) })`,
      );
      writeSmokeResult('renderer-ready');
      const parsedRendererState=JSON.parse(rendererState);
      if (parsedRendererState.text.includes('OPENING YOUR BURROW') || !parsedRendererState.desktopBridge) {
        throw new Error('Renderer did not finish local persistence initialization.');
      }
      if(rendererErrors.length)throw new Error(`Renderer logged ${rendererErrors.length} error(s): ${rendererErrors[0]}`);
      if(app.isPackaged){writeSmokeResult('complete',{packaged:true,desktopBridge:true});app.exit(0);return;}
      console.log(`WEBBURROW_DESKTOP_STATE ${rendererState}`);
      await window.webContents.executeJavaScript(
        `Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.includes('Use quick controls') || button.textContent?.includes('without mouse look'))?.click()`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1400));
      if (qaView !== 'onboarding') {
        for (let index = 0; index < 10; index += 1) {
          await window.webContents.executeJavaScript(`Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.includes('Got it · show the next tip'))?.click()`);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      if (qaView === 'session' || qaView === 'workspace') {
        sendCommand({type:'browser-tabs',payload:{name:'Research sprint',tabs:[
          {title:'Web platform reference',url:'https://developer.mozilla.org/en-US/docs/Web/API',tabId:11,windowId:2,groupId:4,groupName:'Reference'},
          {title:'Project repository',url:'https://github.com/example/webburrow',tabId:12,windowId:2,groupId:4,groupName:'Reference'},
          {title:'Design notes',url:'https://example.com/design-notes',tabId:13,windowId:2,groupId:7,groupName:'Ideas'},
          {title:'Release checklist',url:'https://example.com/release',tabId:14,windowId:2,groupId:7,groupName:'Ideas'},
        ],options:{mode:'create',scope:'group'}}});
        await new Promise((resolve) => setTimeout(resolve, 3400));
      }
      if (qaView === 'stress') {
        sendCommand({type:'browser-tabs',payload:{name:'100-tab performance room',tabs:Array.from({length:100},(_,index)=>({title:`Workspace tab ${index+1}`,url:`https://example.com/work/${index+1}`,tabId:index+1,windowId:9,groupId:index%5,groupName:`Group ${index%5+1}`})),options:{mode:'create',scope:'window'}}});
        await new Promise((resolve) => setTimeout(resolve, 3400));
      }
      if (qaView === 'studio' || qaView === 'lounge') {
        const digit = qaView === 'studio' ? '2' : '3';
        await window.webContents.executeJavaScript(
          `window.dispatchEvent(new KeyboardEvent('keydown', { altKey:true, code:'Digit${digit}', key:'${digit}', bubbles:true }))`,
        );
        await new Promise((resolve) => setTimeout(resolve, 3400));
      }
      if (qaView === 'tray' || qaView === 'compact') {
        await window.webContents.executeJavaScript(
          `document.querySelector('[aria-label="Open Burrow Tray"]')?.click()`,
        );
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
      if (qaView === 'add' || qaView === 'data') {
        const label = qaView === 'add' ? 'Add site' : 'WebBurrow';
        await window.webContents.executeJavaScript(
          `Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.includes('${label}'))?.click()`,
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (qaView === 'launcher') {
        await window.webContents.executeJavaScript(
          `window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey:true, key:'k', bubbles:true }))`,
        );
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      if (qaView === 'integrations') {
        await window.webContents.executeJavaScript(`window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey:true, key:'k', bubbles:true }))`);
        await new Promise((resolve) => setTimeout(resolve, 250));
        await window.webContents.executeJavaScript(`(() => { const input=document.querySelector('[aria-label="Quick Access"] input'); if(!input)return; const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,'> integrations'); input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); })()`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (qaView === 'customize' || qaView === 'workspace') {
        const command = qaView === 'customize' ? '> customize current room' : '> manage browser workspaces';
        await window.webContents.executeJavaScript(`window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey:true, key:'k', bubbles:true }))`);
        await new Promise((resolve) => setTimeout(resolve, 250));
        await window.webContents.executeJavaScript(`(() => { const input=document.querySelector('[aria-label="Quick Access"] input'); if(!input)return; const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(input,${JSON.stringify(command)}); input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); })()`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (qaView === 'edit') {
        await window.webContents.executeJavaScript(
          `Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Edit')?.click()`,
        );
        await new Promise((resolve) => setTimeout(resolve, 900));
      }
      await window.webContents.executeJavaScript(`window.__WEBBURROW_RESET_METRICS__?.()`);
      await new Promise((resolve) => setTimeout(resolve, 2200));
      if (screenshotPath) {
        const image = await window.webContents.capturePage();
        fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
        fs.writeFileSync(screenshotPath, image.toPNG());
      }
      if (rendererErrors.length) {
        throw new Error(`Renderer logged ${rendererErrors.length} error(s): ${rendererErrors[0]}`);
      }
      const metrics = await window.webContents.executeJavaScript(`window.__WEBBURROW_METRICS__?.()`);
      console.log(`WEBBURROW_PERFORMANCE ${JSON.stringify(metrics || {})}`);
      window.hide();sendCommand({ type:'visibility', payload:false });
      await new Promise((resolve) => setTimeout(resolve, 650));
      const hiddenMetrics = await window.webContents.executeJavaScript(`window.__WEBBURROW_METRICS__?.()`);
      console.log(`WEBBURROW_HIDDEN_PERFORMANCE ${JSON.stringify(hiddenMetrics || {})}`);
      if (metrics && hiddenMetrics && (hiddenMetrics.frames > metrics.frames + 1 || hiddenMetrics.miniBurrowUpdates > metrics.miniBurrowUpdates + 1 || hiddenMetrics.integrationRefreshes > metrics.integrationRefreshes)) {
        throw new Error('Hidden-window work did not pause.');
      }
      console.log('WEBBURROW_DESKTOP_SMOKE_OK');
      writeSmokeResult('complete',{metrics,hiddenMetrics});
      app.exit(0);
    } catch (error) {
      console.error('WEBBURROW_DESKTOP_SMOKE_FAILED', error);
      writeSmokeResult('failed',{message:String(error?.message||error)});
      app.exit(1);
    }
  });

  const developmentUrl = process.env.WEBBURROW_DEV_URL;
  if (developmentUrl) {
    void window.loadURL(developmentUrl);
  } else {
    void window.loadFile(rendererPath);
  }

  return window;
}

ipcMain.handle('webburrow:integration-request', (_event, request) => hardenedIntegrationRequest(request));
ipcMain.handle('webburrow:site-icon', async (_event, request) => {try{const response=await hardenedIntegrationRequest({kind:'favicon',pageUrl:request?.pageUrl,iconUrl:request?.iconUrl});const source=nativeImage.createFromBuffer(Buffer.from(response.body,'base64'));if(source.isEmpty())throw new Error('The response is not a supported image.');const size=source.getSize(),scale=Math.min(1,64/Math.max(size.width,size.height)),resized=source.resize({width:Math.max(1,Math.round(size.width*scale)),height:Math.max(1,Math.round(size.height*scale)),quality:'best'}),png=resized.toPNG();if(png.byteLength>64*1024)throw new Error('The re-encoded icon is too large.');return{ok:true,dataUrl:`data:image/png;base64,${png.toString('base64')}`};}catch(error){return{ok:false,error:String(error?.message||'The icon could not be fetched.').slice(0,240)};}});
ipcMain.handle('webburrow:open-external', async (_event, url) => { if (!isSafeExternalUrl(url)) return false;if(await nativeBridge?.focus(url))return true; await shell.openExternal(url, { activate:true }); return true; });
ipcMain.on('webburrow:tray-preferences', (_event, value) => { trayPreferences = { enabled:value?.enabled === true, minimizeToTray:value?.minimizeToTray === true }; rebuildTray(); });
ipcMain.on('webburrow:tray-snapshot', (_event, value) => { traySnapshot = { favorites:sanitizedMenuItems(value?.favorites), recent:sanitizedMenuItems(value?.recent) }; rebuildTray(); });
ipcMain.on('webburrow:browser-context', (_event, value) => { browserContext = {
  workspaces:Array.isArray(value?.workspaces)?value.workspaces.slice(0,30).flatMap(item=>item&&typeof item.id==='string'&&typeof item.name==='string'&&Number.isInteger(item.tabCount)&&['selection','window','group'].includes(item.sourceScope)?[{id:item.id.slice(0,100),name:item.name.slice(0,60),tabCount:Math.max(0,Math.min(100,item.tabCount)),sourceScope:item.sourceScope}]:[]):[],
  rooms:Array.isArray(value?.rooms)?value.rooms.slice(0,100).flatMap(item=>item&&typeof item.id==='string'&&typeof item.name==='string'?[{id:item.id.slice(0,100),name:item.name.slice(0,80)}]:[]):[],
  collections:Array.isArray(value?.collections)?value.collections.slice(0,100).flatMap(item=>item&&typeof item.id==='string'&&typeof item.name==='string'?[{id:item.id.slice(0,100),name:item.name.slice(0,80)}]:[]):[],
}; });

if (nativeHostLaunch) {
  app.whenReady().then(() => runNativeHostClient(app));
} else if (!app.requestSingleInstanceLock() && !isSmokeTest) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    showWindow(deepLinkFromArguments(argv) || { type:'show' });
  });

  app.whenReady().then(() => {
    writeSmokeResult('app-ready');
    Menu.setApplicationMenu(null);
    if (process.defaultApp && process.argv[1]) app.setAsDefaultProtocolClient('webburrow', process.execPath, [path.resolve(process.argv[1])]);
    else app.setAsDefaultProtocolClient('webburrow');
    mainWindow = createWindow();
    pendingCommand = deepLinkFromArguments(process.argv);
    nativeBridge = startNativeMessageServer(app, message => {
      if(message.type==='capabilities')return nativeCapabilities(browserContext);
      if(message.type==='send-page')showWindow({type:'browser-page',payload:{...message.page,roomId:message.roomId,collection:message.collection,archetype:message.archetype,color:message.color,favorite:message.favorite}});
      else if(message.type==='send-tabs')showWindow({type:'browser-tabs',payload:{name:message.name,tabs:message.tabs,options:{workspaceId:message.workspaceId,mode:message.mode,scope:message.scope}}});
      else if(message.type==='bookmark-preview')showWindow({type:'bookmark-preview',payload:message.html});
      return {accepted:true};
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow(); else showWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && !trayPreferences.enabled) app.quit();
  });
}
