const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class CustomStore {
  constructor(options = {}) {
    // Get the user data path
    const userDataPath = app ? app.getPath('userData') : '';
    
    // Set up file path
    this.filePath = options.filePath || path.join(userDataPath, 'settings.json');
    
    // Default data
    this.defaults = options.defaults || {};
    
    // Initialize store data
    this.data = this.load();
  }

  // Load data from file
  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileData = fs.readFileSync(this.filePath, 'utf8');
        const parsedData = JSON.parse(fileData);
        return { ...this.defaults, ...parsedData };
      }
    } catch (error) {
      console.error('Error loading store data:', error);
    }
    return { ...this.defaults };
  }

  // Save data to file
  save() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving store data:', error);
      return false;
    }
  }

  // Get a value from the store
  get(key, defaultValue) {
    if (key in this.data) {
      return this.data[key];
    }
    return defaultValue !== undefined ? defaultValue : this.defaults[key];
  }

  // Set a value in the store
  set(key, value) {
    this.data[key] = value;
    return this.save();
  }

  // Delete a key from the store
  delete(key) {
    if (key in this.data) {
      delete this.data[key];
      return this.save();
    }
    return false;
  }

  // Clear all data from the store
  clear() {
    this.data = { ...this.defaults };
    return this.save();
  }

  // Check if key exists in store
  has(key) {
    return key in this.data;
  }

  // Get all data from the store
  getAll() {
    return { ...this.data };
  }
}

module.exports = CustomStore; 