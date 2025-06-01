// backend/models/productModel.js
const pool = require('../config/db');

/**
 * Funzione helper interna per aggiornare il timestamp updated_at della lavagna personale padre
 * e restituire il nuovo timestamp in millisecondi UTC.
 * @param {number} boardId - ID della lavagna da "toccare".
 * @param {number} userId - ID dell'utente proprietario della lavagna (per sicurezza).
 * @param {object} dbConnection - Connessione al DB (pool o connection transazionale).
 * @returns {Promise<number|null>} - Timestamp in ms UTC o null se errore/non aggiornato.
 */
const _touchBoardAndGetTimestamp = async (boardId, userId, dbConnection) => {
    const numericBoardId = parseInt(boardId);
    const numericUserId = parseInt(userId);
    if (!dbConnection || isNaN(numericBoardId) || numericBoardId <= 0 || isNaN(numericUserId) || numericUserId <= 0) {
        console.warn(`[productModel._touchBoardAndGetTimestamp] Connessione o ID non validi. BoardID: ${boardId}, UserID: ${userId}`);
        return null;
    }
    try {
        // Esegui l'update verificando anche userId per sicurezza
        const touchBoardQuery = 'UPDATE boards SET updated_at = NOW() WHERE id = ? AND user_id = ?';
        const [result] = await dbConnection.execute(touchBoardQuery, [numericBoardId, numericUserId]);

        // Recupera il timestamp attuale della board
        const [boardTime] = await dbConnection.execute('SELECT updated_at FROM boards WHERE id = ?', [numericBoardId]);
        if (boardTime.length > 0 && boardTime[0].updated_at) {
            const currentTimestamp = new Date(boardTime[0].updated_at).getTime();
            console.log(`[productModel._touchBoardAndGetTimestamp] Recuperato updated_at (${currentTimestamp}) per Board ${numericBoardId} dopo touch (affectedRows: ${result.affectedRows}).`);
            return currentTimestamp;
        } else {
            console.error(`[productModel._touchBoardAndGetTimestamp] Errore critico: Impossibile recuperare updated_at per Board ${numericBoardId} dopo touch tentativo.`);
            return null;
        }
    } catch (touchError) {
        console.error(`[productModel._touchBoardAndGetTimestamp] Errore DB per Board ${numericBoardId}:`, touchError);
        return null; // Restituisce null in caso di errore DB
    }
};


/**
 * Ottiene tutti i prodotti di una lavagnetta per un utente.
 * (Nessuna modifica qui per lastModifiedByUsername come richiesto per le board personali).
 * @param {number} userId - ID dell'utente.
 * @param {number} boardId - ID della lavagnetta.
 * @returns {Promise<Array>} - Array di prodotti.
 */
const getProductsByBoardId = async (userId, boardId) => {
    try {
        const [rows] = await pool.execute(
            `SELECT p.id, p.board_id, p.name, p.is_purchased, p.created_at, p.updated_at, p.created_by, p.last_modified_by
             FROM products p
             INNER JOIN boards b ON p.board_id = b.id
             WHERE p.board_id = ? AND b.user_id = ?
             ORDER BY p.created_at ASC`, // Aggiunto ORDER BY
            [boardId, userId]
        );
        // Converti is_purchased in boolean
        return rows.map(p => ({ ...p, is_purchased: !!p.is_purchased }));
    } catch (error) {
        console.error(`[productModel.getProductsByBoardId] Errore DB - User: ${userId}, Board: ${boardId}`, error);
        throw error; // Rilancia l'errore
    }
};

/**
 * Crea un nuovo prodotto in una lavagnetta.
 * **MODIFICATO: Tocca la board e restituisce actionCompletionTimestamp.**
 * @param {number} userId - ID dell'utente.
 * @param {number} boardId - ID della lavagnetta.
 * @param {string} name - Nome del prodotto.
 * @param {boolean} is_purchased - Stato di acquisto.
 * @returns {Promise<Object>} - Prodotto creato con campo actionCompletionTimestamp.
 * @throws {Error} Se la lavagnetta non è trovata o accesso non autorizzato o errore DB.
 */
