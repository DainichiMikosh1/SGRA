const path = require('path');
const db = require(path.join(__dirname, '.', '..', 'database.js'));
const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');

  // Manejar el formulario de inicio de sesión
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

  // Manejar el clic en el enlace de registro
  const registerLink = document.getElementById('registerLink');
  registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    ipcRenderer.send('open-register-window'); // Enviar evento al proceso principal
  });

  function authenticateUser(username, password) {
    // Buscar el usuario en la base de datos
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        console.error('Error al consultar la base de datos:', err);
        errorMessage.textContent = 'Error al iniciar sesión. Intente nuevamente.';
      } else if (user) {
        // Comparar las contraseñas en texto plano
        if (password === user.password_hash) { 
          // Contraseña correcta, autenticación exitosa
          ipcRenderer.send('login-success', { username: user.username });
        } else {
          // Contraseña incorrecta
          errorMessage.textContent = 'Usuario o contraseña incorrectos.';
        }
      } else {
        // Usuario no encontrado
        errorMessage.textContent = 'Usuario no encontrado.';
      }
    });
  }
});
