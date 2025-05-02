const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    onMaximizeChange: (callback) => {
      ipcRenderer.on('maximize-change', (_, isMaximized) => callback(isMaximized));
      return () => {
        ipcRenderer.removeAllListeners('maximize-change');
      };
    }
  },
  apiKeys: {
    saveApiKey: (params) => ipcRenderer.invoke('save-api-key', params),
    getApiKey: (provider) => ipcRenderer.invoke('get-api-key', provider),
    generateImage: (params) => ipcRenderer.invoke('generate-image', params),
    saveImage: (params) => ipcRenderer.invoke('save-image', params)
  },
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    restartAndInstall: () => ipcRenderer.invoke('restart-and-install'),
    onUpdateAvailable: (callback) => {
      ipcRenderer.on('update-available', (_, info) => callback(info));
      return () => {
        ipcRenderer.removeAllListeners('update-available');
      };
    },
    onUpdateProgress: (callback) => {
      ipcRenderer.on('update-progress', (_, progress) => callback(progress));
      return () => {
        ipcRenderer.removeAllListeners('update-progress');
      };
    },
    onUpdateDownloaded: (callback) => {
      ipcRenderer.on('update-downloaded', (_, info) => callback(info));
      return () => {
        ipcRenderer.removeAllListeners('update-downloaded');
      };
    },
    onUpdateError: (callback) => {
      ipcRenderer.on('update-error', (_, error) => callback(error));
      return () => {
        ipcRenderer.removeAllListeners('update-error');
      };
    }
  }
}); 