// backend/controllers/boardController.js
const boardModel = require('../models/boardModel');
const productController = require('./productController'); // Per le rotte dei prodotti
const userBoardSettingsService = require('../services/userBoardSettingsService');

/**
 * Ottiene SOLO le lavagnette personali dell'utente autenticato, CON TUTTI i prodotti.
 * Rimuove il limite sui prodotti e la logica del query parameter 'productLimit'.
 */
exports.getPersonalBoards = async (req, res) => {
    try {
        const userId = req.user.id;
        // Rimuove la logica del productLimit dalla richiesta
        console.log(`[Ctrl-Board] getPersonalBoards: Fetching for user ${userId} (no product limit)`);
        // Chiama il modello senza passare il limite
        const personalBoards = await boardModel.getPersonalBoardsWithProductsByUserId(userId);
        // Ordina mettendo la default per prima (invariato)
        personalBoards.sort((a, b) => (b.is_default || 0) - (a.is_default || 0));
        res.status(200).json(personalBoards);
    } catch (error) {
        console.error('[Ctrl-Board] Errore getPersonalBoards:', error);
        res.status(500).json({ error: 'Errore server nel recuperare le lavagnette personali.' });
    }
};

// --- METODI INVARIATI (getBoardById, createPersonalBoard, etc.) ---

exports.getBoardById = async (req, res) => {
    try {
        const userId = req.user.id;
        const boardId = parseInt(req.params.id);
        if (isNaN(boardId) || boardId <= 0) {
            return res.status(400).json({ error: 'ID lavagna non valido.' });
        }
        console.log(`[Ctrl-Board] getBoardById: Fetching personal board ${boardId} for user ${userId}`);

        // 1. Ottieni dati base lavagna + tutti i prodotti (verifica ownership e che sia personale)
        const board = await boardModel.getBoardByIdWithProducts(userId, boardId);

        if (board) {
            // 2. Ottieni lo sfondo personalizzato per questo utente e questa lavagna
            const userBackground = await userBoardSettingsService.getUserBackgroundForBoard(userId, boardId);
            console.log(`[Ctrl-Board] getBoardById: User background for board ${boardId}: ${userBackground}`);

            // 3. Aggiungi lo sfondo personalizzato (o null) alla risposta
            board.userBackground = userBackground;

            console.log(`[Ctrl-Board] getBoardById: Restituisco board ${boardId} con bg: ${board.background}, userBg: ${board.userBackground}`);
            res.status(200).json(board);
        } else {
            // boardModel.getBoardByIdWithProducts restituisce null se non trovata, non personale o non dell'utente
            res.status(404).json({ error: 'Lavagnetta personale non trovata o accesso non consentito.' });
        }
    } catch (error) {
        console.error(`[Ctrl-Board] Errore getBoardById ${req.params.id}:`, error);
        res.status(500).json({ error: 'Errore server nel recuperare la lavagnetta.' });
    }
};

exports.createPersonalBoard = async (req, res) => {
    const { name, background } = req.body;
    const userId = req.user.id;
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Il nome della lavagnetta è richiesto.' });
    }
    try {
        console.log(`[Ctrl-Board] createPersonalBoard: Creating board "${name}" for user ${userId}`);
        // Il modello gestisce la logica di is_default
        const newBoard = await boardModel.createBoard(
            userId,
            name.trim(),
            background || 'default-background.jpg', // Sfondo di default per personali
            null, // groupId = null
            false // isGroupDefault = false (non applicabile a personali)
        );
        res.status(201).json(newBoard); // Restituisce la lavagna creata (dettagli base)
    } catch (error) {
        console.error('[Ctrl-Board] Errore createPersonalBoard:', error);
        res.status(500).json({ error: 'Errore server nella creazione della lavagnetta.' });
    }
};

exports.updatePersonalBoard = async (req, res) => {
    const { name, background, is_default } = req.body;
    const userId = req.user.id;
    const boardId = parseInt(req.params.id);

    console.log(`[Ctrl-Board] updatePersonalBoard: Ricevuta richiesta PUT /boards/${boardId} da user ${userId}`);
    console.log('[Ctrl-Board] updatePersonalBoard: Body ricevuto:', req.body);

    if (isNaN(boardId) || boardId <= 0) {
        console.error(`[Ctrl-Board] updatePersonalBoard: ID lavagna non valido: ${req.params.id}`);
        return res.status(400).json({ error: 'ID lavagna non valido.' });
    }

    const fieldsToUpdate = {};
    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Il nome della lavagnetta non può essere vuoto.' });
        }
        fieldsToUpdate.name = name.trim();
    }
    if (background !== undefined) {
        if (typeof background !== 'string') {
            return res.status(400).json({ error: 'Lo sfondo deve essere una stringa.' });
        }
        fieldsToUpdate.background = background;
    }
    if (is_default !== undefined) {
        fieldsToUpdate.is_default = Boolean(is_default);
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        console.warn(`[Ctrl-Board] updatePersonalBoard: Nessun campo valido fornito per update board ${boardId}`);
        return res.status(400).json({ error: 'Nessun campo valido fornito per l\'aggiornamento (name, background, is_default).' });
    }

    try {
        console.log(`[Ctrl-Board] updatePersonalBoard: Tentativo di aggiornare board ${boardId} per user ${userId} con dati:`, fieldsToUpdate);
        const updatedBoard = await boardModel.updatePersonalBoard(userId, boardId, fieldsToUpdate);

        if (updatedBoard) {
            console.log(`[Ctrl-Board] updatePersonalBoard: Board ${boardId} aggiornata con successo.`);
            res.status(200).json(updatedBoard);
        } else {
            console.warn(`[Ctrl-Board] updatePersonalBoard: Aggiornamento fallito: Board ${boardId} non trovata o non personale per user ${userId}`);
            res.status(404).json({ error: 'Lavagnetta personale non trovata o aggiornamento non consentito.' });
        }
    } catch (error) {
        console.error(`[Ctrl-Board] Errore CRITICO nell'aggiornamento della lavagnetta personale ${boardId}:`, error);
        res.status(500).json({ error: 'Errore server nell\'aggiornamento della lavagnetta personale.', details: error.message });
    }
};

exports.deletePersonalBoard = async (req, res) => {
    const userId = req.user.id;
    const boardId = parseInt(req.params.id);
    if (isNaN(boardId) || boardId <= 0) {
        return res.status(400).json({ error: 'ID lavagna non valido.' });
    }
    try {
        console.log(`[Ctrl-Board] deletePersonalBoard: Attempting delete board ${boardId} for user ${userId}`);
        const result = await boardModel.deletePersonalBoard(userId, boardId);
        if (result) {
            res.status(200).json({ message: 'Lavagnetta personale eliminata con successo.' });
        } else {
            res.status(404).json({ error: 'Lavagnetta personale non trovata o eliminazione non consentita.' });
        }
    } catch (error) {
        console.error(`[Ctrl-Board] Errore deletePersonalBoard ${boardId}:`, error);
        if (error.message === 'La lavagna personale di default non può essere eliminata.') {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: 'Errore server nell\'eliminazione della lavagnetta personale.' });
    }
};

// Rotte Prodotti (delegati a productController) - Rimangono invariate
exports.getProducts = productController.getProducts;
exports.createProduct = productController.createProduct;
exports.updateProduct = productController.updateProduct;
exports.deleteProduct = productController.deleteProduct;
//FUNZIOANTE 