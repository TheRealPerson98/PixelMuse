const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const CustomStore = require('./modules/store');
const { autoUpdater } = require('electron-updater');

// Initialize custom store for persistent data storage
const store = new CustomStore({
  defaults: {
    // No defaults needed, we'll add keys dynamically
  }
});

// Helper to standardize API key storage keys
const getApiKeyStorageKey = (provider) => {
  // Always use lowercase for storage keys to ensure consistency
  return `${provider.toLowerCase()}-api-key`;
};

// Global window reference to prevent garbage collection
let mainWindow;

// Configure auto updater
function setupAutoUpdater() {
  // Don't check for updates in development
  if (isDev) {
    console.log('Skipping auto-update checks in development mode');
    return;
  }

  // Log update events
  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';
  
  // Configure auto updater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Listen for update events
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
  });
  
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    mainWindow.webContents.send('update-available', info);
  });
  
  autoUpdater.on('update-not-available', (info) => {
    console.log('No updates available.', info);
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    console.log(logMessage);
    mainWindow.webContents.send('update-progress', progressObj);
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded');
    mainWindow.webContents.send('update-downloaded', info);
    
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'A new version has been downloaded. Restart the application to apply the updates.',
      buttons: ['Restart', 'Later']
    }).then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
  
  autoUpdater.on('error', (err) => {
    console.error('Error in auto-updater:', err);
    mainWindow.webContents.send('update-error', err.message);
  });
  
  // Check for updates
  autoUpdater.checkForUpdates();
  
  // Check again every hour
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 60 * 60 * 1000);
}

// Create main window
function createMainWindow() {
  
  // Determine icon path based on platform
  let iconPath;
  if (process.platform === 'win32') {
    iconPath = path.join(__dirname, '../assets/icons/win/icon.ico');
  } else if (process.platform === 'darwin') {
    iconPath = path.join(__dirname, '../assets/icons/mac/icon.icns');
  } else {
    iconPath = path.join(__dirname, '../assets/icons/png/512x512.png');
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1e1e1e',
    frame: false, // Remove the default frame
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    icon: iconPath,
    show: false, // Don't show until ready-to-show
  });

  // Watch for maximize/unmaximize events
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('maximize-change', true);
  });
  
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('maximize-change', false);
  });

  // Show window when ready to prevent flashing
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Setup auto-updater once the window is ready
    setupAutoUpdater();
  });

  // Remove the default menu bar
  Menu.setApplicationMenu(null);

  // Load Next.js app - in development use dev server, in production use built app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../renderer/out/index.html')}`;
  
  mainWindow.loadURL(startUrl);
  
  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers for updates
ipcMain.handle('check-for-updates', async () => {
  if (isDev) {
    return { success: false, message: 'Updates are disabled in development mode' };
  }
  
  try {
    await autoUpdater.checkForUpdates();
    return { success: true };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restart-and-install', () => {
  autoUpdater.quitAndInstall();
});

// Initialize app
app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Window control handlers
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
    return true;
  }
  return false;
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  }
  return false;
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
    return true;
  }
  return false;
});

ipcMain.handle('window-is-maximized', () => {
  if (mainWindow) {
    return mainWindow.isMaximized();
  }
  return false;
});

// API Key handlers
ipcMain.handle('save-api-key', (event, { provider, key }) => {
  try {
    const storageKey = getApiKeyStorageKey(provider);
    store.set(storageKey, key);
    return { success: true };
  } catch (error) {
    console.error('Error saving API key:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-api-key', (event, provider) => {
  try {
    const storageKey = getApiKeyStorageKey(provider);
    const key = store.get(storageKey, '');
    return key;
  } catch (error) {
    console.error('Error getting API key:', error);
    return '';
  }
});

// Image generation handler
ipcMain.handle('generate-image', async (event, { prompt, apiKey, imageSize = '1024x1024' }) => {
  try {
    // This is just the IPC handler - the actual OpenAI API call will be done in the renderer 
    // to avoid exposing API keys to the main process
    return { success: true, prompt, imageSize };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Image save handler
ipcMain.handle('save-image', async (event, { imageData, defaultName }) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Generated Image',
      defaultPath: defaultName || 'generated-image.png',
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'Save canceled' };
    }

    // Remove the data URL prefix
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Save the image file
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    
    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}); 