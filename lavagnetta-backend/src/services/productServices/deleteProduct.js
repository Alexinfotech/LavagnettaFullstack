// backend/services/productServices/deleteProduct.js

const productModel = require('../../models/productModel');

/**
 * Servizio per eliminare un prodotto.
 * Il model ora tocca la board e restituisce un oggetto con l'esito e il timestamp.
 * @param {number} userId - ID dell'utente.
 * @param {number} boardId - ID della lavagnetta.
 * @param {number} productId - ID del prodotto.
 * @returns {Promise<{success: boolean, actionCompletionTimestamp: number | null}>} - Oggetto con esito e timestamp.
 */
const deleteProduct = async (userId, boardId, productId) => {
    try {
        // Chiama il model che ora restituisce { success: true, actionCompletionTimestamp: ... }
        const result = await productModel.deleteProduct(userId, boardId, productId);
        // Restituisce direttamente l'oggetto ricevuto dal model
        return result;
    } catch (error) {
        // Rilancia l'errore per gestirlo nel controller
        throw error;
    }
};

module.exports = deleteProduct;