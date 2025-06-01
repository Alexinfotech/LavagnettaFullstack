// backend/src/middleware/groupAuth.middleware.js

// --- CORREZIONE PERCORSO IMPORT ---
const pool = require('../config/db'); // Usa il pool esportato da db.js
// const { connection } = require('../db/connection'); // RIGA ERRATA RIMOSSA

async function groupAuthMiddleware(req, res, next) {
    try {
        const userId = req.user?.id;
        const groupId = req.params.groupId; // Assumi che groupId sia sempre nei params per questo middleware

        // Aggiungi un controllo per assicurarti che groupId sia un numero valido
        if (!groupId || isNaN(parseInt(groupId))) {
            console.error('[groupAuthMiddleware] ID Gruppo mancante o non valido nei parametri URL.');
            return res.status(400).json({ message: 'ID Gruppo non valido.' });
        }

        if (!userId) {
            // Questo non dovrebbe accadere se authenticate è eseguito prima, ma è un controllo di sicurezza
            console.error('[groupAuthMiddleware] User ID mancante nella richiesta (authenticate fallito?).');
            return res.status(401).json({ message: 'Utente non autenticato.' });
        }

        console.log(`[groupAuthMiddleware] Verifico appartenenza User ${userId} a Group ${groupId}`);

        // Usa il pool per eseguire la query
        const [memberRows] = await pool.execute(
            'SELECT role FROM group_members WHERE user_id = ? AND group_id = ? AND accepted_at IS NOT NULL',
            [userId, groupId]
        );

        if (memberRows.length === 0) {
            console.warn(`[groupAuthMiddleware] Accesso negato: User ${userId} non è membro accettato del Group ${groupId}.`);
            return res.status(403).json({ message: 'Accesso negato: non sei membro di questo gruppo.' });
        }

        const member = memberRows[0];
        req.userRole = member.role; // Aggiunge il ruolo alla richiesta per i controller successivi
        console.log(`[groupAuthMiddleware] Accesso consentito per User ${userId} a Group ${groupId} con ruolo: ${req.userRole}`);
        next();

    } catch (error) {
        console.error('[groupAuthMiddleware] Errore server:', error);
        res.status(500).json({ message: 'Errore server durante la verifica dei permessi del gruppo.' });
    }
}

module.exports = { groupAuthMiddleware };