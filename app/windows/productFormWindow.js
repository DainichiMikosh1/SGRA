const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require(path.join(__dirname, '..', 'database.js'));

window.addEventListener('DOMContentLoaded', () => {
  const productForm = document.getElementById('productForm');
  const productImage = document.getElementById('productImage');
  const formTitle = document.getElementById('formTitle');

  let isEditMode = false;
  let editProductId = null;

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

  productForm.addEventListener('submit', async (e) => {
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

    const file = productImage.files[0];

    if (file) {
      const destDir = path.join(__dirname, 'images', 'productos'); // Ruta relativa hacia la carpeta images
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true }); // Crear la carpeta si no existe
      }

      const destPath = path.join(destDir, file.name);

      try {
        const arrayBuffer = await file.arrayBuffer(); // Leer archivo como ArrayBuffer
        const buffer = Buffer.from(arrayBuffer); // Convertir a Buffer
        fs.writeFileSync(destPath, buffer); // Guardar el archivo en la carpeta 'images'
        productData.imagePath = `images/productos/${file.name}`; // Guardar la ruta en la BD
      } catch (err) {
        console.error('Error al guardar la imagen:', err);
        return;
      }
    }

    if (isEditMode) {
      db.run(
        `UPDATE inventory SET category = ?, description = ?, serial_number = ?, model = ?, year = ?, price = ?, stock = ?, image_path = ? WHERE id = ?`,
        [
          productData.category,
          productData.description,
          productData.serial_number,
          productData.model,
          productData.year,
          productData.price,
          productData.stock,
          productData.imagePath || '',
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
      db.run(
        `INSERT INTO inventory (category, description, serial_number, model, year, price, stock, image_path) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productData.category,
          productData.description,
          productData.serial_number,
          productData.model,
          productData.year,
          productData.price,
          productData.stock,
          productData.imagePath || '',
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
