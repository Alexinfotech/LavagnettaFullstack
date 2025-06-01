// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
// --- USA 'body' invece di 'check' per chiarezza (funzionano uguale per req.body) ---
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const boardRoutes = require('./boardRoutes'); // Rotte per le lavagnette
const noteRoutes = require('./noteRoutes'); // Rotte per le note
const authMiddleware = require('../middleware/authMiddleware'); // Middleware

// --- Definisci qui le regex per la password ---
// Assicura almeno 1 maiuscola, 1 minuscola, 3 numeri, 1 speciale
// NOTA: La regex positiva lookahead è un po' complessa, ma valida tutto in un colpo.
// Spiegazione:
// (?=.*\d.*\d.*\d)   - Almeno 3 numeri (cerca un numero, poi altri caratteri, poi un altro numero, ecc.)
// (?=.*[a-z])       - Almeno 1 minuscola
// (?=.*[A-Z])       - Almeno 1 maiuscola
// (?=.*[!@#$%^&*(),.?":{}|<>]) - Almeno 1 speciale (PERSONALIZZA QUESTO SET)
// .{8,}             - Almeno 8 caratteri totali
const complexPasswordRegex = /^(?=.*\d.*\d.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
const specialCharsAllowed = '!@#$%^&*(),.?":{}|<>'; // Stringa per messaggio errore

// --- Fine definizioni Regex ---

// Rotta per registrare un nuovo utente con validazione avanzata
router.post(
    '/register',
    [
        // Validazione Username (invariata, ma usa body())
        body('username', 'Il nome utente è richiesto.')
            .trim() // Rimuovi spazi
            .notEmpty() // Controlla non sia vuoto dopo trim
            .escape(), // Protezione XSS

        // Validazione Email (aggiunto normalizeEmail)
        body('email', 'Inserisci un indirizzo email valido.')
            .trim()
            .isEmail()
            .normalizeEmail(), // Normalizza l'email (es. minuscolo, rimuove punti da gmail)

        // Validazione Password Complessa
        body('password')
            .isLength({ min: 8 }).withMessage('La password deve contenere almeno 8 caratteri.')
            .matches(complexPasswordRegex).withMessage(`La password deve contenere almeno 1 maiuscola, 1 minuscola, 3 numeri e 1 carattere speciale (${specialCharsAllowed}).`),
        // NON USARE .escape() SULLA PASSWORD PRIMA DELL'HASHING

        // Validazione Conferma Password (CONTROLLO CHE DEVE ESSERE FATTO QUI!)
        // Viene aggiunto anche il controllo custom che hai già nel frontend
        body('confirmPassword', 'Il campo Conferma Password è richiesto.')
            .notEmpty() // Assicura che non sia vuoto
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Le password non corrispondono.');
                }
                // Indica successo se corrispondono
                return true;
            })
    ],
    authController.register // Passa al controller solo se tutte le validazioni passano
);

// Rotta per il login (invariata, usa body())
router.post(
    '/login',
    [
        body('email', 'Inserisci un indirizzo email valido.')
            .trim()
            .isEmail()
            .normalizeEmail(),
        body('password', 'La password è richiesta.')
            .exists() // Verifica solo che il campo esista
    ],
    authController.login
);

// Rotta per il rinnovo del token (invariata)
router.post('/renew-token', authMiddleware, authController.renewToken);

// Monta le rotte delle lavagnette sotto /api/auth/boards (invariato)
router.use('/boards', boardRoutes);

// Monta le rotte delle note sotto /api/auth/notes (invariato)
router.use('/notes', noteRoutes);

module.exports = router;