// app/database.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Asegurarse de que el directorio de datos existe
const dataDir = path.join(__dirname, 'app','data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'database.db');

// Abre la conexión a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

// Creación de tablas
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
      stock INTEGER
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
}); 

module.exports = db;
