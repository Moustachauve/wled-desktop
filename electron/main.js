import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import url, { fileURLToPath } from 'url';
//import mDnsSd from 'node-dns-sd';
import { Bonjour } from 'bonjour-service';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error Handling
process.on('uncaughtException', error => {
  console.error('Unexpected error: ', error);
});
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      /*contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true,*/
    },
  });
  win.webContents.openDevTools();
  win.loadFile(
    url.format({
      pathname: `../dist/wled-desktop/browser/index.html`,
      protocol: 'file:',
      slashes: true,
    })
  );
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
      console.log('Found network: ', network.address);
      findDevicesForNetwork(network.address);
    }
  }
}

function findDevicesForNetwork(networkInterface) {
  const instance = new Bonjour({ interface: networkInterface });
  var i = 0;
  instance.find({ type: 'wled' }, function (service) {
    i++;
    console.log('Found an HTTP server:', service);
    console.log('compteur: ', i, networkInterface);
  });
}
