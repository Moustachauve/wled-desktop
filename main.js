const { app, BrowserWindow, ipcMain } = require('electron');
const url = require('url');
const path = require('path');

// Error Handling
process.on('uncaughtException', error => {
  console.error('Unexpected error: ', error);
});
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true,
    },
  });
  //win.loadURL('http://localhost:4200');
  console.log(path.join(__dirname, `/dist/wled-desktop/browser/index.html`));
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, `/dist/wled-desktop/browser/index.html`),
      protocol: 'file:',
      slashes: true,
    })
  );
}
// App Lifecycle
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('message', (event, message) => {
  console.log('Message from Renderer:', message);
});
