// backend/services/productServices/createProduct.js

const productModel = require('../../models/productModel');

/**
 * Servizio per creare un nuovo prodotto.
 * Il model ora restituisce l'oggetto prodotto con actionCompletionTimestamp.
 * @param {number} userId - ID dell'utente.
 * @param {number} boardId - ID della lavagnetta.
 * @param {string} name - Nome del prodotto.
 * @param {boolean} is_purchased - Stato di acquisto.
 * @returns {Promise<Object>} - Prodotto creato (include actionCompletionTimestamp).
 */
const createProduct = async (userId, boardId, name, is_purchased) => {
    try {
        // Chiama il model che ora restituisce il prodotto con il timestamp
        const product = await productModel.createProduct(userId, boardId, name, is_purchased);
        // Restituisce direttamente l'oggetto ricevuto dal model
        return product;
    } catch (error) {
        // Rilancia l'errore per gestirlo nel controller
        // Non è necessario wrapparlo in new Error() se è già un Error
        throw error;
    }
};

module.exports = createProduct;