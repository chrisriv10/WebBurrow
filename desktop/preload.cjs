// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contextBridge, ipcRenderer } = require('electron');

const allowedCommands = new Set([
  'show', 'quick-access', 'add', 'toggle-tray', 'favorites', 'recent',
  'room', 'open-object', 'browser-page', 'browser-tabs', 'bookmark-preview', 'visibility', 'edit', 'customize', 'import',
]);

contextBridge.exposeInMainWorld('webburrowDesktop', Object.freeze({
  requestIntegration: (request) => ipcRenderer.invoke('webburrow:integration-request', request),
  requestSiteIcon: (request) => ipcRenderer.invoke('webburrow:site-icon', request),
  setTrayPreferences: (preferences) => ipcRenderer.send('webburrow:tray-preferences', preferences),
  closeTrayWindow: () => ipcRenderer.send('webburrow:close-tray-window'),
  showMainWindow: (command = 'show') => ipcRenderer.send('webburrow:show-main', command),
  syncTrayMenu: (snapshot) => ipcRenderer.send('webburrow:tray-snapshot', snapshot),
  syncBrowserContext: (context) => ipcRenderer.send('webburrow:browser-context', context),
  openExternal: (url) => ipcRenderer.invoke('webburrow:open-external', url),
  onCommand: (callback) => {
    const listener = (_event, command) => {
      if (command && allowedCommands.has(command.type)) callback(command);
    };
    ipcRenderer.on('webburrow:command', listener);
    return () => ipcRenderer.removeListener('webburrow:command', listener);
  },
}));
