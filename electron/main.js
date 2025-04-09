import { Bonjour } from 'bonjour-service';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import os from 'os';
import path from 'path';
import url, { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// Error Handling
process.on('uncaughtException', error => {
  console.error('Unexpected error: ', error);
});
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 700,
    minHeight: 500,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#10141400',
      symbolColor: '#e0e3e2',
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
  });
  win.removeMenu();
  win.webContents.openDevTools();
  win.loadFile(
    url.format({
      pathname: `../dist/wled-desktop/browser/index.html`,
      protocol: 'file:',
      slashes: true,
    })
  );

  // This is to make sure links with target "_blank" open in the external
  // browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App Lifecycle
app.whenReady().then(createWindow).then(findDevices);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('message', (event, message) => {
  console.log('Message from Renderer:', message);
});

// ================

function findDevices() {
  console.log('discovering!');
  var networkInterfaces = os.networkInterfaces();
  console.log(networkInterfaces);
  for (const name of Object.keys(networkInterfaces)) {
    for (const network of networkInterfaces[name]) {
      if (network.family !== 'IPv4' || network.internal !== false) {
        continue;
      }
      console.log('Searching on network: ', network.address);
      findDevicesForNetwork(network.address);
    }
  }
}

function findDevicesForNetwork(networkInterface) {
  const instance = new Bonjour({ interface: networkInterface });
  instance.find({ type: 'wled' }, function (service) {
    console.log(
      'Discovered a potential device:',
      service.addresses,
      service.name,
      service.txt
    );
    // TODO: as an improvement, also send the mac address to the renderer so
    // it can check if the device already exists without having to ping it.
    win.webContents.send('device-discovered', service.addresses[0]);
  });
}
