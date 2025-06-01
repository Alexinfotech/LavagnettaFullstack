// backend/services/groupProductService.js
// Assicurati che pool e boardModel siano importati correttamente:
const pool = require('../config/db'); // <-- VERIFICATO
const boardModel = require('../models/boardModel'); // <-- VERIFICATO

class GroupProductService {

    /**
     * Funzione helper per aggiornare il timestamp updated_at della lavagna padre
     * E RESTITUIRE il nuovo timestamp in millisecondi UTC.
     * (Esistente nel codice fornito, mantenuta)
     * @param {number} boardId - ID della lavagna da "toccare".
     * @param {object} conn - Connessione DB attiva.
     * @returns {Promise<number|null>} - Timestamp in ms UTC o null se errore/non aggiornato.
     */
    async _touchBoardAndGetTimestamp(boardId, conn) {
        const numericBoardId = parseInt(boardId);
        if (!conn || isNaN(numericBoardId) || numericBoardId <= 0) {
            console.warn(`[Service-GroupProd] _touchBoardAndGetTimestamp: Connessione o ID non validi. BoardID: ${boardId}`);
            return null;
        }
        try {
            // Esegui l'update
            const touchBoardQuery = 'UPDATE boards SET updated_at = NOW() WHERE id = ?';
            const [result] = await conn.execute(touchBoardQuery, [numericBoardId]);

            // Indipendentemente se ha aggiornato o meno (potrebbe essere stato toccato da un'altra richiesta quasi contemporaneamente),
            // recupera il timestamp attuale della board.
            const [boardTime] = await conn.execute('SELECT updated_at FROM boards WHERE id = ?', [numericBoardId]);
            if (boardTime.length > 0 && boardTime[0].updated_at) {
                const currentTimestamp = new Date(boardTime[0].updated_at).getTime();
                console.log(`[Service-GroupProd] Recuperato updated_at (${currentTimestamp}) per Board ${numericBoardId} dopo touch (affectedRows: ${result.affectedRows}).`);
                return currentTimestamp;
            } else {
                console.error(`[Service-GroupProd] Errore critico: Impossibile recuperare updated_at per Board ${numericBoardId} dopo touch tentativo.`);
                return null;
            }
        } catch (touchError) {
            console.error(`[Service-GroupProd] Errore durante _touchBoardAndGetTimestamp per Board ${numericBoardId}:`, touchError);
            return null; // Restituisce null in caso di errore DB
        }
    }

    /**
     * Verifica che una data lavagna appartenga a un dato gruppo.
     * (Esistente nel codice fornito, mantenuta)
     * @param {number} groupId - ID del gruppo.
     * @param {number} boardId - ID della lavagna.
     * @param {object|null} conn - Connessione DB opzionale (per transazioni).
     * @returns {Promise<object>} - Dettagli della lavagna (incluso is_group_default) se appartiene al gruppo.
     * @throws {Error} Se la lavagna non esiste o non appartiene al gruppo.
     */
    async _validateBoardInGroup(groupId, boardId, conn = null) {
        const connection = conn || pool;
        const numericGId = parseInt(groupId);
        const numericBId = parseInt(boardId);
        if (isNaN(numericGId) || numericGId <= 0 || isNaN(numericBId) || numericBId <= 0) { // Controllo > 0
            throw new Error("ID Gruppo o Lavagna non validi.");
        }

        const boardDetails = await boardModel.getBoardDetails(numericBId, connection); // Usa boardModel

        if (!boardDetails) {
            throw new Error(`Lavagna con ID ${numericBId} non trovata.`);
        }
        if (boardDetails.group_id !== numericGId) {
            throw new Error(`Lavagna ${numericBId} non appartiene al gruppo ${numericGId}.`);
        }
        // Converte il valore TINYINT(1) o simile in booleano JS
        boardDetails.is_group_default = !!boardDetails.is_group_default;
        return boardDetails;
    }

