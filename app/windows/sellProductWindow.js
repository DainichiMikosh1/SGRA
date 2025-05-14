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
      // Crear primero el contenedor para resultados
      const resultsContainer = document.createElement('div');
      resultsContainer.classList.add('search-results-container');
      
      // Crear el botón para agregar productos seleccionados
      const addSelectedBtn = document.createElement('button');
      addSelectedBtn.id = 'addSelectedProductsBtn';
      addSelectedBtn.innerHTML = '<img src="images/confirm.png" alt="Carrito"> Agregar Seleccionados';
      addSelectedBtn.classList.add('add-selected-btn');
      
      // Contenedor para la lista de productos
      const productsListContainer = document.createElement('div');
      productsListContainer.classList.add('products-list');
      
      db.all(
        `SELECT * FROM inventory WHERE description LIKE ? OR serial_number LIKE ?`,
        [`%${searchTerm}%`, `%${searchTerm}%`],
        (err, rows) => {
          if (err) {
            console.error('Error al buscar productos:', err);
          } else if (rows.length > 0) {
            rows.forEach((row) => {
              const productCard = document.createElement('div');
              productCard.classList.add('product-card');
              
              // Obtener ruta de imagen si existe
              const imagePath = row.image_path ? path.join(process.resourcesPath, row.image_path) : '';
              const imageUrl = imagePath ? `file://${imagePath}` : '../images/no-image.png';
              
              productCard.innerHTML = `
                <div class="product-selection">
                  <input type="checkbox" id="select-${row.id}" class="product-checkbox" data-id="${row.id}">
                  <div class="custom-checkbox">
                    <svg class="checkmark" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                    </svg>
                  </div>
                </div>
                <div class="product-image">
                  <img src="${imageUrl}" alt="${row.description}">
                </div>
                <div class="product-info">
                  <h3>${row.description}</h3>
                  <p>Marca: ${row.model}</p>
                  <p class="product-stock">Stock: ${row.stock} unidades</p>
                  <p class="product-price">$${row.price.toFixed(2)}</p>
                  <div class="product-quantity">
                    <label for="quantity-${row.id}">Cantidad:</label>
                    <input type="number" min="1" max="${row.stock}" value="1" id="quantity-${row.id}" class="quantity-input">
                  </div>
                </div>
              `;
              
              productsListContainer.appendChild(productCard);
              
              // Añadir evento después de agregar al DOM para que funcione el checkbox
              const checkbox = productCard.querySelector(`#select-${row.id}`);
              const customCheckbox = productCard.querySelector('.custom-checkbox');
              
              // Hacer que todo el área de la tarjeta sea clickeable para seleccionar
              productCard.addEventListener('click', (e) => {
                // Evitar marcar/desmarcar si se hace clic en el control de cantidad
                if (e.target.classList.contains('quantity-input')) return;
                
                // Cambiar el estado del checkbox
                checkbox.checked = !checkbox.checked;
                // Mostrar feedback visual
                if (checkbox.checked) {
                  productCard.classList.add('selected');
                } else {
                  productCard.classList.remove('selected');
                }
              });
              
              // Evitar que al hacer clic en el checkbox se propague el evento
              checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
              });
              
              // Evitar que al hacer clic en los inputs de cantidad se marque/desmarque el producto
              const quantityInput = productCard.querySelector(`#quantity-${row.id}`);
              quantityInput.addEventListener('click', (e) => {
                e.stopPropagation();
              });
            });
            
            // Agregar elementos al DOM
            resultsContainer.appendChild(addSelectedBtn);
            resultsContainer.appendChild(productsListContainer);
            searchResults.appendChild(resultsContainer);
            
            // Agregar evento al botón de agregar seleccionados
            addSelectedBtn.addEventListener('click', addSelectedToCart);
          } else {
            searchResults.innerHTML = '<p class="no-results">No se encontraron productos.</p>';
          }
        }
      );
    }
  }

  // Función para agregar productos seleccionados al carrito
  function addSelectedToCart() {
    const selectedCheckboxes = document.querySelectorAll('.product-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
      alert('No has seleccionado ningún producto.');
      return;
    }
    
    let productsAdded = 0;
    const totalProducts = selectedCheckboxes.length;
    
    selectedCheckboxes.forEach(checkbox => {
      const productId = checkbox.getAttribute('data-id');
      const quantityInput = document.getElementById(`quantity-${productId}`);
      const quantity = parseInt(quantityInput.value);
      
      // Buscar los datos del producto
      db.get('SELECT * FROM inventory WHERE id = ?', [productId], (err, product) => {
        if (err) {
          console.error('Error al obtener producto:', err);
        } else if (product) {
          addToCart(product, quantity);
          // Desmarcar después de agregar
          checkbox.checked = false;
          
          // Eliminar la clase 'selected' de la tarjeta
          const productCard = checkbox.closest('.product-card');
          if (productCard) {
            productCard.classList.remove('selected');
          }
          
          productsAdded++;
          
          // Si ya procesamos todos los productos seleccionados
          if (productsAdded === totalProducts) {
            // Mostrar mensaje de confirmación
            const confirmMessage = document.createElement('div');
            confirmMessage.classList.add('confirmation-message');
            confirmMessage.textContent = `${totalProducts} producto(s) agregado(s) al carrito exitosamente.`;
            
            // Limpiar resultados de búsqueda y mostrar mensaje
            searchResults.innerHTML = '';
            searchResults.appendChild(confirmMessage);
            
            // Opcional: limpiar el campo de búsqueda
            searchInput.value = '';
            
            // Opcional: hacer scroll hasta el carrito para que el usuario vea los productos agregados
            document.getElementById('cart').scrollIntoView({ behavior: 'smooth' });
            
            // Después de 3 segundos, eliminar el mensaje de confirmación
            setTimeout(() => {
              confirmMessage.remove();
            }, 3000);
          }
        }
      });
    });
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
