import { app, BrowserWindow, Menu, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

if (process.platform === 'win32') {
  app.setAppUserModelId('com.webburrow.desktop');
}

function isSafeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

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
    },
  });

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

if (!app.requestSingleInstanceLock() && !isSmokeTest) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const window = BrowserWindow.getAllWindows()[0];
    if (!window) return;
    if (window.isMinimized()) window.restore();
    window.focus();
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
