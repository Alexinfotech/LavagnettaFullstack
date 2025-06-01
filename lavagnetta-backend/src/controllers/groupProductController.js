// backend/controllers/groupProductController.js
// Assicurati che validationResult sia importato:
const { validationResult } = require('express-validator'); // <-- VERIFICATO
// Assicurati che groupProductService sia importato:
const groupProductService = require('../services/groupProductService'); // <-- VERIFICATO

const groupProductController = {

    async getGroupProducts(req, res) {
        const { groupId, boardId } = req.params;
        const userId = req.user.id;
        const userRole = req.userRole;

        console.log(`[Ctrl-GroupProd] Richiesta GET prodotti per Group ${groupId}, Board ${boardId} da User ${userId} (Ruolo: ${userRole})`);

        try {
            // Chiama il service per recuperare i prodotti
            const products = await groupProductService.getProducts(userId, parseInt(groupId), parseInt(boardId));
            res.status(200).json(products); // Invia i prodotti trovati
        } catch (error) {
            console.error('[Ctrl-GroupProd] Errore getGroupProducts:', error);
            // Controlla se è un errore "non trovato" o "non appartiene" dal service
            if (error.message.includes("non trovata") || error.message.includes("non appartiene")) {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || 'Errore recupero prodotti gruppo.' });
        }
    },

    async createGroupProduct(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { groupId, boardId } = req.params;
        const { name, is_purchased } = req.body;
        const userId = req.user.id;
        const userRole = req.userRole;

        console.log(`[Ctrl-GroupProd] Richiesta POST prodotto per Group ${groupId}, Board ${boardId} da User ${userId} (Ruolo: ${userRole})`);
        console.log('[Ctrl-GroupProd] Body:', req.body);

        try {
            // Chiama il service per creare il prodotto.
            // Assumiamo che il service restituirà l'oggetto prodotto CON actionCompletionTimestamp
            const newProduct = await groupProductService.createProduct(
                userId,
                parseInt(groupId),
                parseInt(boardId),
                userRole,
                name,
                is_purchased
            );
            // Invia l'oggetto completo (che include il timestamp) al frontend
            res.status(201).json(newProduct);
        } catch (error) {
            console.error('[Ctrl-GroupProd] Errore createGroupProduct:', error);
            if (error.message.includes("Permesso negato")) {
                return res.status(403).json({ error: error.message });
            }
            if (error.message.includes("non trovata") || error.message.includes("non appartiene")) {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || 'Errore creazione prodotto gruppo.' });
        }
    },

    async updateGroupProduct(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { groupId, boardId, productId } = req.params;
        const { name, is_purchased } = req.body;
        const userId = req.user.id;
        const userRole = req.userRole;

        console.log(`[Ctrl-GroupProd] Richiesta PUT prodotto ${productId} per Group ${groupId}, Board ${boardId} da User ${userId} (Ruolo: ${userRole})`);
        console.log('[Ctrl-GroupProd] Body:', req.body);

        try {
            // Chiama il service per aggiornare il prodotto.
            // Assumiamo che il service restituirà l'oggetto prodotto CON actionCompletionTimestamp
            const updatedProduct = await groupProductService.updateProduct(
                userId,
                parseInt(groupId),
                parseInt(boardId),
                parseInt(productId),
                userRole,
                name,
                is_purchased
            );
            // Invia l'oggetto completo (che include il timestamp) al frontend
            res.status(200).json(updatedProduct);
        } catch (error) {
            console.error('[Ctrl-GroupProd] Errore updateGroupProduct:', error);
            if (error.message.includes("Permesso negato")) {
                return res.status(403).json({ error: error.message });
            }
            if (error.message.includes("non trovato")) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes("non appartiene")) { // Errore da _validateBoardInGroup
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || 'Errore aggiornamento prodotto gruppo.' });
        }
    },

    // FUNZIONE deleteGroupProduct (Esistente nel codice fornito, mantenuta)
    async deleteGroupProduct(req, res) {
        const { groupId, boardId, productId } = req.params;
        const userId = req.user.id;
        const userRole = req.userRole;

        console.log(`[Ctrl-GroupProd] Richiesta DELETE prodotto ${productId} per Group ${groupId}, Board ${boardId} da User ${userId} (Ruolo: ${userRole})`);

        try {
            // Chiama il service per eliminare il prodotto.
            // Assumiamo che il service restituisca { success: true, actionCompletionTimestamp: ... }
            const result = await groupProductService.deleteProduct(
                userId,
                parseInt(groupId),
                parseInt(boardId),
                parseInt(productId),
                userRole
            );
            // Invia una risposta JSON che include il timestamp ricevuto dal service
            res.status(200).json({
                message: 'Prodotto eliminato con successo.',
                actionCompletionTimestamp: result.actionCompletionTimestamp // <<<--- TIMESTAMP INCLUSO NELLA RISPOSTA
            });
        } catch (error) {
            console.error('[Ctrl-GroupProd] Errore deleteGroupProduct:', error);
            // Gestione errori invariata
            if (error.message.includes("Permesso negato")) {
                return res.status(403).json({ error: error.message });
            }
            if (error.message.includes("non trovato")) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes("non appartiene")) {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || 'Errore eliminazione prodotto gruppo.' });
        }
    }, // <--- Aggiungi la virgola qui se questo non è l'ultimo metodo prima dell'aggiunta

    // --- NUOVO METODO PER AGGIUNTA BATCH --- <-- AGGIUNTA QUI
    async createMultipleGroupProducts(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { groupId, boardId } = req.params;
        const { names } = req.body; // Array di nomi validato
        const userId = req.user.id; // Da authMiddleware
        const userRole = req.userRole; // Da groupAuthMiddleware

        console.log(`[Ctrl-GroupProd Batch] Richiesta POST batch (${names.length} nomi) per G:${groupId}, B:${boardId} da U:${userId} (Ruolo:${userRole})`);

        try {
            // Chiama il nuovo metodo nel service
            const result = await groupProductService.createMultipleProducts(
                userId,
                parseInt(groupId),
                parseInt(boardId),
                userRole,
                names
            );

            // Risposta di successo
            res.status(201).json({
                message: `Aggiunti ${result.addedCount} prodotti su ${names.length} richiesti.`,
                addedCount: result.addedCount,
                skippedCount: names.length - result.addedCount, // Calcolato qui per convenienza
                actionCompletionTimestamp: result.actionCompletionTimestamp
            });
        } catch (error) {
            console.error('[Ctrl-GroupProd Batch] Errore:', error);
            if (error.message.includes("Permesso negato")) return res.status(403).json({ error: error.message });
            if (error.message.includes("non trovata") || error.message.includes("non appartiene") || error.message.includes("non validi")) return res.status(404).json({ error: error.message }); // Gestione 404/400 dal service
            if (error.message.includes("Array 'names' richiesto") || error.message.includes("Nessun nome prodotto valido")) return res.status(400).json({ error: error.message }); // Gestione 400 dal service
            res.status(500).json({ error: error.message || 'Errore aggiunta batch prodotti.' });
        }
    }
    // --- FINE NUOVO METODO ---

}; // Fine oggetto groupProductController

module.exports = groupProductController;