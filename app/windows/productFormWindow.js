const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('../../database.js');

window.addEventListener('DOMContentLoaded', () => {
  const productForm = document.getElementById('productForm');
  const formTitle = document.getElementById('formTitle');
  const saveButtonText = document.getElementById('saveButtonText');
  const imagePreview = document.getElementById('imagePreview');
  const productImageInput = document.getElementById('productImage');
  const currentImagePathInput = document.getElementById('currentImagePath');
  
  // Obtener ID del producto de los parámetros URL (si existe)
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  
  // Determinar si estamos en modo edición o adición
  const isEditMode = !!productId;
  
  console.log('Modo formulario:', isEditMode ? 'Editar Producto' : 'Añadir Producto');
  
  // Configurar el formulario según el modo
  if (isEditMode) {
    formTitle.textContent = 'Editar Producto';
    saveButtonText.textContent = 'Actualizar Producto';
    
    // El campo de imagen no es obligatorio en modo edición
    productImageInput.removeAttribute('required');
    
    // Cargar datos del producto
    loadProductData(productId);
  } else {
    formTitle.textContent = 'Añadir Producto';
    saveButtonText.textContent = 'Guardar Producto';
    
    // La imagen es requerida para nuevos productos
    productImageInput.setAttribute('required', 'required');
  }
  
  // Función para cargar los datos del producto en modo edición
  function loadProductData(id) {
    console.log('Cargando datos del producto ID:', id);
    
    db.get('SELECT * FROM inventory WHERE id = ?', [id], (err, product) => {
      if (err) {
        console.error('Error al cargar el producto:', err);
        alert('Error al cargar los datos del producto.');
        return;
      }
      
      if (!product) {
        console.error('Producto no encontrado con ID:', id);
        alert('Error: Producto no encontrado');
        window.close();
        return;
      }
      
      console.log('Datos del producto obtenidos:', product);
      
      // Rellenar formulario con datos del producto
      document.getElementById('description').value = product.description || '';
      document.getElementById('category').value = product.category || '';
      document.getElementById('model').value = product.model || '';
      document.getElementById('serial_number').value = product.serial_number || '';
      document.getElementById('year').value = product.year || '';
      document.getElementById('price').value = product.price || '';
      document.getElementById('stock').value = product.stock || '';
      
      // Guardar la ruta de imagen actual en el campo oculto
      if (product.image_path) {
        currentImagePathInput.value = product.image_path;
        
        // Mostrar la imagen actual
        let imageUrl;
        
        try {
          // Intentar determinar si estamos en producción o desarrollo
          if (process && process.resourcesPath) {
            // Modo producción
            imageUrl = `file://${path.join(process.resourcesPath, product.image_path)}`;
          } else {
            // Modo desarrollo
            imageUrl = `file://${path.join(__dirname, '../..', product.image_path)}`;
          }
          
          imagePreview.innerHTML = `<img src="${imageUrl}" alt="${product.description}" onerror="this.onerror=null; this.src='images/no-image.png';">`;
        } catch (error) {
          console.error('Error al cargar la imagen:', error);
          imagePreview.innerHTML = `
            <div class="image-preview-placeholder">
              <p>Error al cargar la imagen</p>
            </div>
          `;
        }
      }
    });
  }
  
  // Vista previa de imagen
  productImageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        imagePreview.innerHTML = `<img src="${event.target.result}" alt="Vista previa">`;
      }
      reader.readAsDataURL(file);
    }
  });
  
  // Manejar envío del formulario
  productForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Crear FormData para obtener todos los campos
    const formData = new FormData(productForm);
    
    // Obtener datos del producto
    const productData = {
      description: formData.get('description'),
      category: formData.get('category'),
      model: formData.get('model'),
      serial_number: formData.get('serial_number'),
      year: formData.get('year'),
      price: formData.get('price'),
      stock: formData.get('stock')
    };
    
    // Función para guardar o actualizar el producto en la BD según el modo
    const saveProduct = (imagePath) => {
      // Si estamos en modo edición y no hay nueva imagen, usar la existente
      if (isEditMode && !imagePath) {
        imagePath = formData.get('currentImagePath');
      }
      
      if (isEditMode) {
        // Actualizar producto existente
        db.run(
          `UPDATE inventory 
           SET description = ?, category = ?, model = ?, serial_number = ?, 
               year = ?, price = ?, stock = ?, image_path = ?
           WHERE id = ?`,
          [
            productData.description, productData.category, productData.model, 
            productData.serial_number, productData.year, productData.price, 
            productData.stock, imagePath, productId
          ],
          function(err) {
            if (err) {
              console.error('Error al actualizar el producto:', err);
              alert('Error al actualizar el producto.');
            } else {
              alert('Producto actualizado con éxito.');
              ipcRenderer.send('refresh-inventory');
              window.close();
            }
          }
        );
      } else {
        // Insertar nuevo producto
        db.run(
          `INSERT INTO inventory (description, category, model, serial_number, year, price, stock, image_path) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            productData.description, productData.category, productData.model, 
            productData.serial_number, productData.year, productData.price, 
            productData.stock, imagePath
          ],
          function(err) {
            if (err) {
              console.error('Error al insertar el producto:', err);
              alert('Error al insertar el producto.');
            } else {
              alert('Producto añadido con éxito.');
              ipcRenderer.send('refresh-inventory');
              window.close();
            }
          }
        );
      }
    };
    
    // Procesar la imagen si existe
    const imageFile = productImageInput.files[0];
    if (imageFile) {
      // Crear directorio para imágenes si no existe
      const imagesDir = path.join(__dirname, '../../images/productos');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      
      // Generar un nombre único para la imagen
      const timestamp = Date.now();
      const filename = `${timestamp}-${imageFile.name}`;
      const imagePath = path.join('images/productos', filename);
      const fullPath = path.join(__dirname, '../../', imagePath);
      
      // Leer y guardar la imagen
      const reader = new FileReader();
      reader.onload = function(event) {
        const buffer = Buffer.from(event.target.result);
        fs.writeFile(fullPath, buffer, (err) => {
          if (err) {
            console.error('Error al guardar la imagen:', err);
            alert('Error al guardar la imagen.');
            saveProduct(null); // Mantener imagen original en modo edición
          } else {
            console.log('Imagen guardada:', fullPath);
            saveProduct(imagePath);
          }
        });
      };
      reader.readAsArrayBuffer(imageFile);
    } else {
      // Si no hay imagen nueva:
      // - En modo añadir, esto debería bloquearse por el atributo required
      // - En modo editar, guardamos con la imagen existente
      saveProduct(null);
    }
  });
});