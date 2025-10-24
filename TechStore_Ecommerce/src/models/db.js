// src/models/db.js

const mysql = require('mysql2/promise'); // Usamos la versión con "promesas"
require('dotenv').config(); // Carga las variables de entorno del archivo .env

// Creamos un "pool" de conexiones.
// Un pool gestiona múltiples conexiones para que la app sea más eficiente
// y no tenga que abrir/cerrar una conexión por cada consulta.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true
});

// Mensaje de éxito al conectar (opcional, pero útil)
pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a la base de datos TechStore_DB');
        connection.release(); // Soltamos la conexión de vuelta al pool
    })
    .catch(err => {
        console.error('❌ Error al conectar con la DB:', err.message);
    });

// Exportamos el pool para que otros archivos (modelos, controladores) puedan usarlo
module.exports = pool;