// app/windows/inventoryWindow.js

const { ipcRenderer } = require('electron');
const path = require('path');
const db = require(path.join(__dirname, '.', '..', 'database.js'));
const fs = require('fs');

window.addEventListener('DOMContentLoaded', () => {
  const inventoryTableBody = document.querySelector('#inventoryTable tbody');
  const searchInput = document.getElementById('searchInput');
  const addProductBtn = document.getElementById('addProductBtn');
  const generateOrderBtn = document.getElementById('generateOrderBtn');

  // Función para cargar el inventario
  function loadInventory(searchTerm = '') {
    inventoryTableBody.innerHTML = '';
    let query = 'SELECT * FROM inventory';
    let params = [];

    if (searchTerm) {
      query += ' WHERE description LIKE ? OR serial_number LIKE ? OR model LIKE ? OR year LIKE ?';
      params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error al cargar el inventario:', err);
      } else {
        rows.forEach((row) => {
          const tr = document.createElement('tr');

          const supplierInfo = checkSupplierCatalog(row.serial_number);
          const supplierAvailability = supplierInfo.availability ? 'Disponible' : 'No Disponible';
          const supplierPrice = supplierInfo.price !== null ? supplierInfo.price : 'N/A';

          tr.innerHTML = `
            <td>${row.category}</td>
            <td>${row.description}</td>
            <td>${row.serial_number}</td>
            <td>${row.model}</td>
            <td>${row.year}</td>
            <td>${row.price}</td>
            <td>${row.stock}</td>
            <td>${supplierAvailability}</td>
            <td>${supplierPrice}</td>
            <td>
              <button class="editBtn" data-id="${row.id}">Editar</button>
            </td>
          `;

          inventoryTableBody.appendChild(tr);
        });

        // Agregar eventos a los botones de editar
        const editButtons = document.querySelectorAll('.editBtn');
        editButtons.forEach((button) => {
          button.addEventListener('click', () => {
            const productId = button.getAttribute('data-id');
            ipcRenderer.send('open-add-product-window', productId);
          });
        });
      }
    });
  }

  // Función para verificar el catálogo del proveedor
  function checkSupplierCatalog(serialNumber) {
    const catalogPath = path.join(__dirname, '..', 'app','data', 'supplier_catalog.json');
    const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

    const product = catalogData.find((item) => item.serial_number === serialNumber);

    if (product) {
      return {
        availability: product.availability,
        price: product.price,
      };
    } else {
      return {
        availability: false,
        price: null,
      };
    }
  }

  // Función para verificar stock bajo
  function checkLowStock() {
    db.all('SELECT * FROM inventory WHERE stock <= ?', [5], (err, rows) => {
      if (err) {
        console.error('Error al verificar el stock bajo:', err);
      } else if (rows.length > 0) {
        alert('¡Alerta! Hay productos con stock bajo.');
      }
    });
  }

  // Función para generar lista de productos faltantes y enviar correo
  function generateMissingProductsList() {
    db.all('SELECT * FROM inventory WHERE stock <= ?', [5], (err, rows) => {
      if (err) {
        console.error('Error al generar la lista de productos faltantes:', err);
      } else {
        let missingProductsText = '';

        rows.forEach((row) => {
          missingProductsText += `${row.description} - Cantidad a pedir: 10\n`;

          // Insertar en la tabla de pedidos
          db.run(
            `INSERT INTO orders (product_id, quantity, order_date, status)
             VALUES (?, ?, ?, ?)`,
            [row.id, 10, new Date().toISOString(), 'Pendiente'],
            (err) => {
              if (err) {
                console.error('Error al crear el pedido:', err);
              }
            }
          );
        });

        // Enviar correo al proveedor
        sendOrderEmail(missingProductsText);
      }
    });
  }

  // Función para enviar correo electrónico
  function sendOrderEmail(missingProducts) {
    const nodemailer = require('nodemailer');
    require('dotenv').config();

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'proveedor@correo.com',
      subject: 'Pedido de Reabastecimiento',
      text: `Estimado proveedor, necesitamos reabastecer los siguientes productos:\n\n${missingProducts}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log('Error al enviar el correo:', error);
      }
      console.log('Correo enviado:', info.response);
      alert('Correo enviado al proveedor.');
    });
  }

  // Eventos
  loadInventory();
  checkLowStock();

  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.trim();
    loadInventory(searchTerm);
  });

  addProductBtn.addEventListener('click', () => {
    ipcRenderer.send('open-add-product-window');
  });

  generateOrderBtn.addEventListener('click', () => {
    generateMissingProductsList();
  });

  // Escuchar evento para refrescar el inventario
  ipcRenderer.on('refresh-inventory', () => {
    loadInventory();
  });
});