    /**
     * Verifica i permessi per modificare/eliminare prodotti basati sul ruolo e tipo di lavagna.
     * Permette 'update' (toggle) a level2 anche su default board.
     * (Esistente nel codice fornito, mantenuta)
     * @param {string} userRole - Ruolo dell'utente ('admin', 'level1', 'level2').
     * @param {object} boardDetails - Dettagli della lavagna (con is_group_default booleano).
     * @param {string} action - Azione da compiere ('create', 'update', 'delete').
     * @throws {Error} Se l'utente non ha i permessi per 'create' o 'delete' sulla default board.
     */
    _checkProductPermissions(userRole, boardDetails, action) {
        const isDefaultBoard = !!boardDetails.is_group_default; // Assicura booleano

        // Blocca solo creazione/eliminazione per level2 su default board
        if (userRole === 'level2' && isDefaultBoard && ['create', 'delete'].includes(action)) {
            console.warn(`[Service-GroupProd] Permesso negato: Ruolo ${userRole} su lavagna default ${boardDetails.id} per azione ${action}.`);
            let actionVerb = action === 'create' ? 'creare' : 'eliminare';
            throw new Error(`Permesso negato: I Contributor non possono ${actionVerb} elementi sulla lavagna di default del gruppo.`);
        }
        console.log(`[Service-GroupProd] Permesso verificato per Role ${userRole}, Action ${action} on Board ${boardDetails.id} (isDefault: ${isDefaultBoard})`);
    }


    /**
     * Recupera tutti i prodotti di una lavagna di gruppo, includendo il nome dell'ultimo utente modificatore.
     * (Esistente nel codice fornito, mantenuta)
     * @param {number} userId - ID dell'utente (per logging/future audit).
     * @param {number} groupId - ID del gruppo.
     * @param {number} boardId - ID della lavagna.
     * @returns {Promise<Array>} - Array dei prodotti, con campo 'lastModifiedByUsername'.
     */
    async getProducts(userId, groupId, boardId) {
        const numericBId = parseInt(boardId);
        const numericGId = parseInt(groupId);
        try {
            // Validazione che la board appartenga al gruppo (non necessita di connessione transazionale)
            await this._validateBoardInGroup(numericGId, numericBId);
            console.log(`[Service-GroupProd] Fetching products for Board ${numericBId} (Group ${numericGId}) including modifier username`);

            // Query con LEFT JOIN per ottenere username
            const sqlQuery = `
                SELECT
                    p.id,
                    p.board_id,
                    p.name,
                    p.is_purchased,
                    p.created_at,
                    p.updated_at,
                    p.created_by,
                    p.last_modified_by,
                    u_mod.username AS lastModifiedByUsername
                FROM products p
                LEFT JOIN users u_mod ON p.last_modified_by = u_mod.id
                WHERE p.board_id = ?
                ORDER BY p.created_at ASC
            `;

            const [products] = await pool.execute(sqlQuery, [numericBId]);

            // Mappa per convertire is_purchased in booleano
            return products.map(p => ({
                ...p,
                is_purchased: !!p.is_purchased,
                // lastModifiedByUsername è già selezionato con alias
            }));
        } catch (error) {
            console.error(`[Service-GroupProd] Errore in getProducts (Board ${numericBId}, Group ${numericGId}):`, error);
            throw error; // Rilancia l'errore per gestione nel controller
        }
    }

