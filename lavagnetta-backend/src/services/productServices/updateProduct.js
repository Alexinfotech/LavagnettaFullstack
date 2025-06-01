// backend/services/productServices/updateProduct.js

const productModel = require('../../models/productModel');

/**
 * Servizio per aggiornare un prodotto esistente.
 * Il model ora restituisce l'oggetto prodotto aggiornato con actionCompletionTimestamp.
 * @param {number} userId - ID dell'utente.
 * @param {number} boardId - ID della lavagnetta.
 * @param {number} productId - ID del prodotto.
 * @param {string|undefined} name - Nuovo nome del prodotto (se fornito).
 * @param {boolean|undefined} is_purchased - Stato di acquisto (se fornito).
 * @returns {Promise<Object>} - Prodotto aggiornato (include actionCompletionTimestamp).
 */
const updateProduct = async (userId, boardId, productId, name, is_purchased) => {
    try {
        // Chiama il model che ora restituisce il prodotto aggiornato con il timestamp
        const updatedProduct = await productModel.updateProduct(userId, boardId, productId, name, is_purchased);
        // Restituisce direttamente l'oggetto ricevuto dal model
        return updatedProduct;
    } catch (error) {
        // Rilancia l'errore per gestirlo nel controller
        // Non è necessario wrapparlo se è già un Error
        throw error;
    }
};

module.exports = updateProduct;