const path = require('path');
const db = require(path.join(__dirname, '.', '..', 'database.js'));

window.addEventListener('DOMContentLoaded', () => {
  const salesTableBody = document.querySelector('#salesTable tbody');

  function loadSales() {
    salesTableBody.innerHTML = '';

    db.all(
      `SELECT inventory.description, sales.quantity, sales.sale_date, sales.subtotal
       FROM sales
       JOIN inventory ON sales.product_id = inventory.id`,
      [],
      (err, rows) => {
        if (err) {
          console.error('Error al cargar las ventas:', err);
        } else {
          rows.forEach((row) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${row.description}</td>
              <td>${row.quantity}</td>
              <td>${new Date(row.sale_date).toLocaleString()}</td>
              <td>${row.subtotal}</td>
            `;
            salesTableBody.appendChild(tr);
          });
        }
      }
    );
  }

  loadSales();
});
