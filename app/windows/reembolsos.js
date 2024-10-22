// app/windows/refundsWindow.js

const { ipcRenderer } = require('electron');
const db = require('../database');
const path = require('path');

window.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const searchSalesInput = document.getElementById('searchSalesInput');
  const salesTableBody = document.querySelector('#salesTable tbody');
  const saleDetailsSection = document.getElementById('sale-details-section');
  const selectedSaleIdSpan = document.getElementById('selectedSaleId');
  const selectedProductDescription = document.getElementById('selectedProductDescription');
  const selectedQuantitySpan = document.getElementById('selectedQuantity');
  const refundQuantityInput = document.getElementById('refundQuantity');
  const reasonTextarea = document.getElementById('reason');
  const processRefundBtn = document.getElementById('processRefundBtn');
  const backToSalesBtn = document.getElementById('backToSalesBtn');
  const refundsTableBody = document.querySelector('#refundsTable tbody');

  // Variables globales
  let selectedSale = null;

  // Función para cargar el historial de ventas
  function loadSalesHistory(searchTerm = '') {
    salesTableBody.innerHTML = '';
    let query = `
      SELECT sales.id, sales.sale_date, sales.product_id, sales.quantity, inventory.description
      FROM sales
      JOIN inventory ON sales.product_id = inventory.id
    `;
    let params = [];

    if (searchTerm) {
      query += ' WHERE sales.id LIKE ? OR sales.sale_date LIKE ? OR inventory.description LIKE ?';
      params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error al cargar el historial de ventas:', err);
      } else {
        rows.forEach((row) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${row.id}</td>
            <td>${new Date(row.sale_date).toLocaleString()}</td>
            <td>${row.description}</td>
            <td>${row.quantity}</td>
          `;
          tr.addEventListener('click', () => {
            selectedSale = row;
            showSaleDetails(row);
          });
          salesTableBody.appendChild(tr);
        });
      }
    });
  }

  // Función para mostrar los detalles de la venta seleccionada
  function showSaleDetails(sale) {
    selectedSaleIdSpan.textContent = sale.id;
    selectedProductDescription.textContent = sale.description;
    selectedQuantitySpan.textContent = sale.quantity;
    refundQuantityInput.value = '';
    refundQuantityInput.max = sale.quantity;

    document.getElementById('sales-history-section').style.display = 'none';
    saleDetailsSection.style.display = 'block';
  }

  // Función para cargar el historial de reembolsos
  function loadRefundsHistory() {
    refundsTableBody.innerHTML = '';

    const query = `
      SELECT reembolsos.id, reembolsos.sale_id, inventory.description, reembolsos.quantity, reembolsos.refund_date, reembolsos.reason
      FROM reembolsos
      JOIN inventory ON reembolsos.product_id = inventory.id
      ORDER BY reembolsos.refund_date DESC
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error al cargar el historial de reembolsos:', err);
      } else {
        rows.forEach((row) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${row.id}</td>
            <td>${row.sale_id}</td>
            <td>${row.description}</td>
            <td>${row.quantity}</td>
            <td>${new Date(row.refund_date).toLocaleString()}</td>
            <td>${row.reason}</td>
          `;
          refundsTableBody.appendChild(tr);
        });
      }
    });
  }

  // Eventos
  searchSalesInput.addEventListener('input', () => {
    const searchTerm = searchSalesInput.value.trim();
    loadSalesHistory(searchTerm);
  });

  backToSalesBtn.addEventListener('click', () => {
    saleDetailsSection.style.display = 'none';
    document.getElementById('sales-history-section').style.display = 'block';
  });

  // Inicializar
  loadSalesHistory();
  loadRefundsHistory();

  // Procesar reembolso
  processRefundBtn.addEventListener('click', () => {
    const quantityToRefund = parseInt(refundQuantityInput.value);
    const maxQuantity = parseInt(selectedSale.quantity);

    if (!quantityToRefund || quantityToRefund <= 0) {
      alert('Ingrese una cantidad válida a reembolsar.');
      return;
    }

    if (quantityToRefund > maxQuantity) {
      alert('La cantidad a reembolsar no puede ser mayor que la cantidad vendida.');
      return;
    }

    const reason = reasonTextarea.value.trim();

    const refundData = {
      saleId: selectedSale.id,
      productId: selectedSale.product_id,
      quantity: quantityToRefund,
      reason: reason,
    };

    ipcRenderer.send('process-refund', refundData);
  });

  // Escuchar la respuesta del proceso principal
  ipcRenderer.on('refund-processed', (event, result) => {
    if (result.success) {
      alert(result.message);
      // Actualizar el historial de reembolsos y regresar al historial de ventas
      loadRefundsHistory();
      backToSalesBtn.click();
      loadSalesHistory();
    } else {
      alert(result.message);
    }
  });
});