const createProduct = async (userId, boardId, name, is_purchased = false) => {
    console.log(`[productModel.createProduct] LOG 1: Inizio - User: ${userId}, Board: ${boardId}, Name: ${name}`);
    let conn; // Definisci la connessione per usarla nel finally
    try {
        // Verifica che la lavagnetta appartenga all'utente
        const [boardRows] = await pool.execute('SELECT id FROM boards WHERE id = ? AND user_id = ?', [boardId, userId]);
        if (boardRows.length === 0) {
            console.error(`[productModel.createProduct] LOG 2: Errore - Board ${boardId} non trovata per User ${userId}`);
            throw new Error('Lavagnetta non trovata o accesso non autorizzato.');
        }
        console.log(`[productModel.createProduct] LOG 3: Board ${boardId} verificata per User ${userId}`);

        // Utilizza una transazione per coerenza tra insert e touch
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // Aggiungiamo i campi created_by e last_modified_by (già presente)
        const sqlInsert = `INSERT INTO products (board_id, name, is_purchased, created_by, last_modified_by, created_at, updated_at)
                           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`;
        const paramsInsert = [boardId, name.trim(), is_purchased ? 1 : 0, userId, userId]; // Assicura trim del nome

        console.log(`[productModel.createProduct] LOG 4: Eseguo INSERT (TX):`, sqlInsert, paramsInsert);
        const [result] = await conn.execute(sqlInsert, paramsInsert);
        const newProductId = result.insertId;

        if (!newProductId || newProductId <= 0) {
            console.error(`[productModel.createProduct] Errore CRITICO: INSERT non ha restituito un ID valido! Risultato:`, result);
            await conn.rollback(); // Rollback in caso di errore insert
            throw new Error(`Creazione prodotto fallita: nessun ID restituito dall'inserimento.`);
        }
        console.log(`[productModel.createProduct] LOG 5: INSERT completato. Nuovo Product ID: ${newProductId}`);

        // ***** MODIFICA QUI: Tocca la board e ottieni timestamp *****
        const completionTimestamp = await _touchBoardAndGetTimestamp(boardId, userId, conn);
        // ***** FINE MODIFICA *****

        // Recupera il prodotto appena creato
        console.log(`[productModel.createProduct] LOG 6: Eseguo SELECT per recuperare prodotto ${newProductId} (TX)`);
        const [productRows] = await conn.execute('SELECT * FROM products WHERE id = ?', [newProductId]);

        await conn.commit(); // Commit solo se tutto è andato bene

        if (productRows.length === 0) {
            console.error(`[productModel.createProduct] LOG 7: Errore CRITICO: Prodotto ${newProductId} non trovato dopo INSERT/COMMIT!`);
            // Questo non dovrebbe accadere se l'insert ha funzionato e l'ID è valido
            throw new Error(`Prodotto ${newProductId} non trovato dopo la creazione (post-commit).`);
        }
        const createdProduct = productRows[0];
        createdProduct.is_purchased = !!createdProduct.is_purchased; // Assicura boolean

        // ***** MODIFICA QUI: Aggiungi timestamp al risultato *****
        createdProduct.actionCompletionTimestamp = completionTimestamp;
        // ***** FINE MODIFICA *****

        console.log(`[productModel.createProduct] LOG 8: Prodotto ${newProductId} recuperato con TS ${completionTimestamp}.`);
        return createdProduct; // Restituisce prodotto con timestamp

    } catch (error) {
        if (conn) await conn.rollback(); // Rollback in caso di qualsiasi errore nel try
        console.error(`[productModel.createProduct] LOG 9: CATCH ERRORE - User: ${userId}, Board: ${boardId}, Name: ${name}`, error);
        throw error;
    } finally {
        if (conn) conn.release(); // Rilascia la connessione in ogni caso
    }
};


