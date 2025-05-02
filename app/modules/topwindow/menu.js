class MenuHandler {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
  }

  registerHandlers(ipcMain) {
    // These handlers are already defined in the main index.js file
    // This is just a structural placeholder for organizing window-related functionality
    console.log('Menu handlers registered');
  }
}

module.exports = MenuHandler; 