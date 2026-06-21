const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { startWorker, stopWorker } = require('./worker');

let mainWindow;

// Simple store for token since electron-store requires an extra dependency
const storePath = path.join(app.getPath('userData'), 'config.json');
function getStore() {
    try { return JSON.parse(fs.readFileSync(storePath, 'utf-8')); } catch { return {}; }
}
function setStore(data) {
    fs.writeFileSync(storePath, JSON.stringify(data));
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 380,
        height: 600,
        titleBarStyle: 'hiddenInset', // Makes it look native on Mac
        backgroundColor: '#020617', // slate-950
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        resizable: false
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('get-stored-token', () => {
    return getStore().token || '';
});

ipcMain.handle('connect-hub', async (event, token) => {
    try {
        // Token format: API_URL|API_SECRET
        const [apiUrl, apiSecret] = token.split('|');
        if (!apiUrl || !apiSecret) {
            return { success: false, error: 'Invalid token format. Must be URL|SECRET' };
        }

        // Save token
        const store = getStore();
        store.token = token;
        setStore(store);

        // Define a logger that sends messages to the renderer
        const logToUI = (msg, type = 'info') => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('log-msg', { msg, type });
            }
        };

        // Handle permission errors globally
        global.onPermissionError = () => {
            const { dialog } = require('electron');
            const { exec } = require('child_process');
            dialog.showMessageBox({
                type: 'error',
                title: 'Full Disk Access Required',
                message: 'This application requires Full Disk Access to read iMessages.',
                detail: 'System Settings will now open. Please grant Full Disk Access to your Terminal or this App, and then restart the worker.'
            });
            exec('open "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles"');
        };

        logToUI('Starting worker daemon...', 'info');
        
        // Start the background worker logic
        const started = await startWorker(apiUrl, apiSecret, logToUI);
        
        if (started) {
            return { success: true };
        } else {
            return { success: false, error: 'Failed to start worker' };
        }
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('disconnect-hub', async () => {
    stopWorker();
    return { success: true };
});
