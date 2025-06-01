// src/testDb.js
const db = require('./config/db');

async function testConnection() {
    try {
        const connection = await db.getConnection();
        console.log('Connessione al database riuscita.');
        connection.release(); // Rilascia la connessione al pool
        process.exit(0);
    } catch (err) {
        console.error('Errore di connessione al database:', err);
        process.exit(1);
    }
}

testConnection();
