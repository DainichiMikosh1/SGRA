// main.js

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let loginWindow;
let mainWindow;

ipcMain.on('login-success', () => {
  if (loginWindow) {
    loginWindow.close();
  }
  createMainWindow();
});

// Manejo de eventos IPC
ipcMain.on('open-inventory-window', () => {
  createInventoryWindow();
});

ipcMain.on('open-add-product-window', (event, productId) => {
  createAddProductWindow(productId);
});

ipcMain.on('product-added', () => {
  mainWindow.webContents.send('refresh-inventory');
});

ipcMain.on('open-sales-window', () => {
  createSalesWindow();
});

ipcMain.on('open-order-history-window', () => {
  createOrderHistoryWindow();
});

ipcMain.on('open-low-stock-window', () => {
  createLowStockWindow();
});

ipcMain.on('open-sell-product-window', () => {
  createSellProductWindow();
});

ipcMain.on('open-register-order-window', () => {
  createRegisterOrderWindow();
});

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 400,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, 'app', 'windows', 'loginWindow.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  loginWindow.loadFile(path.join(__dirname, 'app','login.html'));

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'app', 'windows', 'mainWindow.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Funciones para crear ventanas adicionales
function createInventoryWindow() {
  console.log('Creating Inventory Window');
  const inventoryWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, 'app', 'windows', 'inventoryWindow.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  inventoryWindow.loadFile(path.join(__dirname, 'app', 'inventory.html'));
}

function createAddProductWindow(productId) {
  const addProductWindow = new BrowserWindow({
    width: 400,
    height: 600,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      preload: path.join(__dirname, 'app', 'windows', 'productFormWindow.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  addProductWindow.loadFile(path.join(__dirname, 'app', 'productForm.html'));

  // Enviar el ID del producto si es edición
  if (productId) {
    addProductWindow.webContents.on('did-finish-load', () => {
      addProductWindow.webContents.send('edit-product', productId);
    });
  }
}

function createSalesWindow() {
  const salesWindow = new BrowserWindow({
    width: 800,
    height: 600,
    parent: mainWindow, // Opcional: establece la ventana principal como padre
    webPreferences: {
      preload: path.join(__dirname, 'app', 'windows', 'salesWindow.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
}); 

  salesWindow.loadFile(path.join(__dirname, 'app', 'sales.html'));
}

function createOrderHistoryWindow() {
  const orderHistoryWindow = new BrowserWindow({
    width: 800,
    height: 600,
    parent: mainWindow, // Opcional
    webPreferences: {
      preload: path.join(__dirname, 'app', 'windows', 'orderHistoryWindow.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  orderHistoryWindow.loadFile(path.join(__dirname, 'app', 'orderHistory.html'));
}

function createLowStockWindow() {
  const lowStockWindow = new BrowserWindow({
    width: 600,
    height: 400,
    parent: mainWindow, // Opcional
    webPreferences: {
      preload: path.join(__dirname, 'app', 'windows', 'lowStockNotificationsWindow.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  lowStockWindow.loadFile(path.join(__dirname, 'app', 'lowStockNotifications.html'));
}

function createSellProductWindow() {
  const sellProductWindow = new BrowserWindow({
    width: 800,
    height: 700,
    parent: mainWindow, // Opcional
    webPreferences: {
      preload: path.join(__dirname, 'app', 'windows', 'sellProductWindow.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  sellProductWindow.loadFile(path.join(__dirname, 'app', 'sellProduct.html'));
}

// Evento que se dispara cuando Electron ha finalizado la inicialización.
app.whenReady().then(createLoginWindow);

// Salir de la aplicación cuando todas las ventanas estén cerradas.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function createRegisterOrderWindow() {
  const registerOrderWindow = new BrowserWindow({
    width: 800,
    height: 600,
    parent: mainWindow, // Opcional
    webPreferences: {
      preload: path.join(__dirname, 'app', 'windows', 'registerOrderWindow.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  registerOrderWindow.loadFile(path.join(__dirname, 'app', 'registerOrder.html'));
}