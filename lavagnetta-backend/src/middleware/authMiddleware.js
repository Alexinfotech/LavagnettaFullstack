// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Middleware per autenticare le richieste.
 */
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Autenticazione richiesta.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Utente non trovato.' });
        }

        req.user = rows[0];
        console.log('Authenticated user:', req.user);
        next();
    } catch (error) {
        console.error('Errore di autenticazione:', error);
        res.status(401).json({ message: 'Token non valido.' });
    }
};

module.exports = authMiddleware;
