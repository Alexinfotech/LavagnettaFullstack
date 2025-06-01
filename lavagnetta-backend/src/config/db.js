// src/config/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
require('dotenv').config();


// Carica le variabili d'ambiente dal file .env
dotenv.config();

// Log per verifica
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);

// Creazione del pool di connessioni
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, // Porta separata
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
