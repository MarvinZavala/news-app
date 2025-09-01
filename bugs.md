# 1. Limpiar caché de npm
npm cache clean --force

# 2. Borrar dependencias antiguas
rm -rf node_modules package-lock.json

# 3. Reinstalar todo desde cero
npm install

# 4. Iniciar el servidor limpiando el caché de Metro
npm run web -- --clearm nb vb