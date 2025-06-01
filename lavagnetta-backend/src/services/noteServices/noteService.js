// src/services/noteServices/noteService.js
const db = require('../../config/db');

/**
 * Recupera tutte le note dell'utente, includendo i nuovi campi spesa.
 * @param {number} userId - ID dell'utente.
 * @returns {Array} - Array di note.
 */
const getUserNotes = async (userId) => {
    try {
        console.log(`[noteService] Recupero note per utente ID: ${userId}`);
        // --- MODIFICA: Aggiunti nuovi campi alla SELECT ---
        const [rows] = await db.execute(
            `SELECT id, user_id, title, content, date,
                    expense_amount, location, item_count,
                    created_at, updated_at
             FROM notes
             WHERE user_id = ? ORDER BY date DESC`,
            [userId]
        );
        // Non logghiamo più l'intero risultato per potenziale volume
        // console.log(`Risultato della query: ${JSON.stringify(rows)}`);
        console.log(`[noteService] Trovate ${rows.length} note per utente ID: ${userId}`);
        return rows;
    } catch (error) {
        console.error('[noteService] Errore recupero note:', error);
        throw error;
    }
};

/**
 * Crea una nuova nota per l'utente, includendo i campi spesa opzionali.
 * @param {number} userId - ID dell'utente.
 * @param {string} title - Titolo della nota.
 * @param {string} content - Contenuto della nota.
 * @param {string} date - Data della nota (YYYY-MM-DD).
 * @param {number|null|undefined} expenseAmount - Importo spesa (opzionale).
 * @param {string|null|undefined} location - Luogo/negozio (opzionale).
 * @param {number|null|undefined} itemCount - Numero prodotti (opzionale).
 * @returns {Object} - La nota creata.
 */
