const { execFile, spawn } = require('child_process');
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');


const isDev = !app.isPackaged;

// app setup
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,    // THIS IS REQUIRED!
      nodeIntegration: false,    // recommended for security
    }
  });

  if (app.isPackaged) {
    // Production: load the built index.html
    win.loadFile(path.join(__dirname, '../../renderer/dist/index.html'));
  } else {
    // Development: load Vite dev server URL
    win.loadURL('http://localhost:3000');
    // Optional: Open DevTools automatically in dev
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();
  updateYtDlp();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ipc handlers
const ytdlpPath = app.isPackaged
  ? path.join(process.resourcesPath, 'app.asar.unpacked', 'packages', 'main', 'dist', 'bin', 'yt-dlp.exe')
  : path.join(__dirname, 'bin', 'yt-dlp.exe');

const ffmpegPath = app.isPackaged
  ? path.join(process.resourcesPath, 'app.asar.unpacked', 'packages', 'main', 'dist', 'bin', 'yt-dlp.exe')
  : path.join(__dirname, 'bin', 'ffmpeg.exe');

ipcMain.handle('run-yt-dlp', (event: any, url: string, outputFolder: string, fileType: string) => {
  if (!outputFolder) {
    throw new Error('No output folder specified');
  }

  const outputTemplate = path.join(outputFolder, '%(title)s.%(ext)s');

  // Start with base args
  let args: string[] = ['-o', outputTemplate];

  // Add args based on fileType
  if (fileType === '') {
    // default: no extra options
  } else if (fileType === 'mp4') {
    args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4');
  } else if (fileType === 'mp3') {
    args.push('--extract-audio', '--audio-format', 'mp3');
  } else {
    throw new Error('Invalid file type specified');
  }

  // Always add the URL at the end
  args.push(url);

  // Spawn the process
  const child = spawn(ytdlpPath, args);

  child.stdout.on('data', (data: any) => {
    event.sender.send('yt-dlp-log', data.toString());
  });

  child.stderr.on('data', (data: any) => {
    event.sender.send('yt-dlp-log', data.toString()); // send stderr too
  });

  child.on('close', (code: Number) => {
    event.sender.send('yt-dlp-complete', code);
  });

  child.on('error', (err: any) => {
    dialog.showErrorBox('yt-dlp Launch Error', `Path: ${ytdlpPath}\n\n${err.message}`);
  });

  return;
});

ipcMain.handle('dialog:selectFolder', async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return null;

  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: 'Select Where to Save Video',
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});


const updateFilePath = path.join(app.getPath('userData'), 'yt-dlp-update.json');

export function saveUpdateTimeToDisk(date: Date) {
  try {
    fs.writeFileSync(updateFilePath, JSON.stringify({ lastUpdate: date.toISOString() }), 'utf-8');
  } catch (err) {
    console.error('Failed to save update time:', err);
  }
}

export function getLastUpdateFromDisk(): Date | null {
  try {
    const raw = fs.readFileSync(updateFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed.lastUpdate ? new Date(parsed.lastUpdate) : null;
  } catch {
    return null; // File doesn't exist or invalid
  }
}

function updateYtDlp() {
  const now = new Date();
  const lastUpdate = getLastUpdateFromDisk();
  console.log('Last update was on:', lastUpdate ? lastUpdate.toISOString() : 'never');
  const oneDay = 24 * 60 * 60 * 1000;
  const shouldUpdate = !lastUpdate || (now.getTime() - lastUpdate.getTime() > oneDay);

  if (shouldUpdate) {
    execFile(ytdlpPath, ['-U'], (err: any, stdout: any, stderr: any) => {
      if (err) {
        console.error('yt-dlp update failed:', err);
      } else {
        console.log('yt-dlp updated successfully');
        saveUpdateTimeToDisk(now);
      }
    });
  } else {
    console.log('yt-dlp doesnt need updating yet');
  }
}