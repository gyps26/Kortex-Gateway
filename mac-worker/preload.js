const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    connectHub: (token) => ipcRenderer.invoke('connect-hub', token),
    disconnectHub: () => ipcRenderer.invoke('disconnect-hub'),
    onLogMsg: (callback) => ipcRenderer.on('log-msg', (_event, msg) => callback(msg)),
    onStatusChange: (callback) => ipcRenderer.on('status-change', (_event, status) => callback(status)),
    getStoredToken: () => ipcRenderer.invoke('get-stored-token')
});
