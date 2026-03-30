import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
});
