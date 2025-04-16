// windows/sellProductWindow.js (ejemplo actualizado)
const path = require('path');
const db = require(path.join(__dirname, '..', 'database.js'));
const { ipcRenderer } = require('electron'); 

window.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const searchResults = document.getElementById('searchResults');
  const cartTableBody = document.querySelector('#cartTable tbody');
  const totalAmountSpan = document.getElementById('totalAmount');
  const goToPaymentBtn = document.getElementById('goToPaymentBtn');

  let cart = [];
  let loggedUserId = null;

  ipcRenderer.on('set-logged-user-id', (event, userId) => {
    loggedUserId = userId;
  });

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
                <span>${row.description} | marca: ${row.model} (Stock: ${row.stock}) - $${row.price}</span>
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
    const existingProduct = cart.find((item) => item.id === product.id);

    if (existingProduct) {
      if (existingProduct.quantity + quantity <= product.stock) {
        existingProduct.quantity += quantity;
      } else {
        alert(`No hay suficiente stock para agregar ${quantity} unidades más de este producto.`);
      }
    } else {
      if (quantity <= product.stock) {
        cart.push({
          id: product.id,
          description: product.description,
          model: product.model,
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

      const imagePath = item.ImagePath ? path.join(process.resourcesPath, item.ImagePath) : '';
      const imageUrl = imagePath ? `file://${imagePath}` : '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${imageUrl}" alt="Imagen del Producto" style="max-width: 100px; height: auto;"></td>
        <td>${item.description}</td>
        <td>${item.model}</td>
        <td>$${item.price}</td>
        <td>${item.quantity}</td>
        <td>$${subtotal.toFixed(2)}</td>
        <td><button data-index="${index}">Eliminar</button></td>
      `;
      cartTableBody.appendChild(tr);

      const removeButton = tr.querySelector('button');
      removeButton.addEventListener('click', () => {
        cart.splice(index, 1);
        updateCartUI();
      });
    });

    totalAmountSpan.textContent = totalAmount.toFixed(2);
  }

  function openPaymentWindow() {
    if (cart.length === 0) {
      alert('El carrito está vacío.');
      return;
    }
    // Enviamos los datos al main para abrir la ventana de caja
    updateCartUI();
    ipcRenderer.send('open-payment-window', { cart, total: parseFloat(totalAmountSpan.textContent), userId: loggedUserId });
  }

  // Eventos
  searchBtn.addEventListener('click', searchProducts);
  goToPaymentBtn.addEventListener('click', openPaymentWindow);
});
