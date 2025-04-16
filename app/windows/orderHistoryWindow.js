const path = require('path');
const db = require(path.join(__dirname, '.', '..', 'database.js'));

window.addEventListener('DOMContentLoaded', () => {
  const orderHistoryTableBody = document.querySelector('#orderHistoryTable tbody');

  function loadOrderHistory() {
    orderHistoryTableBody.innerHTML = '';

    db.all(
      `SELECT orders.quantity, orders.order_date, orders.status, inventory.description
       FROM orders
       JOIN inventory ON orders.product_id = inventory.id
       ORDER BY orders.order_date DESC`,
      [],
      (err, rows) => {
        if (err) {
          console.error('Error al cargar el historial de pedidos:', err);
        } else {
          rows.forEach((row) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${row.description}</td>
              <td>${row.quantity}</td>
              <td>${new Date(row.order_date).toLocaleString()}</td>
              <td>${row.status}</td>
            `;
            orderHistoryTableBody.appendChild(tr);
          });
        }
      }
    );
  }

  loadOrderHistory();
});