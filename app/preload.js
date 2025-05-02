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
  }
}); 