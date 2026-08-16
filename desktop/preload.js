const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('gazefocus', {
  login: (email, password) => ipcRenderer.invoke('agent:login', { email, password }),
})