const createNote = async (userId, title, content, date, expenseAmount, location, itemCount) => {
    // Gestione valori opzionali: converti undefined/vuoto in NULL per il DB
    const amount = (expenseAmount === undefined || expenseAmount === null || expenseAmount === '') ? null : parseFloat(expenseAmount);
    const loc = (location === undefined || location === null || location.trim() === '') ? null : location.trim();
    const count = (itemCount === undefined || itemCount === null || itemCount === '') ? null : parseInt(itemCount, 10);

    // Validazione aggiuntiva per i tipi numerici (se non sono null)
    if (amount !== null && isNaN(amount)) { throw new Error("Importo spesa non è un numero valido."); }
    if (count !== null && (isNaN(count) || !Number.isInteger(count) || count < 0)) { throw new Error("Numero prodotti non è un intero valido non negativo."); }

    try {
        console.log(`[noteService] Creazione nota per utente ID: ${userId}`);
        // --- MODIFICA: Aggiunti nuovi campi e placeholders all'INSERT ---
        const sql = `INSERT INTO notes
                        (user_id, title, content, date, expense_amount, location, item_count, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
        const params = [userId, title, content || null, date, amount, loc, count]; // Usa valori processati

        console.log("[noteService] Eseguo INSERT:", sql, params);
        const [result] = await db.execute(sql, params);

        const newNoteId = result.insertId;
        console.log(`[noteService] Nuova nota inserita con ID: ${newNoteId}`);

        // --- MODIFICA: Aggiunti nuovi campi alla SELECT di recupero ---
        const [rows] = await db.execute(
            `SELECT id, user_id, title, content, date,
                    expense_amount, location, item_count,
                    created_at, updated_at
             FROM notes WHERE id = ?`,
            [newNoteId]
        );

        if (rows.length === 0) { throw new Error("Impossibile recuperare la nota dopo la creazione."); }
        console.log(`[noteService] Nuova nota recuperata: ID ${rows[0].id}`);
        return rows[0];
    } catch (error) {
        console.error('[noteService] Errore creazione nota:', error);
        throw error;
    }
};

/**
 * Aggiorna una nota esistente, includendo i campi spesa opzionali.
 * @param {number} userId - ID dell'utente.
 * @param {number} noteId - ID della nota.
 * @param {string} title - Nuovo titolo.
 * @param {string} content - Nuovo contenuto.
 * @param {string} date - Nuova data (YYYY-MM-DD).
 * @param {number|null|undefined} expenseAmount - Nuovo importo spesa (opzionale).
 * @param {string|null|undefined} location - Nuovo luogo/negozio (opzionale).
 * @param {number|null|undefined} itemCount - Nuovo numero prodotti (opzionale).
 * @returns {Object|null} - Nota aggiornata o null se non trovata.
 */
const updateNote = async (userId, noteId, title, content, date, expenseAmount, location, itemCount) => {
    // Gestione valori opzionali e validazione (come in createNote)
    const amount = (expenseAmount === undefined || expenseAmount === null || expenseAmount === '') ? null : parseFloat(expenseAmount);
    const loc = (location === undefined || location === null || location.trim() === '') ? null : location.trim();
    const count = (itemCount === undefined || itemCount === null || itemCount === '') ? null : parseInt(itemCount, 10);

    if (amount !== null && isNaN(amount)) { throw new Error("Importo spesa non è un numero valido."); }
    if (count !== null && (isNaN(count) || !Number.isInteger(count) || count < 0)) { throw new Error("Numero prodotti non è un intero valido non negativo."); }

    try {
        console.log(`[noteService] Aggiornamento nota ID: ${noteId} per utente ID: ${userId}`);
        // --- MODIFICA: Aggiunti SET per i nuovi campi ---
        const sql = `UPDATE notes SET
                        title = ?,
                        content = ?,
                        date = ?,
                        expense_amount = ?,
                        location = ?,
                        item_count = ?,
                        updated_at = NOW()
                     WHERE id = ? AND user_id = ?`;
        const params = [title, content || null, date, amount, loc, count, noteId, userId]; // Usa valori processati

        console.log("[noteService] Eseguo UPDATE:", sql, params);
        const [result] = await db.execute(sql, params);

        if (result.affectedRows === 0) {
            console.log(`[noteService] Nota ${noteId} non trovata o non appartenente all'utente ${userId} per update.`);
            return null;
        }
        console.log(`[noteService] Nota ${noteId} aggiornata. Recupero dati...`);

        // --- MODIFICA: Aggiunti nuovi campi alla SELECT di recupero ---
        const [rows] = await db.execute(
            `SELECT id, user_id, title, content, date,
                    expense_amount, location, item_count,
                    created_at, updated_at
             FROM notes WHERE id = ?`,
            [noteId]
        );

        if (rows.length === 0) { throw new Error("Impossibile recuperare la nota dopo l'aggiornamento."); }
        console.log(`[noteService] Nota ${noteId} aggiornata recuperata.`);
        return rows[0];
    } catch (error) {
        console.error(`[noteService] Errore aggiornamento nota ID ${noteId}:`, error);
        throw error;
    }
};

/**
 * Elimina una nota. (INVARIATO)
 * @param {number} userId - ID dell'utente.
 * @param {number} noteId - ID della nota.
 * @returns {boolean} - True se eliminata, false altrimenti.
 */
const deleteNote = async (userId, noteId) => {
    try {
        console.log(`[noteService] Eliminazione nota ID: ${noteId} per utente ID: ${userId}`);
        const [result] = await db.execute(
            'DELETE FROM notes WHERE id = ? AND user_id = ?',
            [noteId, userId]
        );
        console.log(`[noteService] Righe eliminate: ${result.affectedRows}`);
        return result.affectedRows > 0;
    } catch (error) {
        console.error(`[noteService] Errore eliminazione nota ID ${noteId}:`, error);
        throw error;
    }
};

module.exports = {
    getUserNotes,
    createNote,
    updateNote,
    deleteNote
};