/**
 * Aggiorna un prodotto.
 * **MODIFICATO: Tocca la board e restituisce actionCompletionTimestamp.**
 * @param {number} userId - ID dell'utente.
 * @param {number} boardId - ID della lavagnetta.
 * @param {number} productId - ID del prodotto.
 * @param {string|undefined} name - Nuovo nome del prodotto (se fornito).
 * @param {boolean|undefined} is_purchased - Stato di acquisto (se fornito).
 * @returns {Promise<Object>} - Prodotto aggiornato con campo actionCompletionTimestamp.
 * @throws {Error} Se la lavagnetta/prodotto non è trovata o accesso non autorizzato o errore DB.
 */
const updateProduct = async (userId, boardId, productId, name, is_purchased) => {
    console.log(`[productModel.updateProduct] Inizio - User: ${userId}, Board: ${boardId}, Product: ${productId}`);
    let conn; // Definisci la connessione per usarla nel finally
    try {
        // Verifica che la lavagnetta appartenga all'utente
        const [boardRows] = await pool.execute('SELECT id FROM boards WHERE id = ? AND user_id = ?', [boardId, userId]);
        if (boardRows.length === 0) {
            console.error(`[productModel.updateProduct] Errore: Board ${boardId} non trovata per User ${userId}`);
            throw new Error('Lavagnetta non trovata o accesso non autorizzato.');
        }
        console.log(`[productModel.updateProduct] Board ${boardId} verificata per User ${userId}`);

        conn = await pool.getConnection();
        await conn.beginTransaction();

        // Verifica se l'update è necessario
        const [currentRow] = await conn.execute('SELECT name, is_purchased FROM products WHERE id = ? AND board_id = ?', [productId, boardId]);
        if (currentRow.length === 0) throw new Error(`Prodotto ${productId} non trovato sulla lavagna ${boardId} per aggiornamento.`);

        let fieldsToUpdate = [];
        const params = [userId]; // Primo parametro per last_modified_by
        let dataChangedInProduct = false;

        const currentDbName = currentRow[0].name;
        const currentDbPurchased = !!currentRow[0].is_purchased;
        const newTrimmedName = name !== undefined ? name.trim() : undefined;
        const newPurchasedValue = is_purchased !== undefined ? (typeof is_purchased === 'boolean' ? is_purchased : !!is_purchased) : undefined;

        if (newTrimmedName !== undefined) {
            if (!newTrimmedName) { await conn.rollback(); throw new Error("Il nome del prodotto non può essere vuoto se fornito."); }
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
            params.push(productId, boardId);
            console.log(`[productModel.updateProduct] Eseguo UPDATE (TX):`, query, params);
            const [result] = await conn.execute(query, params);
            console.log(`[productModel.updateProduct] UPDATE completato. AffectedRows: ${result.affectedRows}`);
            if (result.affectedRows === 0) {
                console.warn(`[productModel.updateProduct] AffectedRows = 0 per Product ${productId}, Board ${boardId}. Nessuna modifica effettiva o race condition.`);
            }
        } else {
            console.warn(`[productModel.updateProduct] Nessuna modifica ai dati del prodotto rilevata, ma si procede al touch.`);
        }

        // ***** MODIFICA QUI: Tocca la board e ottieni timestamp (sempre) *****
        const completionTimestamp = await _touchBoardAndGetTimestamp(boardId, userId, conn);
        // ***** FINE MODIFICA *****

        // Recupera il prodotto aggiornato (o attuale se non modificato)
        const [productRows] = await conn.execute('SELECT * FROM products WHERE id = ?', [productId]);

        await conn.commit(); // Commit dopo touch e select

        if (productRows.length === 0) {
            console.error(`[productModel.updateProduct] Errore CRITICO: Prodotto ${productId} non trovato dopo UPDATE/COMMIT!`);
            throw new Error('Prodotto non trovato dopo l\'aggiornamento (post-commit).');
        }

        const updatedProduct = productRows[0];
        updatedProduct.is_purchased = !!updatedProduct.is_purchased; // Assicura boolean

        // ***** MODIFICA QUI: Aggiungi timestamp al risultato *****
        updatedProduct.actionCompletionTimestamp = completionTimestamp;
        // ***** FINE MODIFICA *****

        console.log(`[productModel.updateProduct] Prodotto ${productId} aggiornato/recuperato con TS ${completionTimestamp}.`);
        return updatedProduct; // Restituisce prodotto con timestamp

    } catch (error) {
        if (conn) await conn.rollback(); // Rollback in caso di errore
        console.error(`[productModel.updateProduct] CATCH ERRORE - User: ${userId}, Board: ${boardId}, Product: ${productId}`, error);
        throw error;
    } finally {
        if (conn) conn.release(); // Rilascia connessione
    }
};


