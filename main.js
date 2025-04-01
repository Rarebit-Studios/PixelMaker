const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'icon-512.png')
    });

    // Load the index.html file
    win.loadFile('index.html');

    // Remove menu bar
    win.setMenuBarVisibility(false);
}

const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Open Shared Artwork',
                accelerator: 'CmdOrCtrl+O',
                click: () => {
                    // Handle opening shared artwork
                }
            },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
}); 