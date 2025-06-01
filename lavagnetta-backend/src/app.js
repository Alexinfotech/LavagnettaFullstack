// backend/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Import Routers
const authRoutes = require('./routes/authRoutes');
// const boardRoutes = require('./routes/boardRoutes'); // Probabilmente non necessario qui se montato in authRoutes
// const noteRoutes = require('./routes/noteRoutes');   // Probabilmente non necessario qui se montato in authRoutes
const groupRoutes = require('./routes/groupRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userBoardSettingsRoutes = require('./routes/userBoardSettingsRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes'); // <-- Import per Statistiche

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Whitelist CORS ---
const whitelist = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.18:3000',
    'http://192.168.1.183:3000',
    'http://localhost:3001',
    'http://31.190.82.203:3000',
    'http://31.190.103.178:3001',// Rivedi se queste porte IP pubblici sono corrette
    'http://192.168.210.104:3001',
    'http://31.190.82.203:3004',
    'http://31.190.103.178:8009',
];

// --- CORS Middleware ---
app.use(cors({
    origin: function (origin, callback) {
        // console.log(`[CORS] Richiesta da origin: ${origin || 'N/D'}`);
        if (!origin || whitelist.includes(origin)) {
            // console.log(`[CORS] Origin consentito.`);
            callback(null, true);
        } else {
            console.error(`[CORS] Origin ${origin} NON consentito dalla whitelist!`);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true
}));

// --- Middleware Comuni ---
app.use(morgan('dev')); // Logger HTTP
app.use(bodyParser.json()); // Parser per JSON request body

// --- ROUTING ---
app.get('/api/ping', (req, res) => res.send('Pong')); // Rotta semplice per test

// Rotte Applicazione Principale
app.use('/api/auth', authRoutes); // Gestisce /login, /register e probabilmente /boards, /notes
app.use('/api/auth/groups', groupRoutes); // Rotte Gruppi (richiede auth)
app.use('/api/auth/notifications', notificationRoutes); // Rotte Notifiche (richiede auth)
app.use('/api/auth/user-settings', userBoardSettingsRoutes); // Rotte Impostazioni Utente (richiede auth)
app.use('/api/chatbot', chatbotRoutes); // Rotte Chatbot (richiede auth al suo interno)
app.use('/api/stats', statisticsRoutes); // <-- NUOVA ROTTA PER STATISTICHE (richiede auth)

// --- Gestore Errori Globale ---
// Deve essere l'ULTIMO middleware 'use'
app.use((err, req, res, next) => {
    // Gestione Errore CORS
    if (err.message && err.message.includes('not allowed by CORS')) {
        console.error(`[ErrorHandler] Errore CORS bloccato per origin: ${req.headers.origin}`);
        return res.status(403).json({ error: `CORS: L'origine della richiesta (${req.headers.origin || 'sconosciuta'}) non è autorizzata ad accedere a questa risorsa.` });
    }

    // Log dettagliato altri errori server
    console.error('------------------- ERRORE SERVER -------------------');
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.error('Status:', err.status || 500);
    console.error('Message:', err.message);
    if (err.errors && Array.isArray(err.errors)) { // Errori specifici da express-validator
        console.error('Validation Errors:', JSON.stringify(err.errors));
    }
    console.error('Stack:', err.stack); // Stack trace completo
    console.error('-----------------------------------------------------');

    // Risposta al client
    const statusCode = err.status && err.status >= 400 && err.status < 500 ? err.status : 500;
    res.status(statusCode).json({
        // Invia messaggio specifico se è un errore "client" (4xx), altrimenti generico
        error: err.message && statusCode < 500 ? err.message : 'Errore interno del server. Riprova più tardi.'
    });
});

// --- Avvio del Server ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});

module.exports = app; // Esporta app (utile per test)