    /**
     * Crea un nuovo prodotto in una lavagna di gruppo.
     * (Esistente nel codice fornito, mantenuta)
     * @returns {Promise<Object>} Il prodotto creato con campo actionCompletionTimestamp.
     */
    async createProduct(userId, groupId, boardId, userRole, name, is_purchased = false) {
        const conn = await pool.getConnection();
        const numericGId = parseInt(groupId);
        const numericBId = parseInt(boardId);
        try {
            await conn.beginTransaction();
            console.log(`[Service-GroupProd] Inizio TX createProduct Board ${numericBId}, Group ${numericGId}, User ${userId}`);
            const boardDetails = await this._validateBoardInGroup(numericGId, numericBId, conn);
            this._checkProductPermissions(userRole, boardDetails, 'create');

            const trimmedName = name?.trim();
            if (!trimmedName) { throw new Error("Il nome del prodotto non può essere vuoto."); }

            const [result] = await conn.execute(
                `INSERT INTO products (board_id, name, is_purchased, created_by, last_modified_by, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [numericBId, trimmedName, is_purchased ? 1 : 0, userId, userId] // last_modified_by = userId
            );
            const newProductId = result.insertId;
            if (!newProductId || newProductId <= 0) { throw new Error("Errore DB: Impossibile ottenere ID nuovo prodotto."); }

            // Ottieni timestamp DOPO touch
            const completionTimestamp = await this._touchBoardAndGetTimestamp(numericBId, conn);

            // Recupera il prodotto appena creato CON USERNAME
            const [productRows] = await conn.execute(
                `SELECT p.*, u_mod.username AS lastModifiedByUsername
                  FROM products p
                  LEFT JOIN users u_mod ON p.last_modified_by = u_mod.id
                  WHERE p.id = ?`,
                [newProductId]
            );

            await conn.commit();
            console.log(`[Service-GroupProd] Prodotto ${newProductId} creato in Board ${numericBId}. Timestamp Board: ${completionTimestamp}`);

            if (productRows.length === 0) { throw new Error("Errore recupero prodotto dopo creazione.") };
            const newProduct = productRows[0];
            newProduct.is_purchased = !!newProduct.is_purchased;
            // Aggiungi timestamp alla risposta
            newProduct.actionCompletionTimestamp = completionTimestamp;
            return newProduct; // Include lastModifiedByUsername

        } catch (error) {
            if (conn) await conn.rollback();
            console.error(`[Service-GroupProd] Errore in createProduct (Board ${numericBId}, Group ${numericGId}):`, error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Aggiorna un prodotto esistente (nome o stato is_purchased).
     * (Esistente nel codice fornito, mantenuta)
     * @returns {Promise<Object>} L'oggetto prodotto aggiornato, includendo `actionCompletionTimestamp` e `lastModifiedByUsername`.
     */
    async updateProduct(userId, groupId, boardId, productId, userRole, name, is_purchased) {
        if (name === undefined && is_purchased === undefined) { throw new Error("Devi fornire almeno 'name' o 'is_purchased'."); }
        const conn = await pool.getConnection();
        const numericGId = parseInt(groupId); const numericBId = parseInt(boardId); const numericPId = parseInt(productId);
        if (isNaN(numericGId) || numericGId <= 0 || isNaN(numericBId) || numericBId <= 0 || isNaN(numericPId) || numericPId <= 0) { throw new Error("ID non validi forniti."); }

        try {
            await conn.beginTransaction();
            console.log(`[Service-GroupProd] Inizio TX updateProduct ${numericPId}, Board ${numericBId}, Group ${numericGId}, User ${userId}`);
            const boardDetails = await this._validateBoardInGroup(numericGId, numericBId, conn);
            this._checkProductPermissions(userRole, boardDetails, 'update'); // Permette level2 anche su default

            // Verifica preventiva se l'update è effettivamente necessario
            const [currentRow] = await conn.execute('SELECT name, is_purchased FROM products WHERE id = ? AND board_id = ?', [numericPId, numericBId]);
            if (currentRow.length === 0) throw new Error(`Prodotto ${numericPId} non trovato sulla lavagna ${numericBId} per aggiornamento.`);

            let fieldsToUpdate = [];
            const params = [userId]; // Il primo parametro è sempre per last_modified_by
            let dataChangedInProduct = false;

            const currentDbName = currentRow[0].name;
            const currentDbPurchased = !!currentRow[0].is_purchased;
            const newTrimmedName = name !== undefined ? name.trim() : undefined;
            const newPurchasedValue = is_purchased !== undefined ? (typeof is_purchased === 'boolean' ? is_purchased : !!is_purchased) : undefined;

            if (newTrimmedName !== undefined) {
                if (!newTrimmedName) throw new Error("Il nome del prodotto non può essere vuoto se fornito.");
                if (newTrimmedName !== currentDbName) {
                    fieldsToUpdate.push('name = ?');
                    params.push(newTrimmedName);
                    dataChangedInProduct = true;
                }
            }

            if (newPurchasedValue !== undefined) {
                if (newPurchasedValue !== currentDbPurchased) {
                    fieldsToUpdate.push('is_purchased = ?');
                    params.push(newPurchasedValue ? 1 : 0);
                    dataChangedInProduct = true;
                }
            }

            // Esegui l'UPDATE solo se c'è qualcosa da cambiare nel prodotto stesso
            if (dataChangedInProduct) {
                let query = `UPDATE products SET updated_at = NOW(), last_modified_by = ? ${fieldsToUpdate.length > 0 ? ', ' + fieldsToUpdate.join(', ') : ''} WHERE id = ? AND board_id = ?`;
                params.push(numericPId, numericBId);
                const [result] = await conn.execute(query, params);
                if (result.affectedRows === 0) {
                    console.warn(`[Service-GroupProd] Update non ha modificato righe per prodotto ${numericPId}, possibile race condition o dato già aggiornato.`);
                }
            } else {
                console.warn(`[Service-GroupProd] Update prodotto ${numericPId}: Nessuna modifica ai dati del prodotto rilevata, ma si procede al touch.`);
            }

            // Ottieni timestamp DOPO touch (esegui sempre il touch anche se il prodotto non è cambiato)
            const completionTimestamp = await this._touchBoardAndGetTimestamp(numericBId, conn);

            // Recupera il prodotto aggiornato (o attuale se non modificato) CON USERNAME
            const [productRows] = await conn.execute(
                `SELECT p.*, u_mod.username AS lastModifiedByUsername
                 FROM products p
                 LEFT JOIN users u_mod ON p.last_modified_by = u_mod.id
                 WHERE p.id = ?`,
                [numericPId]
            );

            await conn.commit();
            if (dataChangedInProduct) console.log(`[Service-GroupProd] Prodotto ${numericPId} aggiornato in Board ${numericBId}. Timestamp Board: ${completionTimestamp}`);
            else console.log(`[Service-GroupProd] Prodotto ${numericPId} non modificato, ma Board ${numericBId} toccata. Timestamp Board: ${completionTimestamp}`);

            if (productRows.length === 0) { throw new Error("Errore critico: impossibile recuperare il prodotto dopo l'operazione.") };
            const updatedProduct = productRows[0];
            updatedProduct.is_purchased = !!updatedProduct.is_purchased;
            // Aggiungi timestamp alla risposta
            updatedProduct.actionCompletionTimestamp = completionTimestamp;
            return updatedProduct; // Include lastModifiedByUsername

        } catch (error) {
            if (conn) await conn.rollback();
            console.error(`[Service-GroupProd] Errore in updateProduct (Product ${numericPId}, Board ${numericBId}):`, error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    /**
     * Elimina un prodotto da una lavagna di gruppo.
     * (Esistente nel codice fornito, mantenuta)
     * @returns {Promise<{success: boolean, actionCompletionTimestamp: number | null}>}
     */
    async deleteProduct(userId, groupId, boardId, productId, userRole) {
        const conn = await pool.getConnection();
        const numericGId = parseInt(groupId); const numericBId = parseInt(boardId); const numericPId = parseInt(productId);
        if (isNaN(numericGId) || numericGId <= 0 || isNaN(numericBId) || numericBId <= 0 || isNaN(numericPId) || numericPId <= 0) { throw new Error("ID non validi forniti."); }

        try {
            await conn.beginTransaction();
            console.log(`[Service-GroupProd] Inizio TX deleteProduct ${numericPId}, Board ${numericBId}, Group ${numericGId}, User ${userId}`);
            const boardDetails = await this._validateBoardInGroup(numericGId, numericBId, conn);
            this._checkProductPermissions(userRole, boardDetails, 'delete'); // Verifica permessi eliminazione

            const [result] = await conn.execute('DELETE FROM products WHERE id = ? AND board_id = ?', [numericPId, numericBId]);
            if (result.affectedRows === 0) { throw new Error(`Prodotto con ID ${numericPId} non trovato sulla lavagna ${numericBId}.`); }

            // Ottieni timestamp DOPO touch
            const completionTimestamp = await this._touchBoardAndGetTimestamp(numericBId, conn);

            await conn.commit();
            console.log(`[Service-GroupProd] Prodotto ${numericPId} eliminato da Board ${numericBId}. Timestamp Board: ${completionTimestamp}`);
            // Restituisci oggetto con timestamp
            return { success: true, actionCompletionTimestamp: completionTimestamp };

        } catch (error) {
            if (conn) await conn.rollback();
            console.error(`[Service-GroupProd] Errore in deleteProduct (Product ${numericPId}, Board ${numericBId}):`, error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    }

    // --- NUOVO METODO PER AGGIUNTA BATCH --- <-- AGGIUNTA QUI
    /**
     * Crea multipli prodotti in una lavagna di gruppo da un array di nomi.
     * Esegue gli inserimenti in una transazione.
     * @param {number} userId - ID dell'utente che esegue l'azione.
     * @param {number} groupId - ID del gruppo.
     * @param {number} boardId - ID della lavagna.
     * @param {string} userRole - Ruolo dell'utente nel gruppo.
     * @param {string[]} names - Array di nomi dei prodotti da aggiungere.
     * @returns {Promise<{addedCount: number, actionCompletionTimestamp: number | null}>} Oggetto con il conteggio dei prodotti aggiunti e il timestamp finale.
     * @throws {Error} Se input, permessi o operazione DB falliscono.
     */
    async createMultipleProducts(userId, groupId, boardId, userRole, names) {
        // Validazione input array a monte (prima di ottenere connessione)
        if (!Array.isArray(names) || names.length === 0) {
            throw new Error("Array 'names' richiesto.");
        }
        // Pulisci e filtra i nomi: trim, rimuovi vuoti, controlla lunghezza
        const validNames = names.map(name => typeof name === 'string' ? name.trim() : '')
            .filter(name => name.length > 0 && name.length <= 255);
        if (validNames.length === 0) {
            throw new Error("Nessun nome prodotto valido fornito.");
        }

        const conn = await pool.getConnection();
        const numericGId = parseInt(groupId); const numericBId = parseInt(boardId);
        let addedCount = 0;

        try {
            await conn.beginTransaction();
            console.log(`[Service-GroupProd Batch] TX START - Add ${validNames.length} products to Board ${numericBId}, Group ${numericGId}, by User ${userId}`);

            // Validazione board e permessi (una sola volta all'inizio della transazione)
            const boardDetails = await this._validateBoardInGroup(numericGId, numericBId, conn);
            // Utilizza _checkProductPermissions per 'create', che blocca level2 su default board
            this._checkProductPermissions(userRole, boardDetails, 'create');

            // Query INSERT preparata
            const sqlInsert = `INSERT INTO products (board_id, name, is_purchased, created_by, last_modified_by, created_at, updated_at) VALUES (?, ?, 0, ?, ?, NOW(), NOW())`;

            // Loop per inserire i prodotti uno per uno (più sicuro per eventuali errori individuali)
            for (const name of validNames) {
                try {
                    // Imposta userId sia per created_by che per last_modified_by
                    const paramsInsert = [numericBId, name, userId, userId];
                    const [result] = await conn.execute(sqlInsert, paramsInsert);
                    if (result.insertId > 0) {
                        addedCount++;
                    } else {
                        // Questo non dovrebbe accadere con AUTO_INCREMENT, ma logghiamo per sicurezza
                        console.warn(`[Service-GroupProd Batch] Inserimento per "${name}" in Board ${numericBId} non ha restituito un insertId > 0.`);
                    }
                } catch (insertError) {
                    // Logga l'errore per il singolo prodotto ma continua con gli altri
                    // Potrebbe essere un duplicato se ci fosse un UNIQUE constraint sul nome+board_id (che non abbiamo)
                    console.error(`[Service-GroupProd Batch] Errore durante l'inserimento del prodotto "${name}" in Board ${numericBId}:`, insertError.message);
                    // Non rilanciare l'errore qui per permettere alla transazione di continuare
                }
            }
            console.log(`[Service-GroupProd Batch] Tentativi di inserimento completati. Prodotti effettivamente inseriti: ${addedCount} / ${validNames.length}.`);

            // Aggiorna timestamp board DOPO tutti gli inserimenti riusciti (anche se 0 aggiunti, per consistenza)
            const completionTimestamp = await this._touchBoardAndGetTimestamp(numericBId, conn);

            await conn.commit();
            console.log(`[Service-GroupProd Batch] TX COMMIT per Board ${numericBId}. Added: ${addedCount}. Timestamp: ${completionTimestamp}`);
            // Restituisci il conteggio effettivo e il timestamp
            return { addedCount: addedCount, actionCompletionTimestamp: completionTimestamp };

        } catch (error) {
            // Errore generale (es. validazione board, permessi, commit)
            if (conn) {
                console.error(`[Service-GroupProd Batch] Errore generale nella transazione per Board ${numericBId}, Group ${numericGId}. Eseguo ROLLBACK.`);
                await conn.rollback();
            }
            console.error(`[Service-GroupProd Batch] Dettagli errore:`, error);
            // Rilancia l'errore perché sia gestito dal controller
            throw error;
        } finally {
            if (conn) {
                conn.release();
            }
        }
    }
    // --- FINE NUOVO METODO ---

} // Fine classe GroupProductService

module.exports = new GroupProductService();