// backend/routes/userBoardSettingsRoutes.js
const express = require('express');
const { param, body } = require('express-validator');
const router = express.Router();

const userBoardSettingsController = require('../controllers/userBoardSettingsController');
const authenticate = require('../middleware/authMiddleware'); // Middleware di autenticazione

// Applica autenticazione a tutte le rotte definite in questo file
router.use(authenticate);

/**
 * @route   PUT /api/auth/user-settings/boards/:boardId/background
 * @desc    Imposta/Aggiorna lo sfondo personalizzato per una data lavagna per l'utente loggato.
 * @access  Private
 * @body    { background: "nomefile.jpg" }
 */
router.put(
    '/boards/:boardId/background', // La rotta relativa inizia dopo /api/auth/user-settings
    [
        // Validazione del parametro URL boardId
        param('boardId')
            .isInt({ gt: 0 }) // Assicura sia un intero positivo
            .withMessage('ID lavagna non valido nel percorso.'),

        // Validazione del campo background nel corpo della richiesta
        body('background')
            .trim() // Rimuove spazi bianchi inizio/fine
            .notEmpty() // Non può essere vuoto dopo il trim
            .withMessage('Il campo background è richiesto e non può essere vuoto.')
            .isString() // Deve essere una stringa
            .withMessage('Il background deve essere una stringa.')
            .isLength({ min: 1, max: 255 }) // Limita lunghezza per sicurezza
            .withMessage('Il nome del background deve avere tra 1 e 255 caratteri.')
        // Potresti aggiungere una regex se vuoi validare formati specifici (es. solo .jpg, .png)
        // .matches(/\.(jpg|jpeg|png|gif)$/i).withMessage('Formato immagine non valido per lo sfondo.')
    ],
    userBoardSettingsController.setUserBoardBackground // Chiama la funzione del controller
);

// --- Aggiungere qui altre rotte per impostazioni future ---
// Esempio:
// GET /boards/:boardId -> per ottenere tutte le impostazioni (se servisse)
// router.get('/boards/:boardId', [param('boardId').isInt({ gt: 0 })], userBoardSettingsController.getUserBoardSettings);

module.exports = router;