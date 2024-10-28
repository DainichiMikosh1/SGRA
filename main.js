// main.js

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require(path.join(__dirname, 'database.js'));

let loginWindow;
let mainWindow;

ipcMain.on('login-success', (event, userId) => {
  loggedUserId = userId; // Guardar el ID del usuario
  if (loginWindow) {
    loginWindow.close();
  }
  createMainWindow();
});

ipcMain.on('open-refunds-window', () => {
  createRefundsWindow();
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
    webPreferences: {
      preload: path.join(__dirname, 'app', 'windows', 'mainWindow.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.maximize();

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
  inventoryWindow.maximize();

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
  addProductWindow.maximize();

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
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, 'app', 'windows', 'salesWindow.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  salesWindow.maximize();
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
  orderHistoryWindow.maximize();

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
  lowStockWindow.maximize();

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
  sellProductWindow.maximize();

  sellProductWindow.loadFile(path.join(__dirname, 'app', 'sellProduct.html'));

  sellProductWindow.webContents.once('did-finish-load', () => {
    sellProductWindow.webContents.send('set-logged-user-id', loggedUserId);
  });
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
  registerOrderWindow.maximize();

  registerOrderWindow.loadFile(path.join(__dirname, 'app', 'registerOrder.html'));
}

function createRefundsWindow() {
  let refundsWindow = new BrowserWindow({
    width: 400,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  refundsWindow.maximize();

  refundsWindow.loadFile('app/reembolsos.html');

  // Manejar el evento de cierre si es necesario
  refundsWindow.on('closed', () => {
    refundsWindow = null;
  });
}

ipcMain.on('process-refund', (event, refundData) => {
  const { saleId, productId, quantity, reason } = refundData;

  db.serialize(() => {
    // Insertar el reembolso en la tabla reembolsos
    db.run(
      `INSERT INTO reembolsos (sale_id, product_id, quantity, refund_date, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [saleId, productId, quantity, new Date().toISOString(), reason],
      function (err) {
        if (err) {
          console.error('Error al procesar el reembolso:', err);
          event.sender.send('refund-processed', { success: false, message: 'Error al procesar el reembolso.' });
          return;
        }

        // Actualizar el inventario sumando la cantidad reembolsada
        db.run(
          `UPDATE inventory SET stock = stock + ? WHERE id = ?`,
          [quantity, productId],
          function (err) {
            if (err) {
              console.error('Error al actualizar el inventario:', err);
              event.sender.send('refund-processed', { success: false, message: 'Error al actualizar el inventario.' });
              return;
            }

            // Actualizar la cantidad vendida en sales restando la cantidad reembolsada
            db.run(
              `UPDATE sales SET quantity = quantity - ? WHERE id = ?`,
              [quantity, saleId],
              function (err) {
                if (err) {
                  console.error('Error al actualizar la venta:', err);
                  event.sender.send('refund-processed', { success: false, message: 'Error al actualizar la venta.' });
                  return;
                }

                // Verificar si la cantidad vendida es cero y eliminar el registro si es necesario
                db.get(
                  `SELECT quantity FROM sales WHERE id = ?`,
                  [saleId],
                  function (err, row) {
                    if (err) {
                      console.error('Error al verificar la cantidad vendida:', err);
                      event.sender.send('refund-processed', { success: false, message: 'Error al verificar la cantidad vendida.' });
                      return;
                    }

                    if (row && row.quantity <= 0) {
                      db.run(
                        `DELETE FROM sales WHERE id = ?`,
                        [saleId],
                        function (err) {
                          if (err) {
                            console.error('Error al eliminar la venta:', err);
                            event.sender.send('refund-processed', { success: false, message: 'Error al eliminar la venta.' });
                            return;
                          }
                          console.log('Venta eliminada porque la cantidad vendida es cero.');
                        }
                      );
                    }
                    console.log('Reembolso procesado exitosamente.');
                    event.sender.send('refund-processed', { success: true, message: 'Reembolso procesado exitosamente.' });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});