// backend/models/boardModel.js

const pool = require('../config/db');

class BoardModel {

    /**
     * Recupera tutte le lavagnette PERSONALI di un utente, ciascuna con TUTTI i suoi prodotti
     * E CON LO SFONDO PERSONALIZZATO DALL'UTENTE (se impostato).
     * @param {number} userId - ID dell'utente proprietario.
     * @returns {Promise<Array>} - Array di lavagnette personali con prodotti e userBackground.
     */
    async getPersonalBoardsWithProductsByUserId(userId) {
        console.log(`[Model] getPersonalBoardsWithProductsByUserId: Fetching for user ${userId}`);
        // 1. Recupera tutte le lavagne personali dell'utente
        // Seleziona esplicitamente i campi da boards per chiarezza e per evitare conflitti di nomi (es. 'background')
        const [boards] = await pool.execute(
            `SELECT
                b.id, b.user_id, b.name, b.background, b.is_default,
                b.group_id, b.is_group_default, b.created_at, b.updated_at
             FROM boards b
             WHERE b.user_id = ? AND b.group_id IS NULL
             ORDER BY b.is_default DESC, b.name ASC`, // Ordina per default, poi per nome
            [userId]
        );

        if (boards.length === 0) {
            console.log(`[Model] getPersonalBoardsWithProductsByUserId: No personal boards found for user ${userId}`);
            return []; // Nessuna lavagna personale trovata
        }
        console.log(`[Model] getPersonalBoardsWithProductsByUserId: Found ${boards.length} personal boards for user ${userId}`);

        const boardIds = boards.map(b => b.id);
        // Crea placeholders sicuri per la clausola IN
        const placeholders = boardIds.length > 0 ? boardIds.map(() => '?').join(',') : 'NULL'; // Evita IN () vuoto

        // 2. Recupera TUTTI i prodotti per quelle lavagne
        let products = [];
        if (boardIds.length > 0) {
            console.log(`[Model] getPersonalBoardsWithProductsByUserId: Fetching products for boards: ${boardIds.join(', ')}`);
            const productQuery = `
                SELECT id, board_id, name, is_purchased
                FROM products
                WHERE board_id IN (${placeholders})
                ORDER BY board_id, created_at ASC`; // Ordina per board e poi per data creazione
            [products] = await pool.execute(productQuery, [...boardIds]);
            console.log(`[Model] getPersonalBoardsWithProductsByUserId: Found ${products.length} products total.`);
        }

        // ---> MODIFICA CHIAVE: 3. Recupera gli sfondi personalizzati per queste lavagne e questo utente <---
        let userBackgrounds = new Map(); // Usiamo una Map per efficienza { boardId => userBackground }
        if (boardIds.length > 0) {
            console.log(`[Model] getPersonalBoardsWithProductsByUserId: Fetching user settings for boards: ${boardIds.join(', ')} and user ${userId}`);
            const settingsQuery = `
                SELECT board_id, background
                FROM user_board_settings
                WHERE user_id = ? AND board_id IN (${placeholders})`;
            try {
                const [settingsRows] = await pool.execute(settingsQuery, [userId, ...boardIds]);
                // Popola la Map
                settingsRows.forEach(setting => {
                    userBackgrounds.set(setting.board_id, setting.background);
                });
                console.log(`[Model] getPersonalBoardsWithProductsByUserId: User Backgrounds Map for User ${userId}:`, userBackgrounds);
            } catch (settingsError) {
                // Logga l'errore ma non bloccare tutto se la tabella settings dà problemi
                console.error(`[Model] Errore durante il recupero degli sfondi personalizzati (ignoro per ora):`, settingsError);
            }
        }
        // ---> FINE MODIFICA CHIAVE <---

        // 4. Mappa prodotti E SFONDI PERSONALIZZATI alle rispettive lavagne
        const finalBoards = boards.map(board => {
            // ---> MODIFICA CHIAVE: Ottieni userBackground dalla Map <---
            const userBg = userBackgrounds.get(board.id) || null; // Prendi da Map o null
            // ---> FINE MODIFICA CHIAVE <---

            const boardProducts = products
                .filter(p => p.board_id === board.id)
                .map(p => ({ ...p, is_purchased: !!p.is_purchased })); // Assicura boolean

            console.log(`[Model] Mapping Board ID: ${board.id}, Name: ${board.name}, Default BG: ${board.background}, User BG: ${userBg}, Products: ${boardProducts.length}`);

            return {
                ...board, // Include tutti i campi da 'boards' (id, name, background, is_default, etc.)
                is_default: !!board.is_default, // Assicura boolean
                is_group_default: !!board.is_group_default, // Assicura boolean (qui sarà false)
                // ---> MODIFICA CHIAVE: Aggiungi la proprietà userBackground <---
                userBackground: userBg,
                // ---> FINE MODIFICA CHIAVE <---
                products: boardProducts
            };
        });

        console.log(`[Model] getPersonalBoardsWithProductsByUserId: Returning ${finalBoards.length} processed boards for user ${userId}.`);
        return finalBoards;
    }

