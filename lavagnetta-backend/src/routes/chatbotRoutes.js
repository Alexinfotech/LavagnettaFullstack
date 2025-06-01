// src/routes/chatbotRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const chatbotController = require('../controllers/chatbotController');
const authMiddleware = require('../middleware/authMiddleware'); // Assicurati sia il percorso corretto

// --- Rotte Chatbot ---

// Applica l'autenticazione a tutte le rotte definite qui
// Questo assicura che solo gli utenti loggati possano usare il chatbot
// e che req.user.id sia disponibile nel controller.
router.use(authMiddleware);

/**
 * @route   POST /api/chatbot/send-message
 * @desc    Invia un messaggio utente al chatbot Gemini e riceve la risposta.
 *          Gestisce la cronologia e applica filtri di contenuto/argomento.
 * @access  Private (Richiede token JWT valido)
 * @body    { "message": "Testo del messaggio utente" }
 * @returns { "assistant_response": "Testo della risposta dell'assistente" }
 * @errors  400 - Messaggio mancante o non valido.
 *          401 - Autenticazione fallita o token non valido.
 *          500 - Errore interno del server o errore comunicazione con Gemini.
 */
router.post(
    '/send-message',
    [
        // Validazione dell'input 'message' nel corpo della richiesta
        body('message', 'Il campo messaggio è richiesto e non può essere vuoto')
            .trim() // Rimuove spazi bianchi inutili all'inizio e alla fine
            .isLength({ min: 1, max: 2000 }) // Limita la lunghezza per prevenire abusi/errori
            .withMessage('Il messaggio deve contenere tra 1 e 2000 caratteri.')
        // Nota: non usiamo notEmpty() perché isLength({min: 1}) copre già il caso vuoto dopo trim()
    ],
    chatbotController.sendMessage // Chiama il metodo del controller dopo la validazione
);

// Aggiungere qui eventuali altre rotte future per il chatbot se necessario
// Esempio: router.get('/history', chatbotController.getHistory);

module.exports = router;