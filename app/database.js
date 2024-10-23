// app/database.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Asegurarse de que el directorio de datos existe
const dataDir = path.join(__dirname, 'app', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(process.resourcesPath, 'app', 'data', 'database.db');
//CAMBIAR UBICACION DE LA BASE DE DATOS
//const dbPath = path.join(__dirname, 'app', 'data', 'database.db');

// Abre la conexión a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});


if (!fs.existsSync(dbPath)) {
  console.log('La base de datos no existe en userData. Procediendo a copiarla.');

  let sourceDbPath;

  sourceDbPath = path.join(process.resourcesPath, 'app', 'data', 'database.db');

  console.log('sourceDbPath:', sourceDbPath);
  console.log('Existe sourceDbPath:', fs.existsSync(sourceDbPath));

  try {
    fs.copyFileSync(sourceDbPath, dbPath);
    console.log('Base de datos copiada a:', dbPath);
  } catch (err) {
    console.error('Error al copiar la base de datos:', err);
  }
} else {
  console.log('La base de datos ya existe en userData.');
}

db.serialize(() => {
    // Tabla de inventario
    db.run(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT,
        description TEXT,
        serial_number TEXT UNIQUE,
        model TEXT,
        year INTEGER,
        price REAL,
        stock INTEGER,
        image_path TEXT
      )
    `);
  
    // Tabla de ventas
    db.run(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        quantity INTEGER,
        sale_date TEXT,
        FOREIGN KEY(product_id) REFERENCES inventory(id)
      )
    `);
  
    // Tabla de pedidos
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        quantity INTEGER,
        order_date TEXT,
        status TEXT,
        received_date TEXT,
        FOREIGN KEY(product_id) REFERENCES inventory(id)
      )
    `);
  
    //tabla de usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS reembolsos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        refund_date TEXT,
        reason TEXT,
        FOREIGN KEY(sale_id) REFERENCES sales(id),
        FOREIGN KEY(product_id) REFERENCES inventory(id)
      );
    `);
}); 

module.exports = db;
