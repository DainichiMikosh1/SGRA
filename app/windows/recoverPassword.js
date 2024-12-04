const nodemailer = require('nodemailer');
const path = require('path');
const db = require(path.join(__dirname, '.', '..', 'database.js'));
require('dotenv').config();

document.getElementById('recoverPasswordBtn').addEventListener('click', () => {
  const username = document.getElementById('username').value;
  const errorMessage = document.getElementById('errorMessage'); 
  const successMessage = document.getElementById('successMessage'); // Elemento para mostrar el mensaje de éxito
  
  if (!username) {
    errorMessage.textContent = 'Por favor, ingresa tu nombre de usuario.';
    return;
  }

  // Buscar el correo y la contraseña encriptada del usuario
  db.get("SELECT email, password_hash FROM users WHERE username = ?", [username], (err, row) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err);
      errorMessage.textContent = 'Hubo un error al consultar los datos.';
      return;
    }

    if (!row) {
      errorMessage.textContent = 'Usuario no encontrado.';
      return;
    }

    // Si el usuario existe, desencriptar la contraseña y enviar el correo
    const userEmail = row.email;
    const password = row.password_hash;

    // Enviar la contraseña desencriptada por correo
    sendPasswordRecoveryEmail(username, userEmail, password, successMessage);
  });
});

// Función para enviar el correo de recuperación de contraseña
function sendPasswordRecoveryEmail(username, userEmail, password, successMessage) {

    // Si la contraseña se desencripta correctamente, enviamos el correo
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "alvaradomando22@gmail.com",
        pass: "zghf qhwk lbjf lrwp",
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Recuperación de Contraseña',
      text: `Hola ${username},\n\nHemos recibido una solicitud para recuperar tu contraseña. Si no has solicitado este cambio, por favor ignora este mensaje.\n\nTu contraseña es: ${password}\n\nGracias.\n\nEl equipo de soporte`,
    };

    // Enviar el correo
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
        errorMessage.textContent = 'Error al enviar el correo.';
        return;
      }

      console.log('Correo enviado:', info.response);

      // Mostrar mensaje de éxito
      successMessage.textContent = 'Correo de recuperación enviado con éxito a tu dirección de correo.';
      successMessage.style.color = 'green'; // Puedes cambiar el color si lo prefieres
    });
}
