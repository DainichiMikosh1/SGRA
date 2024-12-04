const path = require('path');
const db = require(path.join(__dirname, '.', '..', 'database.js'));
const bcrypt = require('bcrypt');
const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';
    successMessage.textContent = '';

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!username || !email ||!password || !confirmPassword) {
      errorMessage.textContent = 'Por favor, complete todos los campos.';
      return;
    }

    if (password !== confirmPassword) {
      errorMessage.textContent = 'Las contraseñas no coinciden.';
      return;
    }

      // Insertar usuario en la base de datos
      db.run(
        `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
        [username, email,password],
        function (err) {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
              errorMessage.textContent = 'El nombre de usuario ya existe.';
            } else {
              errorMessage.textContent = 'Ocurrió un error al registrar el usuario.';
              console.error('Error al registrar usuario:', err);
            }
          } else {
            successMessage.textContent = 'Cuenta creada exitosamente.';
            registerForm.reset();
          }
        }
      );
  });
});