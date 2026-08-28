import { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hardenedIntegrationRequest, isSafeExternalUrl, parseDeepLink } from './security.mjs';
import { runNativeHostClient, startNativeMessageServer } from './native-messaging.mjs';

const appDirectory = path.dirname(fileURLToPath(import.meta.url));
const isSmokeTest = process.argv.includes('--smoke-test');
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
let mainWindow;
let nativeTray;
let trayPreferences = { enabled:false, minimizeToTray:false };
let traySnapshot = { favorites:[], recent:[] };
let quitting = false;
let pendingCommand = null;

if (process.platform === 'win32') {
  app.setAppUserModelId('com.webburrow.desktop');
}

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
    if (pendingCommand) { sendCommand(pendingCommand); pendingCommand = null; }
    if (!isSmokeTest) return;

    try {
      window.showInactive();
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const rendererState = await window.webContents.executeJavaScript(
        `(async () => JSON.stringify({ text: document.body.innerText.slice(0, 500), databases: indexedDB.databases ? await indexedDB.databases() : [] }))()`,
      );
      console.log(`WEBBURROW_DESKTOP_STATE ${rendererState}`);
      if (JSON.parse(rendererState).text.includes('OPENING YOUR BURROW')) {
        throw new Error('Renderer did not finish local persistence initialization.');
      }
      await window.webContents.executeJavaScript(
        `Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.includes('without mouse look'))?.click()`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1400));
      if (qaView === 'studio' || qaView === 'lounge') {
        const digit = qaView === 'studio' ? '2' : '3';
        await window.webContents.executeJavaScript(
          `window.dispatchEvent(new KeyboardEvent('keydown', { altKey:true, code:'Digit${digit}', key:'${digit}', bubbles:true }))`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1400));
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
      if (qaView === 'edit') {
        await window.webContents.executeJavaScript(
          `Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Edit')?.click()`,
        );
        await new Promise((resolve) => setTimeout(resolve, 900));
      }
      if (screenshotPath) {
        const image = await window.webContents.capturePage();
        fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
        fs.writeFileSync(screenshotPath, image.toPNG());
      }
      if (rendererErrors.length) {
        throw new Error(`Renderer logged ${rendererErrors.length} error(s): ${rendererErrors[0]}`);
      }
      console.log('WEBBURROW_DESKTOP_SMOKE_OK');
      app.exit(0);
    } catch (error) {
      console.error('WEBBURROW_DESKTOP_SMOKE_FAILED', error);
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
ipcMain.handle('webburrow:open-external', async (_event, url) => { if (!isSafeExternalUrl(url)) return false; await shell.openExternal(url, { activate:true }); return true; });
ipcMain.on('webburrow:tray-preferences', (_event, value) => { trayPreferences = { enabled:value?.enabled === true, minimizeToTray:value?.minimizeToTray === true }; rebuildTray(); });
ipcMain.on('webburrow:tray-snapshot', (_event, value) => { traySnapshot = { favorites:sanitizedMenuItems(value?.favorites), recent:sanitizedMenuItems(value?.recent) }; rebuildTray(); });

if (nativeHostLaunch) {
  app.whenReady().then(() => runNativeHostClient(app));
} else if (!app.requestSingleInstanceLock() && !isSmokeTest) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    showWindow(deepLinkFromArguments(argv) || { type:'show' });
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    if (process.defaultApp && process.argv[1]) app.setAsDefaultProtocolClient('webburrow', process.execPath, [path.resolve(process.argv[1])]);
    else app.setAsDefaultProtocolClient('webburrow');
    mainWindow = createWindow();
    pendingCommand = deepLinkFromArguments(process.argv);
    startNativeMessageServer(app, message => {
      showWindow(message.type === 'capabilities' ? { type:'show' } : message.type === 'send-page' ? { type:'browser-page', payload:message.page } : message.type === 'send-tabs' ? { type:'browser-tabs', payload:{ name:message.name, tabs:message.tabs } } : message.type === 'bookmark-preview' ? { type:'bookmark-preview', payload:message.html } : { type:'show' });
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow(); else showWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && !trayPreferences.enabled) app.quit();
  });
}
