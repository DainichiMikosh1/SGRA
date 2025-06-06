# SGRA - Sistema de Gestión de Repuestos de GARA

**SGRA** es una aplicación de escritorio multiplataforma (Windows/macOS/Linux) desarrollada con Electron y SQLite3 para gestionar inventario de piezas, ventas, reembolsos, pedidos y reportes.

---

## Características

- Gestión de inventario de piezas:
  - Añadir, editar y eliminar productos con imagen.
  - Control de categoría, descripción, modelo, año, precio y stock.
- Proceso de venta de productos:
  - Búsqueda avanzada y selección múltiple.
  - Generación de ticket de venta.
- Reembolsos:
  - Autenticación previa y validación.
  - Generación de ticket de reembolso.
- Pedidos a proveedores:
  - Detección automática de stock bajo.
  - Generación de lista de pedidos y envío por correo.
- Historial y reportes:
  - Consulta de ventas, pedidos y reembolsos.
  - Reporte mensual en PDF con gráfico de productos más vendidos.
- Recuperación de contraseña vía correo electrónico (Nodemailer).

## Pre-requisitos

- Node.js v14 o superior
- npm (o yarn)
- Git

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/SGRA.git
cd SGRA

# Instalar dependencias
npm install
```

## Ejecución en desarrollo

```bash
npm start
```

> Esto arrancará la aplicación en modo desarrollo con ventanas de Electron.

## Estructura del proyecto

```
SGRA/
├─ app/                      # Archivos de interfaz y recursos
│  ├─ windows/               # Lógica de renderers por ventana
│  ├─ styles/                # CSS para cada vista
│  ├─ images/                # Iconos y assets
│  ├─ data/                  # Base de datos y datos iniciales
│  ├─ *.html                 # Vistas HTML
│  └─ *.js                   # Scripts front-end
├─ database.js               # Configuración y conexión SQLite
├─ main.js                   # Proceso principal de Electron
├─ package.json              # Metadatos y scripts NPM
└─ update-image-paths.js     # Script de mantenimiento de rutas de imágenes
```

## Uso

1. Abrir la aplicación y realizar login.
2. En el menú principal, elegir la sección deseada:
   - **Gestionar Inventario**: Crear/editar/eliminar productos.
   - **Realizar Venta**: Buscar y vender piezas.
   - **Procesar Reembolso**: Devolver productos con ticket.
   - **Registrar Pedido Recibido**: Añadir stock entrante.
   - **Ver Historial de Ventas/Pedidos**.
   - **Notificaciones de Stock Bajo**.
3. Generar reportes y enviarlos por correo.
4. Recuperar contraseña si es necesario.

## Scripts NPM

- `npm start` - Inicia la app en modo desarrollo.
- `npm run build` - Empaqueta la aplicación (configurar según herramienta de empaquetado).
- `node update-image-paths.js` - Corrige rutas de imágenes en la BD.

## Tecnologías

- [Electron](https://www.electronjs.org/)  
- [SQLite3](https://www.npmjs.com/package/sqlite3)  
- [Chart.js](https://www.chartjs.org/)  
- [PDFKit](https://pdfkit.org/)  
- [Nodemailer](https://nodemailer.com/)  
- HTML5 / CSS3 / JavaScript (ES6+)

## Contribuciones

¡Toda contribución es bienvenida! Por favor abre un _issue_ para discutir cambios o mejoras y realiza Pull Requests basadas en ramas feature/ o fix/.

## Licencia

Este proyecto está bajo licencia MIT. Consulta el archivo LICENSE para más detalles.
