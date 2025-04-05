// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  onDeviceDiscovered: (callback) => {
    ipcRenderer.on('device-discovered', (event, ...args) => {
      callback(...args);
    });
  },
});
