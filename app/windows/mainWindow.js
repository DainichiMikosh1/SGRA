const { ipcRenderer } = require('electron');

const openInventoryBtn = document.getElementById('openInventoryBtn');
const openSalesBtn = document.getElementById('openSalesBtn');
const openOrderHistoryBtn = document.getElementById('openOrderHistoryBtn');
const openLowStockBtn = document.getElementById('openLowStockBtn');
const openSellProductBtn = document.getElementById('openSellProductBtn');
const openRegisterOrderBtn = document.getElementById('openRegisterOrderBtn');
const abrirReembolsosBtn = document.getElementById('abrirReembolsosBtn');

abrirReembolsosBtn.addEventListener('click', () => {
  ipcRenderer.send('open-refunds-window');
});

openInventoryBtn.addEventListener('click', () => {
  ipcRenderer.send('open-inventory-window');
});

openSalesBtn.addEventListener('click', () => {
  ipcRenderer.send('open-sales-window');
});

openOrderHistoryBtn.addEventListener('click', () => {
  ipcRenderer.send('open-order-history-window');
});

openLowStockBtn.addEventListener('click', () => {
  ipcRenderer.send('open-low-stock-window');
});

openSellProductBtn.addEventListener('click', () => {
  ipcRenderer.send('open-sell-product-window');
});

openRegisterOrderBtn.addEventListener('click', () => {
  ipcRenderer.send('open-register-order-window');
});