    // --- METODI ESISTENTI (getBoardByIdWithProducts, getBoardDetails, createBoard, etc.) ---
    // Lascia gli altri metodi come sono, specialmente getBoardByIdWithProducts che non
    // ha bisogno di recuperare userBackground qui perché viene fatto nel controller.

    async getBoardByIdWithProducts(userId, boardId) {
        // Funzione invariata - userBackground viene aggiunto dal controller getBoardById
        console.log(`[Model] getBoardByIdWithProducts: Fetching personal board ${boardId} for user ${userId}`);
        const [rows] = await pool.execute(
            'SELECT * FROM boards WHERE id = ? AND user_id = ? AND group_id IS NULL',
            [boardId, userId]
        );
        if (rows.length === 0) {
            console.log(`[Model] getBoardByIdWithProducts: Board ${boardId} not found or not personal for user ${userId}.`);
            return null;
        }
        const board = rows[0];
        board.is_default = !!board.is_default;
        board.is_group_default = !!board.is_group_default;

        console.log(`[Model] getBoardByIdWithProducts: Fetching products for board ${board.id}`);
        const [products] = await pool.execute(
            'SELECT * FROM products WHERE board_id = ? ORDER BY created_at ASC', [board.id]
        );
        console.log(`[Model] getBoardByIdWithProducts: Found ${products.length} products for board ${board.id}.`);
        return { ...board, products: products.map(p => ({ ...p, is_purchased: !!p.is_purchased })) };
    }

    async getBoardDetails(boardId, conn = null) {
        // Funzione interna, invariata
        const connection = conn || pool;
        const [rows] = await connection.execute(
            'SELECT id, user_id, group_id, is_default, is_group_default FROM boards WHERE id = ?', [boardId]
        );
        return rows[0] || null;
    }

