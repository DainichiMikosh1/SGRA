// app/windows/inventoryWindow.js

const { ipcRenderer } = require('electron');
const path = require('path');
const db = require(path.join(__dirname, '.', '..', 'database.js'));
const fs = require('fs');
const Chart = require('chart.js/auto'); // Importar Chart.js

window.addEventListener('DOMContentLoaded', () => {
  const inventoryTableBody = document.querySelector('#inventoryTable tbody');
  const searchInput = document.getElementById('searchInput');
  const addProductBtn = document.getElementById('addProductBtn');
  const generateOrderBtn = document.getElementById('generateOrderBtn');
  const inventorySection = document.getElementById('top-products-section');

  const viewTopProductsBtn = document.getElementById('viewTopProductsBtn');
  const topProductsSection = document.getElementById('top-products-section');
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');
  const filterBtn = document.getElementById('filterBtn');
  const topProductsTableBody = document.querySelector('#topProductsTable tbody');
  const topProductsChart = document.getElementById('topProductsChart');

  viewTopProductsBtn.addEventListener('click', () => {
    inventorySection.style.display = 'none';
    topProductsSection.style.display = 'block';
    loadYears(); // Cargar los años disponibles
    loadTopProducts(); // Cargar los datos al abrir la sección
  });

  function loadYears() {
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '<option value="">Todos</option>'; // Limpiar y agregar opción 'Todos'
  
    for (let year = currentYear; year >= currentYear - 10; year--) {
      const option = document.createElement('option');
      option.value = year.toString();
      option.textContent = year.toString();
      yearSelect.appendChild(option);
    }
  }

  function loadTopProducts() {
    // Obtener el mes y año seleccionados
    const month = monthSelect.value;
    const year = yearSelect.value;
  
    // Construir la consulta SQL
    let query = `
      SELECT inventory.description, SUM(sales.quantity) as total_sold
      FROM sales
      JOIN inventory ON sales.product_id = inventory.id
    `;
    let params = [];
  
    // Agregar condiciones según el mes y año seleccionados
    if (month && year) {
      query += `
        WHERE strftime('%m', sales.sale_date) = ? AND strftime('%Y', sales.sale_date) = ?
      `;
      params.push(month, year);
    } else if (year) {
      query += `
        WHERE strftime('%Y', sales.sale_date) = ?
      `;
      params.push(year);
    }
  
    query += `
      GROUP BY sales.product_id
      ORDER BY total_sold DESC
      LIMIT 10
    `;
  
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error al obtener los productos más vendidos:', err);
      } else {
        // Actualizar la tabla
        updateTopProductsTable(rows);
        // Actualizar la gráfica
        updateChart(rows);
      }
    });
  }

  function updateTopProductsTable(data) {
    // Limpiar la tabla
    topProductsTableBody.innerHTML = '';
    if (data.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 2;
      td.textContent = 'No hay datos para mostrar.';
      tr.appendChild(td);
      topProductsTableBody.appendChild(tr);
      return;
    }
    // Agregar las filas a la tabla
    data.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.description}</td>
        <td>${row.total_sold}</td>
      `;
      topProductsTableBody.appendChild(tr);
    });
  }

  let chart; // Variable global para almacenar la instancia de la gráfica

  function updateChart(data) {
    const ctx = topProductsChart.getContext('2d');
  
    // Si no hay datos, limpiar la gráfica
    if (data.length === 0) {
      if (chart) {
        chart.destroy();
      }
      return;
    }
  
    const labels = data.map((row) => row.description);
    const quantities = data.map((row) => row.total_sold);
  
    // Si la gráfica ya existe, destruirla para crear una nueva
    if (chart) {
      chart.destroy();
    }
  
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Unidades Vendidas',
          data: quantities,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            precision: 0
          }
        }
      }
    });
  }

  filterBtn.addEventListener('click', () => {
    loadTopProducts();
  });

  function loadInventory(searchTerm = '') {
    inventoryTableBody.innerHTML = ''; // Limpiar tabla antes de recargar datos

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

                // Obtener la ruta de la imagen y convertirla en una URL accesible
                //Camabiar dev mode o user mode
                //const imagePath = row.image_path ? path.join(__dirname, row.image_path) : '';
                const imagePath = row.image_path ? path.join(process.resourcesPath, row.image_path) : '';
                const imageUrl = imagePath ? `file://${imagePath}` : ''; // Generar URL con el prefijo `file://`

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
                        <img src="${imageUrl}" alt="Imagen del Producto" style="max-width: 100px; height: auto;">
                    </td>
                    <td>
                        <button class="editBtn" data-id="${row.id}">Editar</button>
                        <button class="deleteBtn" data-id="${row.id}">Eliminar</button>
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

            const deleteButton = document.querySelectorAll('.deleteBtn');
            deleteButton.forEach((button) => {
                button.addEventListener('click', () => {
                    const productId = button.getAttribute('data-id');
                    deleteProduct(productId);
                });
            });

            const deleteProduct = (productId) => {
                const confirmResponse = confirm('¿Estás seguro de que deseas eliminar este producto?');

                if (confirmResponse) {
                    db.run('DELETE FROM inventory WHERE id = ?', [productId], (err) => {
                        if (err) {
                            console.error('Error al eliminar el producto:', err);
                        } else {
                            alert('Producto eliminado exitosamente.');
                            loadInventory();
                        }
                    });
                }
            }
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
              } else {
                console.log('Pedido creado exitosamente.');
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
        user: "alvaradomando22@gmail.com",
        pass: "zghf qhwk lbjf lrwp",
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'juandiegotorreslopez61@gmail.com',
      subject: 'Pedido de Reabastecimiento',
      text: `Estimado proveedor, necesitamos reabastecer los siguientes productos:\n\n${missingProducts}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        alert('Error al enviar el correo.');
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