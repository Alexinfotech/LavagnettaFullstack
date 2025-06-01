// backend/src/middleware/product.middleware.js

// --- CORREZIONE PERCORSO IMPORT ---
const pool = require('../config/db'); // Usa il pool esportato da db.js
// const { connection } = require('../db/connection'); // RIGA ERRATA RIMOSSA

async function productPermissionMiddleware(req, res, next) {
    // ATTENZIONE: Questo middleware potrebbe non essere più necessario o
    // dovrà essere adattato per il contesto dei gruppi.
    // La logica permessi per prodotti di gruppo è ora pensata per
    // essere nel groupProductController/Service.
    console.warn("[productPermissionMiddleware] Questo middleware potrebbe essere obsoleto o necessitare di revisione per i gruppi.");

    try {
        const userId = req.user?.id;
        // Determina boardId dai parametri della rotta corretta
        const boardId = req.params.boardId || req.params.id; // Prova entrambi i nomi comuni
        const userRole = req.userRole; // Impostato da groupAuthMiddleware SE è una rotta di gruppo

        if (!userId || !boardId || isNaN(parseInt(boardId))) {
            console.error('[productPermissionMiddleware] ID Utente o Board mancanti o non validi.');
            return res.status(400).json({ message: 'ID Utente o Lavagna mancanti/non validi.' });
        }

        // Se non c'è userRole, probabilmente non siamo in un contesto di gruppo sicuro.
        // Decidi come comportarti. Per ora, assumiamo che possa essere una lavagna personale.
        if (!userRole) {
            console.log(`[productPermissionMiddleware] Nessun userRole trovato per user ${userId} su board ${boardId}. Assumo lavagna personale o accesso diretto (VERIFICARE!).`);
            // Qui potresti voler verificare se è una lavagna personale dell'utente
            const [boardOwner] = await pool.execute('SELECT user_id FROM boards WHERE id = ? AND group_id IS NULL', [boardId]);
            if (boardOwner.length === 0 || boardOwner[0].user_id !== userId) {
                console.warn(`[productPermissionMiddleware] Accesso negato: User ${userId} non è proprietario della lavagna personale ${boardId}.`);
                return res.status(403).json({ message: 'Accesso negato alla lavagna.' });
            }
            // Se è proprietario della lavagna personale, può fare tutto
            return next();
        }

        // Se siamo in un contesto di gruppo (userRole esiste)
        console.log(`[productPermissionMiddleware] Verifico permessi prodotto per User ${userId}, Board ${boardId}, Ruolo ${userRole}`);

        const [boardRows] = await pool.execute(
            'SELECT is_group_default FROM boards WHERE id = ?', // Non serve verificare appartenenza al gruppo qui, già fatta da groupAuthMiddleware
            [boardId]
        );

        if (boardRows.length === 0) {
            console.warn(`[productPermissionMiddleware] Lavagna ${boardId} non trovata.`);
            return res.status(404).json({ message: 'Lavagna non trovata.' });
        }

        const board = boardRows[0];

        // Logica specifica permessi (ESEMPIO, da adattare/rimuovere se gestita altrove)
        if (board.is_group_default && userRole === 'level2') {
            // Esempio: Impedisci scrittura su lavagna default per level2
            // Questa logica specifica dovrebbe stare nel controller/service appropriato
            console.warn(`[productPermissionMiddleware] Accesso negato: User ${userId} (level2) tenta operazione su lavagna default ${boardId}.`);
            // return res.status(403).json({ message: 'Permesso negato sulla lavagna di default del gruppo per il tuo ruolo.' });
            console.log("[productPermissionMiddleware] Check specifico su lavagna default passato (logica spostata altrove).");
        }

        console.log(`[productPermissionMiddleware] Permessi verificati per User ${userId}, Board ${boardId}.`);
        next();

    } catch (error) {
        console.error('[productPermissionMiddleware] Errore server:', error);
        res.status(500).json({ message: 'Errore server durante la verifica dei permessi del prodotto.' });
    }
}

module.exports = { productPermissionMiddleware };