// backend/src/middleware/groupAdmin.middleware.js

// --- CORREZIONE PERCORSO IMPORT ---
const pool = require('../config/db'); // Usa il pool esportato da db.js
// const { connection } = require('../db/connection'); // RIGA ERRATA RIMOSSA

async function groupAdminMiddleware(req, res, next) {
    try {
        const userId = req.user?.id;
        // Assumiamo che groupAuthMiddleware sia già stato eseguito e groupId sia valido
        const groupId = req.params.groupId;
        const userRole = req.userRole; // Dovrebbe essere già impostato da groupAuthMiddleware

        if (!userId || !groupId) {
            console.error('[groupAdminMiddleware] ID Utente o Gruppo mancanti (errore flusso middleware?).');
            return res.status(401).json({ message: 'Autorizzazione richiesta.' });
        }

        console.log(`[groupAdminMiddleware] Verifico ruolo Admin per User ${userId} nel Group ${groupId}. Ruolo attuale: ${userRole}`);

        // Possiamo usare direttamente req.userRole se groupAuthMiddleware è sempre eseguito prima
        if (userRole !== 'admin') {
            console.warn(`[groupAdminMiddleware] Accesso negato: User ${userId} non è Admin del Group ${groupId} (Ruolo: ${userRole}).`);
            return res.status(403).json({ message: 'Permesso negato: sono richiesti privilegi di amministratore.' });
        }

        // Se si preferisce riverificare dal DB (più sicuro ma ridondante se il flusso è garantito):
        /*
        const [member] = await pool.execute(
            'SELECT role FROM group_members WHERE user_id = ? AND group_id = ? AND role = "admin" AND accepted_at IS NOT NULL',
            [userId, groupId]
        );
        if (!member || member.length === 0) {
             console.warn(`[groupAdminMiddleware] Accesso negato (DB Check): User ${userId} non è Admin del Group ${groupId}.`);
            return res.status(403).json({ message: 'Permesso negato: sono richiesti privilegi di amministratore.' });
        }
        */

        console.log(`[groupAdminMiddleware] Accesso Admin consentito per User ${userId} a Group ${groupId}.`);
        next();

    } catch (error) {
        console.error('[groupAdminMiddleware] Errore server:', error);
        res.status(500).json({ message: 'Errore server durante la verifica dei permessi di amministratore.' });
    }
}

module.exports = { groupAdminMiddleware };