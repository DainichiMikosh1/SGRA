const db = require('./database.js');

// Función para actualizar las rutas de las imágenes
function updateImagePaths() {
  return new Promise((resolve, reject) => {
    // Primero obtenemos todos los productos para verificar
    db.all('SELECT id, image_path FROM inventory', [], (err, rows) => {
      if (err) {
        console.error('Error al consultar productos:', err);
        reject(err);
        return;
      }
      
      console.log(`Encontrados ${rows.length} productos para actualizar.`);
      
      // Actualizar todas las rutas de imágenes
      db.run(
        `UPDATE inventory 
         SET image_path = REPLACE(image_path, 'images/', 'images/productos/') 
         WHERE image_path LIKE 'images/%'`,
        function(err) {
          if (err) {
            console.error('Error al actualizar rutas:', err);
            reject(err);
            return;
          }
          
          console.log(`✓ Actualización completada. ${this.changes} rutas de imágenes actualizadas.`);
          
          // Verificar los cambios realizados
          db.all('SELECT id, image_path FROM inventory', [], (err, updatedRows) => {
            if (err) {
              console.error('Error al verificar actualizaciones:', err);
              reject(err);
              return;
            }
            
            console.log('Ejemplos de rutas actualizadas:');
            updatedRows.slice(0, 5).forEach(row => {
              console.log(`ID: ${row.id}, Nueva ruta: ${row.image_path}`);
            });
            
            resolve(updatedRows);
          });
        }
      );
    });
  });
}

// Ejecutar la actualización
updateImagePaths()
  .then(() => {
    console.log('Proceso completado con éxito.');
    db.close();
  })
  .catch(err => {
    console.error('Error en el proceso:', err);
    db.close();
  });