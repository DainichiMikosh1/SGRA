// cajaWindow.js
const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const totalAmountSpan = document.getElementById('totalAmount');
  const cashInput = document.getElementById('cashInput');
  const changeAmountSpan = document.getElementById('changeAmount');
  const finalizeBtn = document.getElementById('finalizeBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  let cart = [];
  let total = 0;
  let userId = null;

  ipcRenderer.on('payment-data', (event, data) => {
    cart = data.cart || [];
    total = data.total || 0;
    userId = data.userId || null; 
    totalAmountSpan.textContent = `$${total.toFixed(2)}`;
  });

  cashInput.addEventListener('input', () => {
    const received = parseFloat(cashInput.value) || 0;
    const change = received - total;
    changeAmountSpan.textContent = change >= 0 ? change.toFixed(2) : '0.00';
  });

  finalizeBtn.addEventListener('click', () => {
    const received = parseFloat(cashInput.value) || 0;
    if (received < total) {
      alert('El efectivo recibido es menor al total a pagar.');
      return;
    }
    ipcRenderer.send('finalize-sale', { cart, total, received, userId });
  });

  cancelBtn.addEventListener('click', () => {
    window.close();
  });
});
