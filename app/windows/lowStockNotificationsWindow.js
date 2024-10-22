const path = require('path');
const db = require(path.join(__dirname, '.', '..', 'database.js'));

window.addEventListener('DOMContentLoaded', () => {
  const lowStockList = document.getElementById('lowStockList');

  function loadLowStockNotifications() {
    lowStockList.innerHTML = '';

    db.all('SELECT * FROM inventory WHERE stock <= ?', [5], (err, rows) => {
      if (err) {
        console.error('Error al cargar las notificaciones de stock bajo:', err);
      } else if (rows.length > 0) {
        rows.forEach((row) => {
          const li = document.createElement('li');
          li.textContent = `El producto "${row.description}" id: ${row.serial_number} tiene un stock bajo de ${row.stock} unidades.`;
          lowStockList.appendChild(li);
        });
      } else {
        const li = document.createElement('li');
        li.textContent = 'No hay productos con stock bajo.';
        li.style.backgroundColor = '#d4edda';
        li.style.color = '#155724';
        li.style.borderColor = '#c3e6cb';
        lowStockList.appendChild(li);
      }
    });
  }

  loadLowStockNotifications();
});
