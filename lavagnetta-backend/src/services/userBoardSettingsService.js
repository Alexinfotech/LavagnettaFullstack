// backend/services/userBoardSettingsService.js
const pool = require('../config/db');
const boardModel = require('../models/boardModel');

class UserBoardSettingsService {

    /**
     * Recupera lo sfondo personalizzato di un utente per una specifica lavagna.
     * @param {number} userId - ID dell'utente.
     * @param {number} boardId - ID della lavagna.
     * @param {object|null} conn - Connessione DB opzionale.
     * @returns {Promise<string|null>} - Il nome del file di sfondo o null se non impostato/trovato.
     */
    async getUserBackgroundForBoard(userId, boardId, conn = null) {
        const connection = conn || pool;
        console.log(`[Service-UBS] getUserBackgroundForBoard: User ${userId}, Board ${boardId}`);
        try {
            // La query SELECT è corretta perché 'background' esiste
            const [rows] = await connection.execute(
                'SELECT background FROM user_board_settings WHERE user_id = ? AND board_id = ?',
                [userId, boardId]
            );
            return rows[0]?.background || null;
        } catch (error) {
            console.error(`[Service-UBS] Errore in getUserBackgroundForBoard (User ${userId}, Board ${boardId}):`, error);
            return null;
        }
    }

    /**
     * Imposta o aggiorna lo sfondo personalizzato di un utente per una lavagna.
     * @param {number} userId - ID dell'utente.
     * @param {number} boardId - ID della lavagna.
     * @param {string} background - Nuovo nome del file di sfondo.
     * @returns {Promise<object>} - L'impostazione aggiornata/creata.
     * @throws {Error} Se la lavagna non esiste, lo sfondo non è valido, o errore DB.
     */
    async setUserBackgroundForBoard(userId, boardId, background) {
        console.log(`[Service-UBS] setUserBackgroundForBoard: User ${userId}, Board ${boardId}, Background: ${background}`);

        if (typeof background !== 'string' || background.trim() === '') {
            throw new Error("Valore dello sfondo non valido fornito.");
        }
        const trimmedBackground = background.trim();

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Verifica esistenza board (invariato)
            const boardExists = await boardModel.getBoardDetails(boardId, conn);
            if (!boardExists) {
                throw new Error(`Lavagna con ID ${boardId} non trovata.`);
            }

            // 2. Query UPSERT MODIFICATA: Rimuove created_at e updated_at
            //    MySQL gestirà automaticamente l'aggiornamento di `updated_at` se la colonna
            //    ha l'attributo ON UPDATE CURRENT_TIMESTAMP (che però sembra mancare nel tuo caso)
            //    e `created_at` non verrà impostato se la colonna non esiste.
            //    Assumiamo che la tabella abbia solo id, user_id, board_id, background.
            const query = `
                INSERT INTO user_board_settings (user_id, board_id, background)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    background = VALUES(background)
            `;
            //    NOTA: Se la tua tabella user_board_settings AVESSE una colonna updated_at
            //    con ON UPDATE CURRENT_TIMESTAMP, basterebbe questa query.
            //    Se NON ha updated_at o non ha l'auto-update, lo sfondo verrà aggiornato
            //    ma non ci sarà traccia dell'ora dell'aggiornamento.

            const [result] = await conn.execute(query, [userId, boardId, trimmedBackground]);
            console.log(`[Service-UBS] setUserBackgroundForBoard: Risultato upsert:`, result);

            // 3. Recupera l'impostazione (query SELECT invariata)
            const [settingRows] = await conn.execute(
                // Seleziona solo i campi che esistono nella tua tabella
                'SELECT id, user_id, board_id, background FROM user_board_settings WHERE user_id = ? AND board_id = ?',
                [userId, boardId]
            );

            await conn.commit();
            console.log(`[Service-UBS] setUserBackgroundForBoard: TX commit per User ${userId}, Board ${boardId}.`);

            if (settingRows.length > 0) {
                return settingRows[0];
            } else {
                throw new Error("Errore critico: impossibile recuperare l'impostazione dopo l'aggiornamento.");
            }

        } catch (error) {
            await conn.rollback();
            console.error(`[Service-UBS] Errore in setUserBackgroundForBoard (User ${userId}, Board ${boardId}):`, error);
            throw error;
        } finally {
            conn.release();
        }
    }
}

module.exports = new UserBoardSettingsService();