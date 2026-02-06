// Preload script: keep minimal and secure. Expose safe APIs here if needed later.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // placeholder for future IPC
  ping: () => ipcRenderer.invoke('ping')
});
