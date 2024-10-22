// addDefaultUser.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'app', 'data', 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

// Crear la tabla de usuarios
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);`, (err) => {
  if (err) {
    console.error('Error al crear la tabla de usuarios:', err);
  } else {
    // Insertar el usuario admin
    const username = 'admin';
    const password = 'admin123'; // Cambia esta contraseña por una más segura
    const saltRounds = 10;

    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        console.error('Error al generar el hash de la contraseña:', err);
      } else {
        db.run(`INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)`, [username, hash], (err) => {
          if (err) {
            console.error('Error al insertar el usuario admin:', err);
          } else {
            console.log('Usuario admin creado exitosamente.');
          }
          db.close();
        });
      }
    });
  }
});
