const { ipcRenderer } = require('electron');
const path = require('path');
const db = require(path.join(__dirname, '.', '..', 'database.js'));

window.addEventListener('DOMContentLoaded', () => {
  const productForm = document.getElementById('productForm');
  const formTitle = document.getElementById('formTitle');

  let isEditMode = false;
  let editProductId = null;

  // Si se está editando un producto existente
  ipcRenderer.on('edit-product', (event, productId) => {
    formTitle.textContent = 'Editar Producto';
    isEditMode = true;
    editProductId = productId;

    db.get('SELECT * FROM inventory WHERE id = ?', [productId], (err, row) => {
      if (err) {
        console.error('Error al obtener el producto:', err);
      } else {
        productForm.category.value = row.category;
        productForm.description.value = row.description;
        productForm.serial_number.value = row.serial_number;
        productForm.model.value = row.model;
        productForm.year.value = row.year;
        productForm.price.value = row.price;
        productForm.stock.value = row.stock;
      }
    });
  });

  // Evento de envío del formulario
  productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const productData = {
      category: productForm.category.value,
      description: productForm.description.value,
      serial_number: productForm.serial_number.value,
      model: productForm.model.value,
      year: parseInt(productForm.year.value),
      price: parseFloat(productForm.price.value),
      stock: parseInt(productForm.stock.value),
    };

    if (isEditMode) {
      // Actualizar producto existente
      db.run(
        `UPDATE inventory SET category = ?, description = ?, serial_number = ?, model = ?, year = ?, price = ?, stock = ? WHERE id = ?`,
        [
          productData.category,
          productData.description,
          productData.serial_number,
          productData.model,
          productData.year,
          productData.price,
          productData.stock,
          editProductId,
        ],
        function (err) {
          if (err) {
            console.error('Error al actualizar el producto:', err);
          } else {
            ipcRenderer.send('product-added');
            window.close();
          }
        }
      );
    } else {
      // Añadir nuevo producto
      db.run(
        `INSERT INTO inventory (category, description, serial_number, model, year, price, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          productData.category,
          productData.description,
          productData.serial_number,
          productData.model,
          productData.year,
          productData.price,
          productData.stock,
        ],
        function (err) {
          if (err) {
            console.error('Error al añadir el producto:', err);
          } else {
            ipcRenderer.send('product-added');
            window.close();
          }
        }
      );
    }
  });
});
