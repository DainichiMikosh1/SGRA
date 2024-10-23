const path = require('path');
const db = require(path.join(__dirname, '.', '..', 'database.js'));
const { ipcRenderer } = require('electron'); 

window.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const searchResults = document.getElementById('searchResults');
  const cartTableBody = document.querySelector('#cartTable tbody');
  const totalAmountSpan = document.getElementById('totalAmount');
  const confirmSaleBtn = document.getElementById('confirmSaleBtn');

  let cart = []; // Array para almacenar los productos en el carrito

  // Función para buscar productos
  function searchProducts() {
    const searchTerm = searchInput.value.trim();
    searchResults.innerHTML = '';

    if (searchTerm) {
      db.all(
        `SELECT * FROM inventory WHERE description LIKE ? OR serial_number LIKE ?`,
        [`%${searchTerm}%`, `%${searchTerm}%`],
        (err, rows) => {
          if (err) {
            console.error('Error al buscar productos:', err);
          } else if (rows.length > 0) {
            rows.forEach((row) => {
              const div = document.createElement('div');
              div.classList.add('product-item');
              div.innerHTML = `
                <span>${row.description} (Stock: ${row.stock}) - $${row.price}</span>
                <input type="number" min="1" max="${row.stock}" value="1" id="quantity-${row.id}">
                <button data-id="${row.id}">Agregar al Carrito</button>
              `;
              searchResults.appendChild(div);

              const addButton = div.querySelector('button');
              addButton.addEventListener('click', () => {
                const quantityInput = div.querySelector(`#quantity-${row.id}`);
                const quantity = parseInt(quantityInput.value);
                addToCart(row, quantity);
              });
            });
          } else {
            searchResults.innerHTML = '<p>No se encontraron productos.</p>';
          }
        }
      );
    }
  }

  // Función para agregar producto al carrito
  function addToCart(product, quantity) {
    // Verificar si el producto ya está en el carrito
    const existingProduct = cart.find((item) => item.id === product.id);

    if (existingProduct) {
      // Actualizar la cantidad
      if (existingProduct.quantity + quantity <= product.stock) {
        existingProduct.quantity += quantity;
      } else {
        alert(`No hay suficiente stock para agregar ${quantity} unidades más de este producto.`);
      }
    } else {
      // Agregar nuevo producto al carrito
      if (quantity <= product.stock) {
        cart.push({
          id: product.id,
          description: product.description,
          price: product.price,
          quantity: quantity,
          stock: product.stock,
          ImagePath: product.image_path
        });
      } else {
        alert('La cantidad supera el stock disponible.');
      }
    }

    updateCartUI();
  }

  // Función para actualizar la interfaz del carrito
  function updateCartUI() {
    cartTableBody.innerHTML = '';
    let totalAmount = 0;

    cart.forEach((item, index) => {
      const subtotal = item.price * item.quantity;
      totalAmount += subtotal;

      //Cambiar dev mode o user mode
      const imagePath = item.ImagePath ? path.join(process.resourcesPath, item.ImagePath) : '';
      //const imagePath = item.ImagePath ? path.join(__dirname, item.ImagePath) : '';
      const imageUrl = imagePath ? `file://${imagePath}` : '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
        <img src="${imageUrl}" alt="Imagen del Producto" style="max-width: 100px; height: auto;">
        </td>
        <td>${item.description}</td>
        <td>$${item.price}</td>
        <td>${item.quantity}</td>
        <td>$${subtotal.toFixed(2)}</td>
        <td><button data-index="${index}">Eliminar</button></td>
      `;
      cartTableBody.appendChild(tr);

      // Manejar eliminación de producto del carrito
      const removeButton = tr.querySelector('button');
      removeButton.addEventListener('click', () => {
        cart.splice(index, 1);
        updateCartUI();
      });
    });

    totalAmountSpan.textContent = totalAmount.toFixed(2);
  }

  // Función para confirmar la venta
  function confirmSale() {
    if (cart.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    // Iniciar una transacción
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      let errorOccurred = false;

      cart.forEach((item) => {
        // Verificar stock nuevamente
        db.get('SELECT stock FROM inventory WHERE id = ?', [item.id], (err, row) => {
          if (err) {
            console.error('Error al verificar el stock:', err);
            errorOccurred = true;
            return;
          }

          if (row.stock >= item.quantity) {
            // Actualizar stock en inventario
            db.run(
              'UPDATE inventory SET stock = stock - ? WHERE id = ?',
              [item.quantity, item.id],
              (err) => {
                if (err) {
                  console.error('Error al actualizar el stock:', err);
                  errorOccurred = true;
                  return;
                }
              }
            );

            // Registrar la venta
            db.run(
              'INSERT INTO sales (product_id, quantity, sale_date) VALUES (?, ?, ?)',
              [item.id, item.quantity, new Date().toISOString()],
              (err) => {
                if (err) {
                  console.error('Error al registrar la venta:', err);
                  errorOccurred = true;
                  return;
                }
              }
            );
          } else {
            alert(`No hay suficiente stock para vender ${item.quantity} unidades de ${item.description}.`);
            errorOccurred = true;
            return;
          }
        });
      });

      if (errorOccurred) {
        db.run('ROLLBACK');
        alert('Ocurrió un error al procesar la venta.');
      } else {
        db.run('COMMIT');
        alert('Venta realizada exitosamente.');
        cart = [];
        updateCartUI();
      }
    });
  }

  // Eventos
  searchBtn.addEventListener('click', searchProducts);
  confirmSaleBtn.addEventListener('click', confirmSale);
});