/**
 * Elimina un prodotto.
 * **MODIFICATO: Tocca la board e restituisce { success: boolean, actionCompletionTimestamp: number | null }**
 * @param {number} userId - ID dell'utente.
 * @param {number} boardId - ID della lavagnetta.
 * @param {number} productId - ID del prodotto.
 * @returns {Promise<{success: boolean, actionCompletionTimestamp: number | null}>}
 * @throws {Error} Se la lavagnetta/prodotto non è trovata o accesso non autorizzato o errore DB.
 */
const deleteProduct = async (userId, boardId, productId) => {
    console.log(`[productModel.deleteProduct] Inizio - User: ${userId}, Board: ${boardId}, Product: ${productId}`);
    let conn; // Definisci la connessione per usarla nel finally
    try {
        // Verifica che la lavagnetta appartenga all'utente
        const [boardRows] = await pool.execute('SELECT id FROM boards WHERE id = ? AND user_id = ?', [boardId, userId]);
        if (boardRows.length === 0) {
            console.error(`[productModel.deleteProduct] Errore: Board ${boardId} non trovata per User ${userId}`);
            throw new Error('Lavagnetta non trovata o accesso non autorizzato.');
        }
        console.log(`[productModel.deleteProduct] Board ${boardId} verificata per User ${userId}`);

        conn = await pool.getConnection();
        await conn.beginTransaction();

        const sqlDelete = 'DELETE FROM products WHERE id = ? AND board_id = ?';
        const paramsDelete = [productId, boardId];

        console.log(`[productModel.deleteProduct] Eseguo DELETE (TX):`, sqlDelete, paramsDelete);
        const [result] = await conn.execute(sqlDelete, paramsDelete);
        console.log(`[productModel.deleteProduct] DELETE completato. AffectedRows: ${result.affectedRows}`);

        if (result.affectedRows === 0) {
            await conn.rollback(); // Non serve toccare la board se il prodotto non è stato trovato/eliminato
            console.warn(`[productModel.deleteProduct] AffectedRows = 0 per Product ${productId}, Board ${boardId}. Prodotto già eliminato?`);
            throw new Error('Prodotto non trovato o accesso non autorizzato.');
        }

        // ***** MODIFICA QUI: Tocca la board e ottieni timestamp *****
        const completionTimestamp = await _touchBoardAndGetTimestamp(boardId, userId, conn);
        // ***** FINE MODIFICA *****

        await conn.commit(); // Commit dopo delete e touch

        console.log(`[productModel.deleteProduct] Prodotto ${productId} eliminato con successo. TS: ${completionTimestamp}`);

        // ***** MODIFICA QUI: Restituisci oggetto con timestamp *****
        return { success: true, actionCompletionTimestamp: completionTimestamp };
        // ***** FINE MODIFICA *****

    } catch (error) {
        if (conn) await conn.rollback(); // Rollback in caso di errore
        console.error(`[productModel.deleteProduct] CATCH ERRORE - User: ${userId}, Board: ${boardId}, Product: ${productId}`, error);
        throw error; // Rilancia l'errore
    } finally {
        if (conn) conn.release(); // Rilascia connessione
    }
};

module.exports = {
    getProductsByBoardId,
    createProduct,
    updateProduct,
    deleteProduct,
    // Non esportare _touchBoardAndGetTimestamp, è interna al modello
};