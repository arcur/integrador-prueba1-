// src/models/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    // --- CAMBIOS CLAVE AQUÍ ---
    timezone: '-05:00',    // Le dice a mysql2 que convierta fechas a esta zona
    dateStrings: true,      // IMPORTANTE: Devuelve la fecha como texto, no como objeto Date (evita conversiones erróneas de Node)
    ssl: {
        rejectUnauthorized: false
    }
});

// ESTO ES LO QUE ARREGLA EL PROBLEMA DE "GLOBAL TIMEZONE"
// Cada vez que se crea una conexión, forzamos la zona horaria de la sesión a -05:00
pool.on('connection', (connection) => {
    connection.query('SET time_zone = "-05:00"');
});

// Verificación de conexión
pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a la base de datos TechStore_DB');
        // Prueba para verificar que la hora es correcta en la consola
        connection.query('SELECT NOW() as ahora')
            .then(([rows]) => {
                console.log('🕒 Hora del Servidor DB (Perú):', rows[0].ahora);
            });
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error al conectar con la DB:', err.message);
    });

module.exports = pool;