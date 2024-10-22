const path = require('path');
const db = require(path.join(__dirname, '.', '..', 'database.js'));

window.addEventListener('DOMContentLoaded', () => {
  const orderTableBody = document.querySelector('#orderTable tbody');
  const orderListSection = document.getElementById('order-list-section');
  const orderDetailsSection = document.getElementById('order-details-section');
  const orderDetailsDiv = document.getElementById('orderDetails');
  const confirmReceptionBtn = document.getElementById('confirmReceptionBtn');
  const backToOrdersBtn = document.getElementById('backToOrdersBtn');

  let selectedOrderId = null;

  // Función para cargar los pedidos pendientes
  function loadPendingOrders() {
    orderTableBody.innerHTML = '';

    db.all(
      `SELECT orders.id AS order_id, orders.quantity, orders.order_date, orders.status, inventory.description
       FROM orders
       JOIN inventory ON orders.product_id = inventory.id
       WHERE orders.status = 'Pendiente' OR orders.status = 'Enviado'
       ORDER BY orders.order_date ASC`,
      [],
      (err, rows) => {
        if (err) {
          console.error('Error al cargar los pedidos pendientes:', err);
        } else {
          rows.forEach((row) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${row.order_id}</td>
              <td>${row.description}</td>
              <td>${row.quantity}</td>
              <td>${new Date(row.order_date).toLocaleDateString()}</td>
              <td>${row.status}</td>
              <td><button data-order-id="${row.order_id}">Registrar Recepción</button></td>
            `;
            orderTableBody.appendChild(tr);

            // Agregar evento al botón
            const registerBtn = tr.querySelector('button');
            registerBtn.addEventListener('click', () => {
              selectedOrderId = row.order_id;
              showOrderDetails(row);
            });
          });
        }
      }
    );
  }

  // Función para mostrar los detalles del pedido seleccionado
  function showOrderDetails(order) {
    orderListSection.style.display = 'none';
    orderDetailsSection.style.display = 'block';

    orderDetailsDiv.innerHTML = `
      <p><strong>ID Pedido:</strong> ${order.order_id}</p>
      <p><strong>Producto:</strong> ${order.description}</p>
      <p><strong>Cantidad Pedida:</strong> ${order.quantity}</p>
      <p><strong>Fecha de Pedido:</strong> ${new Date(order.order_date).toLocaleDateString()}</p>
      <p><strong>Estado:</strong> ${order.status}</p>
      <label for="receivedQuantity">Cantidad Recibida:</label>
      <input type="number" id="receivedQuantity" value="${order.quantity}" min="0">
    `;
  }

  // Función para confirmar la recepción del pedido
  function confirmReception() {
    const receivedQuantityInput = document.getElementById('receivedQuantity');
    const receivedQuantity = parseInt(receivedQuantityInput.value);

    if (isNaN(receivedQuantity) || receivedQuantity < 0) {
      alert('Por favor, ingrese una cantidad válida.');
      return;
    }

    // Obtener detalles del pedido
    db.get(
      `SELECT orders.*, inventory.id AS product_id
       FROM orders
       JOIN inventory ON orders.product_id = inventory.id
       WHERE orders.id = ?`,
      [selectedOrderId],
      (err, order) => {
        if (err) {
          console.error('Error al obtener los detalles del pedido:', err);
        } else {
          // Actualizar el inventario
          db.run(
            `UPDATE inventory SET stock = stock + ? WHERE id = ?`,
            [receivedQuantity, order.product_id],
            (err) => {
              if (err) {
                console.error('Error al actualizar el inventario:', err);
              } else {
                // Actualizar el estado del pedido
                db.run(
                  `UPDATE orders SET status = 'Recibido', received_date = ? WHERE id = ?`,
                  [new Date().toISOString(), selectedOrderId],
                  (err) => {
                    if (err) {
                      console.error('Error al actualizar el estado del pedido:', err);
                    } else {
                      alert('Pedido registrado exitosamente.');
                      // Volver a la lista de pedidos
                      orderListSection.style.display = 'block';
                      orderDetailsSection.style.display = 'none';
                      loadPendingOrders();
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  }

  // Evento para confirmar la recepción
  confirmReceptionBtn.addEventListener('click', confirmReception);

  // Evento para volver a la lista de pedidos
  backToOrdersBtn.addEventListener('click', () => {
    orderListSection.style.display = 'block';
    orderDetailsSection.style.display = 'none';
  });

  // Cargar los pedidos pendientes al iniciar
  loadPendingOrders();
});