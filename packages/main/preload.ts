import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  runYtDlp: (url: string, folder: string, fileType: string) => ipcRenderer.invoke('run-yt-dlp', url, folder, fileType),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  onLog: (callback: (line: string) => void) =>
    ipcRenderer.on('yt-dlp-log', (_, line) => callback(line)),
  onComplete: (callback: (code: number) => void) =>
    ipcRenderer.on('yt-dlp-complete', (_, code) => callback(code)),
});
