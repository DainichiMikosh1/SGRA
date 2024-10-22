const { ipcRenderer } = require('electron');

const productoForm = document.getElementById('producto-form');
const productosLista = document.getElementById('productos-lista');
const mostrarProductosBtn = document.getElementById('mostrar-productos');

// Enviar producto al backend cuando se agrega
productoForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const categoria = document.getElementById('categoria').value;
  const stock = parseInt(document.getElementById('stock').value);

  const producto = { nombre, categoria, stock };
  ipcRenderer.send('agregar-producto', producto);

  productoForm.reset();
});

// Evento para mostrar productos al hacer clic en el botón
mostrarProductosBtn.addEventListener('click', async () => {
  await cargarProductos();
});

// Función para cargar y mostrar productos
async function cargarProductos() {
  const productos = await ipcRenderer.invoke('obtener-productos');
  productosLista.innerHTML = ''; // Limpia la lista anterior

  productos.forEach((producto) => {
    const item = document.createElement('div');
    item.innerHTML = `
      <strong>${producto.nombre}</strong> - ${producto.categoria} - Stock: ${producto.stock}
      <button onclick="eliminarProducto(${producto.id})">Eliminar</button>
    `;
    productosLista.appendChild(item);
  });
}

// Función para eliminar productos
async function eliminarProducto(id) {
  await ipcRenderer.invoke('eliminar-producto', id);
  await cargarProductos(); // Recargar la lista después de eliminar
}
