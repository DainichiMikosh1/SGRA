const path = require('path');
const db = require(path.join(__dirname, '.', '..', 'database.js'));
const bcrypt = require('bcrypt');
const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (username && password) {
      authenticateUser(username, password);
    } else {
      errorMessage.textContent = 'Por favor, ingrese usuario y contraseña.';
    }
  });

  function authenticateUser(username, password) {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        console.error('Error al consultar la base de datos:', err);
        errorMessage.textContent = 'Error al iniciar sesión. Intente nuevamente.';
      } else if (user) {
        bcrypt.compare(password, user.password_hash, (err, result) => {
          if (err) {
            console.error('Error al comparar las contraseñas:', err);
            errorMessage.textContent = 'Error al iniciar sesión. Intente nuevamente.';
          } else if (result) {
            // Autenticación exitosa
            ipcRenderer.send('login-success');
          } else {
            // Contraseña incorrecta
            errorMessage.textContent = 'Usuario o contraseña incorrectos.';
          }
        });
      } else {
        // Usuario no encontrado
        errorMessage.textContent = 'Usuario o contraseña incorrectos.';
      }
    });
  }
});