    async createBoard(userId, name, background, groupId = null, isGroupDefault = false, conn = null) {
        // Funzione quasi invariata, ma restituisce un oggetto più completo alla fine
        const connection = conn || await pool.getConnection(); // Usa await se non passi conn
        let localConnection = !conn; // Determina se dobbiamo gestire la connessione qui
        if (localConnection) await connection.beginTransaction();

        try {
            let isPersonalDefault = false;
            if (groupId === null) {
                isGroupDefault = false;
                const [existingPersonalBoards] = await connection.execute(
                    'SELECT id FROM boards WHERE user_id = ? AND group_id IS NULL', [userId]
                );
                if (existingPersonalBoards.length === 0) isPersonalDefault = true;
            } else if (isGroupDefault && groupId) {
                const [existingGroupDefault] = await connection.execute(
                    'SELECT id FROM boards WHERE group_id = ? AND is_group_default = 1', [groupId]
                );
                if (existingGroupDefault.length > 0) {
                    console.warn(`Tentativo di creare una seconda lavagna default per gruppo ${groupId}. Ignorato.`);
                    isGroupDefault = false;
                }
            }
            const [result] = await connection.execute(
                `INSERT INTO boards (user_id, name, background, group_id, is_default, is_group_default, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [userId, name, background, groupId, isPersonalDefault ? 1 : 0, isGroupDefault ? 1 : 0]
            );
            const newBoardId = result.insertId;
            const [newBoardDataRows] = await connection.execute('SELECT * FROM boards WHERE id = ?', [newBoardId]);

            if (localConnection) await connection.commit(); // Commit solo se abbiamo iniziato la TX qui

            const finalBoard = newBoardDataRows[0];
            // Arricchisci l'oggetto restituito per coerenza con getPersonalBoards...
            finalBoard.is_default = !!finalBoard.is_default;
            finalBoard.is_group_default = !!finalBoard.is_group_default;
            finalBoard.userBackground = null; // Appena creata, non ha sfondo personalizzato
            finalBoard.products = [];       // Appena creata, non ha prodotti
            return finalBoard;

        } catch (error) {
            if (localConnection) await connection.rollback(); // Rollback solo se abbiamo iniziato la TX qui
            console.error("[Model] Errore in createBoard:", error);
            throw error; // Rilancia l'errore
        } finally {
            if (localConnection && connection) connection.release(); // Rilascia solo se l'abbiamo ottenuta qui
        }
    }


    async updatePersonalBoard(userId, boardId, fieldsToUpdate) {
        // Funzione invariata nella logica di update, ma recupera i dati aggiornati CON userBackground alla fine
        console.log(`[Model] Inizio updatePersonalBoard per board ${boardId}, user ${userId}`);
        console.log('[Model] Campi da aggiornare:', fieldsToUpdate);

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const boardDetails = await this.getBoardDetails(boardId, conn);
            if (!boardDetails) { throw new Error(`Update fallito: Board ${boardId} non trovata.`); }
            if (boardDetails.user_id !== userId) { throw new Error(`Update fallito: Board ${boardId} non appartiene a user ${userId}.`); }
            if (boardDetails.group_id !== null) { throw new Error(`Update fallito: Board ${boardId} è una lavagna di gruppo.`); }

            const fields = [];
            const values = [];
            let needsDefaultHandling = false;
            let newDefaultValue = 0;

            if (fieldsToUpdate.name !== undefined) { /* ... aggiungi name ... */ fields.push('name = ?'); values.push(fieldsToUpdate.name.trim()); }
            if (fieldsToUpdate.background !== undefined) { /* ... aggiungi background ... */ fields.push('background = ?'); values.push(fieldsToUpdate.background); }
            if (fieldsToUpdate.is_default !== undefined && typeof fieldsToUpdate.is_default === 'boolean') {
                needsDefaultHandling = true;
                newDefaultValue = fieldsToUpdate.is_default ? 1 : 0;
            }

            if (fields.length === 0 && !needsDefaultHandling) {
                console.warn(`[Model] Nessun campo valido da aggiornare per board ${boardId}.`);
                await conn.rollback();
                // Recupera comunque i dati completi attuali usando la funzione corretta
                const currentBoards = await this.getPersonalBoardsWithProductsByUserId(userId);
                return currentBoards.find(b => b.id === boardId) || null;
            }

            if (needsDefaultHandling) {
                if (newDefaultValue === 1) {
                    await conn.execute('UPDATE boards SET is_default = 0 WHERE user_id = ? AND group_id IS NULL AND id != ?', [userId, boardId]);
                }
                fields.push('is_default = ?');
                values.push(newDefaultValue);
            }

            fields.push('updated_at = NOW()');
            values.push(boardId);
            values.push(userId);

            const sqlQuery = `UPDATE boards SET ${fields.join(', ')} WHERE id = ? AND user_id = ? AND group_id IS NULL`;
            const [result] = await conn.execute(sqlQuery, values);

            if (result.affectedRows === 0 && fields.length > 0) {
                const checkExists = await this.getBoardDetails(boardId, conn);
                if (!checkExists || checkExists.user_id !== userId || checkExists.group_id !== null) {
                    throw new Error(`Update query affected 0 rows: Board ${boardId} non trovata o non personale.`);
                } else { console.warn(`[Model] Update query affected 0 rows for board ${boardId}. Data might be identical.`); }
            }

            await conn.commit();
            console.log(`[Model] Board ${boardId} aggiornata con successo. Recupero dati aggiornati...`);

            // Recupera i dati aggiornati usando la funzione che include userBackground e products
            const updatedBoards = await this.getPersonalBoardsWithProductsByUserId(userId); // Usa la funzione corretta
            return updatedBoards.find(b => b.id === boardId) || null;

        } catch (sqlError) {
            await conn.rollback();
            console.error(`[Model] Errore SQL durante l'update della board ${boardId}:`, sqlError);
            throw sqlError;
        } finally {
            conn.release();
        }
    }


    async deletePersonalBoard(userId, boardId) {
        // Funzione invariata
        const boardDetails = await this.getBoardDetails(boardId, pool);
        if (!boardDetails || boardDetails.user_id !== userId || boardDetails.group_id !== null) {
            console.error(`[Model] Delete failed: Board ${boardId} not found, not personal or not owned by user ${userId}.`);
            return false;
        }
        if (boardDetails.is_default === 1) {
            throw new Error('La lavagna personale di default non può essere eliminata.');
        }
        const [result] = await pool.execute(
            'DELETE FROM boards WHERE id = ? AND user_id = ? AND group_id IS NULL',
            [boardId, userId]
        );
        return result.affectedRows > 0;
    }

    async updateGroupBoardDetails(boardId, fieldsToUpdate, conn = null) {
        // Funzione invariata
        const connection = conn || pool;
        const fields = [];
        const values = [];
        if (fieldsToUpdate.name !== undefined) { fields.push('name = ?'); values.push(fieldsToUpdate.name); }
        if (fieldsToUpdate.background !== undefined) { fields.push('background = ?'); values.push(fieldsToUpdate.background); }
        if (fields.length === 0) return await this.getBoardDetails(boardId, connection);
        fields.push('updated_at = NOW()');
        values.push(boardId);
        const [result] = await connection.execute(
            `UPDATE boards SET ${fields.join(', ')} WHERE id = ? AND group_id IS NOT NULL`, values
        );
        if (result.affectedRows === 0) return null;
        const updatedDetails = await this.getBoardDetails(boardId, connection);
        if (updatedDetails) {
            updatedDetails.userBackground = null; // Non recuperato qui
            updatedDetails.products = []; // Non recuperato qui
        }
        return updatedDetails;
    }

    async deleteGroupBoard(boardId, conn = null) {
        // Funzione invariata
        const connection = conn || pool;
        const boardDetails = await this.getBoardDetails(boardId, connection);
        if (!boardDetails || boardDetails.group_id === null) return false;
        if (boardDetails.is_group_default === 1) throw new Error('La lavagna di default del gruppo non può essere eliminata.');
        const [result] = await connection.execute('DELETE FROM boards WHERE id = ?', [boardId]);
        return result.affectedRows > 0;
    }

}

module.exports = new BoardModel();