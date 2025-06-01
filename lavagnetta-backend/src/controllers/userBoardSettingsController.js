// backend/controllers/userBoardSettingsController.js
const { validationResult } = require('express-validator');
const userBoardSettingsService = require('../services/userBoardSettingsService');

const userBoardSettingsController = {

    /**
     * @route   PUT /api/auth/user-settings/boards/:boardId/background
     * @desc    Imposta lo sfondo personalizzato per l'utente corrente sulla lavagna specificata.
     * @access  Private (Richiede autenticazione)
     */
    async setUserBoardBackground(req, res) {
        // Validazione input (eseguita da express-validator nelle rotte)
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.warn(`[Ctrl-UBS] setUserBoardBackground: Errori validazione: ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.user.id; // ID utente dal middleware di autenticazione
        const boardId = parseInt(req.params.boardId); // ID lavagna dai parametri URL
        const { background } = req.body; // Nuovo sfondo dal corpo della richiesta

        // Controllo aggiuntivo sull'ID board (già fatto da validator, ma per sicurezza)
        if (isNaN(boardId) || boardId <= 0) {
            console.error(`[Ctrl-UBS] setUserBoardBackground: Ricevuto boardId non valido: ${req.params.boardId}`);
            return res.status(400).json({ message: 'ID lavagna non valido.' });
        }

        console.log(`[Ctrl-UBS] setUserBoardBackground: Richiesta da User ${userId} per impostare BG "${background}" su Board ${boardId}`);

        try {
            // Chiama il service per impostare/aggiornare lo sfondo
            const updatedSetting = await userBoardSettingsService.setUserBackgroundForBoard(userId, boardId, background);

            // Se il service completa senza errori, restituisce l'impostazione aggiornata
            console.log(`[Ctrl-UBS] setUserBoardBackground: Sfondo impostato con successo per User ${userId}, Board ${boardId}.`);
            res.status(200).json(updatedSetting);

        } catch (error) {
            console.error(`[Ctrl-UBS] Errore in setUserBoardBackground (User ${userId}, Board ${boardId}):`, error);
            // Gestione errori specifici dal service
            if (error.message.includes("non trovata")) {
                return res.status(404).json({ error: error.message }); // 404 Not Found
            }
            if (error.message.includes("non valido")) {
                return res.status(400).json({ error: error.message }); // 400 Bad Request
            }
            // Errore generico del server
            res.status(500).json({ error: 'Errore server durante l\'impostazione dello sfondo personalizzato.' });
        }
    }
    // Aggiungere qui altri metodi del controller se necessario
};

module.exports = userBoardSettingsController;