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
const rendererPath = path.join(appDirectory, 'dist', 'index.html');

function isSafeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
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
      await new Promise((resolve) => setTimeout(resolve, 1800));
      if (screenshotPath) {
        const image = await window.webContents.capturePage();
        fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
        fs.writeFileSync(screenshotPath, image.toPNG());
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
