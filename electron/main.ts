import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let backendProcess: ChildProcess | null = null;

const isDev = !app.isPackaged;
const BACKEND_PORT = 8899;

function startBackend() {
  const backendPath = isDev
    ? path.join(__dirname, '../../backend/server.py')
    : path.join(process.resourcesPath, 'backend/server.py');

  backendProcess = spawn('python3', [backendPath], {
    env: { ...process.env, PORT: String(BACKEND_PORT) },
  });

  backendProcess.stdout?.on('data', (data) => {
    console.log(`[Backend] ${data}`);
  });

  backendProcess.stderr?.on('data', (data) => {
    console.error(`[Backend Error] ${data}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../public/icon.png'),
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow?.hide();
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('StudyHub - Tu asistente de estudio');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir StudyHub', click: () => mainWindow?.show() },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        backendProcess?.kill();
        app.exit(0);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow?.show());
}

// IPC Handlers
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Documentos', extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'] },
      { name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg'] },
      { name: 'Todos', extensions: ['*'] },
    ],
  });
  return result.filePaths;
});

ipcMain.handle('read-file', async (_event, filePath: string) => {
  return fs.readFileSync(filePath);
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

app.whenReady().then(() => {
  startBackend();
  createWindow();
  createTray();
});

app.on('activate', () => {
  mainWindow?.show();
});

app.on('before-quit', () => {
  backendProcess?.kill();
});
